import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RemotePeer {
  userId: string;
  displayName: string;
  stream: MediaStream | null;
}

export interface ChatMessage {
  sender: string;
  content: string;
  timestamp: Date;
}

export interface TranscriptLine {
  speaker: string;
  text: string;
  timestamp: Date;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'b6fce5050ba0c847926524eb',
      credential: 'yn5qJ1odWWeQqlAX',
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: 'b6fce5050ba0c847926524eb',
      credential: 'yn5qJ1odWWeQqlAX',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'b6fce5050ba0c847926524eb',
      credential: 'yn5qJ1odWWeQqlAX',
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: 'b6fce5050ba0c847926524eb',
      credential: 'yn5qJ1odWWeQqlAX',
    },
  ],
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function useWebRTC(meetingCode: string, userId: string, displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoOn,     setVideoOn]     = useState(true);
  const [audioOn,     setAudioOn]     = useState(true);
  const [peers,       setPeers]       = useState<RemotePeer[]>([]);
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [transcript,  setTranscript]  = useState<TranscriptLine[]>([]);

  const socketRef      = useRef<Socket | null>(null);
  const peerConns      = useRef<Record<string, RTCPeerConnection>>({});
  const streamRef      = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ✅ FIX 1: Cache display names so offer/answer handlers can resolve them
  const peerNames = useRef<Record<string, string>>({});

  const createPeerConnection = useCallback(
    (remoteId: string, remoteName: string, socket: Socket): RTCPeerConnection => {
      // ✅ FIX 2: Avoid duplicate peer connections
      if (peerConns.current[remoteId]) {
        console.warn(`[${remoteId}] PeerConnection already exists, reusing.`);
        return peerConns.current[remoteId];
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConns.current[remoteId] = pc;

      // ✅ FIX 3: Cache the name at creation time
      peerNames.current[remoteId] = remoteName;

      streamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current!);
      });

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setPeers((prev) => {
          const exists = prev.find((p) => p.userId === remoteId);
          if (exists) {
            return prev.map((p) =>
              p.userId === remoteId ? { ...p, stream: remoteStream } : p
            );
          }
          return [...prev, { userId: remoteId, displayName: remoteName, stream: remoteStream }];
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: remoteId, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[${remoteName}] connection state: ${pc.connectionState}`);

        // ✅ FIX 4: Clean up failed/closed connections so they can reconnect
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          console.warn(`[${remoteName}] connection ${pc.connectionState}, cleaning up.`);
          delete peerConns.current[remoteId];
        }
      };

      // ✅ FIX 5: Add peer to state immediately (with null stream) so UI shows them
      setPeers((prev) => {
        if (prev.find((p) => p.userId === remoteId)) return prev;
        return [...prev, { userId: remoteId, displayName: remoteName, stream: null }];
      });

      return pc;
    },
    []
  );

  const startTranscription = useCallback((speaker: string) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('SpeechRecognition not supported in this browser');
      return;
    }
    const recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = false;
    recognition.lang           = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            setTranscript((prev) => [
              ...prev,
              { speaker, text, timestamp: new Date() },
            ]);
          }
        }
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'no-speech') console.error('Speech error:', e.error);
    };

    recognition.onend = () => {
      try { recognition.start(); } catch (_) { /* already stopped */ }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (!userId) {
      console.warn('⚠️ userId is empty, skipping WebRTC init');
      return;
    }

    let mounted = true;

    const init = async () => {
      console.log('🚀 Initializing WebRTC | userId:', userId, '| displayName:', displayName);

      // Get camera + mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setLocalStream(stream);
        startTranscription(displayName);
      } catch {
        console.warn('Camera/mic unavailable – proceeding without media');
      }

      // Connect Socket.io — send displayName in auth so server knows who we are
      const socket = io(SOCKET_URL, {
        auth: { userId, displayName },
        // ✅ FIX 6: Reconnection settings to handle flaky connections
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 Socket connected | joining room:', meetingCode);
        socket.emit('join-room', { meetingCode, userId, displayName });
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
      });

      // ✅ FIX 7: user-joined — cache name before creating peer connection
      socket.on(
        'user-joined',
        async ({
          userId: remoteId,
          displayName: remoteName,
        }: {
          userId: string;
          displayName: string;
        }) => {
          console.log('🔔 user-joined:', remoteId, remoteName);
          if (!mounted) return;

          // Cache the display name
          peerNames.current[remoteId] = remoteName;

          const pc    = createPeerConnection(remoteId, remoteName, socket);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          // ✅ FIX 8: Send our displayName with the offer so the receiver knows who we are
          socket.emit('offer', { meetingCode, offer, to: remoteId, displayName });
        }
      );

      // ✅ FIX 9: offer handler — resolve display name from event OR cache
      socket.on(
        'offer',
        async ({
          offer,
          from,
          displayName: remoteName,
        }: {
          offer: RTCSessionDescriptionInit;
          from: string;
          displayName?: string;
        }) => {
          console.log('📨 Received offer from:', from, '| name:', remoteName);
          if (!mounted) return;

          // Resolve the best available name
          const resolvedName = remoteName || peerNames.current[from] || from;
          peerNames.current[from] = resolvedName;

          let pc = peerConns.current[from];
          if (!pc) pc = createPeerConnection(from, resolvedName, socket);

          // ✅ FIX 10: Guard against invalid state before setting remote description
          if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
            } catch (e) {
              console.error('setRemoteDescription (offer) failed:', e);
              return;
            }
          } else {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          // ✅ FIX 11: Send our displayName with the answer too
          socket.emit('answer', { to: from, answer, displayName });
        }
      );

      // ✅ FIX 12: answer handler — update peer name if we get it here
      socket.on(
        'answer',
        async ({
          answer,
          from,
          displayName: remoteName,
        }: {
          answer: RTCSessionDescriptionInit;
          from: string;
          displayName?: string;
        }) => {
          console.log('📨 Received answer from:', from);
          const pc = peerConns.current[from];
          if (!pc) return;

          // Update display name if provided and not already set correctly
          if (remoteName && peerNames.current[from] !== remoteName) {
            peerNames.current[from] = remoteName;
            setPeers((prev) =>
              prev.map((p) =>
                p.userId === from ? { ...p, displayName: remoteName } : p
              )
            );
          }

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (e) {
            console.error('setRemoteDescription (answer) failed:', e);
          }
        }
      );

      socket.on(
        'ice-candidate',
        async ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
          const pc = peerConns.current[from];
          if (pc && candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('addIceCandidate failed:', e);
            }
          }
        }
      );

      socket.on('user-left', ({ userId: leftId }: { userId: string }) => {
        console.log('👋 user-left:', leftId);
        peerConns.current[leftId]?.close();
        delete peerConns.current[leftId];
        delete peerNames.current[leftId];
        setPeers((prev) => prev.filter((p) => p.userId !== leftId));
      });

      socket.on('new-message', (msg: ChatMessage) => {
        setMessages((prev) => [
          ...prev,
          { ...msg, timestamp: new Date(msg.timestamp) },
        ]);
        setTranscript((prev) => [
          ...prev,
          {
            speaker:   msg.sender,
            text:      `[Chat] ${msg.content}`,
            timestamp: new Date(msg.timestamp),
          },
        ]);
      });

      socket.on('room:state', ({ participants }: { participants: string[] }) => {
        console.log('📋 Existing participants:', participants);
      });
    };

    init();

    return () => {
      mounted = false;
      recognitionRef.current?.stop();
      socketRef.current?.emit('leave-room', { meetingCode, userId });
      socketRef.current?.disconnect();
      Object.values(peerConns.current).forEach((pc) => pc.close());
      peerConns.current = {};
      peerNames.current = {};
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [meetingCode, userId, displayName, createPeerConnection, startTranscription]);

  const toggleVideo = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setVideoOn((v) => !v);
  }, []);

  const toggleAudio = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setAudioOn((a) => !a);
  }, []);

  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack  = screenStream.getVideoTracks()[0];

      Object.values(peerConns.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        sender?.replaceTrack(screenTrack);
      });

      if (streamRef.current) {
        const old = streamRef.current.getVideoTracks()[0];
        if (old) { streamRef.current.removeTrack(old); old.stop(); }
        streamRef.current.addTrack(screenTrack);
        setLocalStream(new MediaStream(streamRef.current.getTracks()));
      }

      screenTrack.onended = async () => {
        try {
          const cam      = await navigator.mediaDevices.getUserMedia({ video: true });
          const camTrack = cam.getVideoTracks()[0];
          Object.values(peerConns.current).forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
            sender?.replaceTrack(camTrack);
          });
          if (streamRef.current) {
            const old = streamRef.current.getVideoTracks()[0];
            if (old) { streamRef.current.removeTrack(old); old.stop(); }
            streamRef.current.addTrack(camTrack);
            setLocalStream(new MediaStream(streamRef.current.getTracks()));
          }
        } catch (e) {
          console.error('Restore camera error:', e);
        }
      };
    } catch (err) {
      console.error('Screen share error:', err);
    }
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !content.trim()) return;
      socketRef.current.emit('send-message', { roomId: meetingCode, content });
    },
    [meetingCode]
  );

  const leaveMeeting = useCallback(() => {
    recognitionRef.current?.stop();
    socketRef.current?.emit('leave-room', { meetingCode, userId });
    socketRef.current?.disconnect();
    Object.values(peerConns.current).forEach((pc) => pc.close());
    peerConns.current = {};
    peerNames.current = {};
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [meetingCode, userId]);

  return {
    localStream,
    peers,
    videoOn,
    audioOn,
    messages,
    transcript,
    toggleVideo,
    toggleAudio,
    shareScreen,
    sendMessage,
    leaveMeeting,
  };
}

export default useWebRTC;
