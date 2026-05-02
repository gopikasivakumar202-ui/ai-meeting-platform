/**
 * MeetingRoomPage.tsx  (Week 2 → 3 bridge)
 *
 * Fixes applied:
 *   🔧 transcript is captured and POSTed BEFORE leaveMeeting() is called
 *   🔧 Warning shown if transcript is empty when ending
 *   🔧 leaveMeeting() only called after transcript is safely sent
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoTile from '../components/VideoTile';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';

export default function MeetingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const meetingCode = id?.slice(-8).toUpperCase() ?? 'UNKNOWN';

  const {
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
 } = useWebRTC(
    id ?? '',
    user?._id ?? user?.id ?? '',   // ← try both _id and id
    user?.name ?? 'Guest',
  );

  // ── Panel visibility ──────────────────────────────────────────────────────
  const [showChat,       setShowChat]       = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isEnding,       setIsEnding]       = useState(false);

  // ── Chat input ────────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  // ── End meeting → send transcript to backend for AI summary ───────────────
  const handleEndMeeting = async () => {
    if (!id) { navigate('/dashboard'); return; }
    if (isEnding) return; // prevent double-click
    setIsEnding(true);

    // 🔧 FIX: Build transcript BEFORE calling leaveMeeting()
    const fullTranscript = transcript
      .map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.speaker}: ${l.text}`)
      .join('\n');

    console.log(`📝 Transcript lines: ${transcript.length}`);
    console.log('📝 Full transcript:', fullTranscript);

    // 🔧 FIX: Warn if transcript is empty but still proceed
    if (transcript.length === 0) {
      console.warn('⚠️ Transcript is empty — mic may not have been active or speech was not detected.');
    }

    try {
      const res = await fetch(`${SERVER_URL}/api/meetings/${id}/end-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ transcript: fullTranscript }),
      });

      if (!res.ok) {
        console.error('❌ End meeting API failed:', res.status, await res.text());
      } else {
        console.log('✅ Transcript sent successfully');
      }
    } catch (err) {
      console.error('❌ End meeting API error:', err);
    }

    // 🔧 FIX: Call leaveMeeting() AFTER transcript is sent
    leaveMeeting();
    navigate(`/meeting/${id}/summary`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col relative select-none">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-semibold">IntellMeet</span>
          <span className="text-gray-400 text-sm font-mono">{meetingCode}</span>
          <span className="ml-2 text-xs text-gray-500">
            {peers.length + 1} participant{peers.length !== 0 ? 's' : ''}
          </span>
        </div>

        <div className="flex gap-2">
          {/* Transcript toggle */}
          <button
            onClick={() => { setShowTranscript(s => !s); setShowChat(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showTranscript ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📝 Transcript {transcript.length > 0 && `(${transcript.length})`}
          </button>

          {/* Leave (without summary) */}
          <button
            onClick={() => { leaveMeeting(); navigate('/dashboard'); }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs"
          >
            🚪 Leave
          </button>

          {/* End meeting (host) → triggers AI summary */}
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            {isEnding ? '⏳ Ending…' : '⏹ End & Summarise'}
          </button>
        </div>
      </div>

      {/* ── VIDEO GRID ─────────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 overflow-auto">
        <div
          className={`grid gap-4 h-full ${
            peers.length === 0
              ? 'grid-cols-1 max-w-2xl mx-auto'
              : peers.length === 1
              ? 'grid-cols-2'
              : peers.length <= 3
              ? 'grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-4'
          }`}
        >
          {/* Local tile */}
          {localStream ? (
            <VideoTile stream={localStream} muted label={`${user?.name ?? 'You'} (You)`} />
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl aspect-video flex items-center justify-center">
              <div className="text-5xl text-gray-500">
                {(user?.name ?? 'G').charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Remote tiles */}
          {peers.map(peer =>
            peer.stream ? (
              <VideoTile key={peer.userId} stream={peer.stream} label={peer.displayName} />
            ) : (
              <div
                key={peer.userId}
                className="bg-gray-900 border border-gray-700 rounded-2xl aspect-video flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{peer.displayName.charAt(0).toUpperCase()}</div>
                  <p className="text-gray-400 text-xs">{peer.displayName}</p>
                  <p className="text-gray-600 text-xs mt-1">Connecting…</p>
                </div>
              </div>
            )
          )}

          {/* Waiting placeholder if solo */}
          {peers.length === 0 && (
            <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-gray-400 text-sm">Waiting for participants…</p>
                <p className="text-gray-600 text-xs mt-1">Share the meeting code: <span className="font-mono text-gray-400">{meetingCode}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CHAT PANEL ─────────────────────────────────────────────────────── */}
      {showChat && (
        <div className="absolute right-0 top-16 w-80 h-[calc(100%-8rem)] bg-gray-800 border-l border-gray-700 flex flex-col shadow-2xl z-10">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-medium text-sm">💬 Meeting Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <p className="text-gray-500 text-xs text-center mt-4">No messages yet</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === user?.name ? 'items-end' : 'items-start'}`}>
                <span className="text-gray-500 text-xs mb-0.5">{msg.sender}</span>
                <span className={`px-3 py-2 rounded-xl text-white max-w-[90%] ${
                  msg.sender === user?.name ? 'bg-blue-600' : 'bg-gray-700'
                }`}>
                  {msg.content}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-700 flex gap-2">
            <input
              className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Type a message…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg text-sm"
            >
              ↩
            </button>
          </div>
        </div>
      )}

      {/* ── TRANSCRIPT PANEL ───────────────────────────────────────────────── */}
      {showTranscript && (
        <div className="absolute right-0 top-16 w-80 h-[calc(100%-8rem)] bg-gray-900 border-l border-purple-900 flex flex-col shadow-2xl z-10">
          <div className="px-4 py-3 border-b border-purple-900 flex items-center justify-between">
            <h3 className="text-purple-300 font-medium text-sm">📝 Live Transcript</h3>
            <button onClick={() => setShowTranscript(false)} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            {transcript.length === 0 && (
              <p className="text-gray-500 text-center mt-4">
                🎙️ Transcript will appear as you speak…<br />
                <span className="text-gray-600">(requires mic permission &amp; Chrome/Edge)</span>
              </p>
            )}
            {transcript.map((line, i) => (
              <div key={i} className="border-b border-gray-800 pb-1.5">
                <span className="text-purple-400 font-medium">{line.speaker}</span>
                <span className="text-gray-500 ml-1">
                  {new Date(line.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <p className="text-gray-300 mt-0.5">{line.text}</p>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-purple-900 bg-gray-950">
            <p className="text-xs text-gray-600 text-center">
              Click <span className="text-red-400 font-medium">⏹ End &amp; Summarise</span> to generate AI summary
            </p>
          </div>
        </div>
      )}

      {/* ── CONTROLS ───────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-center gap-3">
        <ControlBtn
          onClick={toggleAudio}
          active={audioOn}
          emoji="🎤"
          label={audioOn ? 'Mute' : 'Unmute'}
        />
        <ControlBtn
          onClick={toggleVideo}
          active={videoOn}
          emoji="📹"
          label={videoOn ? 'Stop Video' : 'Start Video'}
        />
        <ControlBtn
          onClick={shareScreen}
          active={true}
          emoji="🖥️"
          label="Share Screen"
        />
        <ControlBtn
          onClick={() => { setShowChat(s => !s); setShowTranscript(false); }}
          active={!showChat}
          emoji="💬"
          label="Chat"
          badge={messages.length > 0 ? messages.length : undefined}
        />
        <ControlBtn
          onClick={() => { setShowTranscript(s => !s); setShowChat(false); }}
          active={!showTranscript}
          emoji="📝"
          label="Transcript"
        />
        <ControlBtn
          onClick={() => { leaveMeeting(); navigate('/dashboard'); }}
          active={false}
          emoji="📵"
          label="Leave"
          danger
        />
      </div>
    </div>
  );
}

// ── Small reusable control button ─────────────────────────────────────────────
function ControlBtn({
  onClick, active, emoji, label, danger, badge,
}: {
  onClick: () => void;
  active: boolean;
  emoji: string;
  label: string;
  danger?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative w-12 h-12 rounded-full text-xl transition-colors ${
        danger     ? 'bg-red-600 hover:bg-red-700' :
        !active    ? 'bg-red-600 hover:bg-red-700' :
                     'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      {emoji}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
