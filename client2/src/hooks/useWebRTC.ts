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
  const recognitionRef = useRef<SpeechRecognition| null>(null);

  // ── Helper: create one RTCPeerConnection ─────────────────────────────────────
  const createPeerConnection = useCallback(
    (remoteId: string, remoteName: string, socket: Socket): RTCPeerConnection => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConns.current[remoteId] = pc;

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
        console.log(`[${remoteName}] connection: ${pc.connectionState}`);
      };

      setPeers((prev) => {
        if (prev.find((p) => p.userId === remoteId)) return prev;
        return [...prev, { userId: remoteId, displayName: remoteName, stream: null }];
      });

      return pc;
    },
    []
  );

  // ── Helper: start Web Speech API transcription ────────────────────────────────
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

  // ── Main effect: init stream + socket ────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
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

      // Connect Socket.io
      const socket = io(SOCKET_URL, { auth: { userId, displayName } });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-room', { meetingCode, userId, displayName });
      });

      socket.on(
        'user-joined',
        async ({ userId: remoteId, displayName: remoteName }: { userId: string; displayName: string }) => {
          if (!mounted) return;
          const pc    = createPeerConnection(remoteId, remoteName, socket);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { meetingCode, offer, to: remoteId });
        }
      );

      socket.on(
        'offer',
        async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
          if (!mounted) return;
          let pc = peerConns.current[from];
          if (!pc) pc = createPeerConnection(from, from, socket);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { to: from, answer });
        }
      );

      socket.on(
        'answer',
        async ({ answer, from }: { answer: RTCSessionDescriptionInit; from: string }) => {
          const pc = peerConns.current[from];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      );

      socket.on(
        'ice-candidate',
        async ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
          const pc = peerConns.current[from];
          if (pc && candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      );

      socket.on('user-left', ({ userId: leftId }: { userId: string }) => {
        peerConns.current[leftId]?.close();
        delete peerConns.current[leftId];
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
        console.log('Existing participants:', participants);
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
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [meetingCode, userId, displayName, createPeerConnection, startTranscription]);

  // ── Controls ──────────────────────────────────────────────────────────────────
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