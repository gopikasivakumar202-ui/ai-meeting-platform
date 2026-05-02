import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || "https://api-production-b6fe.up.railway.app");
const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export default function VideoRoom() {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    start();
  }, []);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }

    peerConnection.current = new RTCPeerConnection(servers);

    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: currentPeer,
          candidate: event.candidate,
        });
      }
    };

    socket.emit("join-room", "room1");

    socket.on("user-joined", async (userId) => {
      currentPeer = userId;

      const offer = await peerConnection.current?.createOffer();
      await peerConnection.current?.setLocalDescription(offer);

      socket.emit("offer", {
        target: userId,
        sdp: offer,
      });
    });

    socket.on("offer", async ({ sdp, sender }) => {
      currentPeer = sender;

      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );

      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);

      socket.emit("answer", {
        target: sender,
        sdp: answer,
      });
    });

    socket.on("answer", async ({ sdp }) => {
      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      await peerConnection.current?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    });
  };

  let currentPeer: string = "";

  return (
    <div className="p-6">
      <h2 className="text-white mb-4">WebRTC Video Call</h2>

      <div className="grid grid-cols-2 gap-4">
        <video ref={localVideo} autoPlay muted className="bg-black" />
        <video ref={remoteVideo} autoPlay className="bg-black" />
      </div>
    </div>
  );
}