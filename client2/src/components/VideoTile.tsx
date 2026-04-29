import { useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream;
  muted?: boolean;
  label?: string;
}

export default function VideoTile({ stream, muted = false, label }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      {label && (
        <div className="absolute bottom-3 left-3 bg-gray-900/80 text-white text-xs px-3 py-1 rounded-full">
          🎤 {label}
        </div>
      )}
    </div>
  );
}