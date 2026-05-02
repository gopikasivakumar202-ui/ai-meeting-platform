/**
 * PostMeetingSummaryPage.tsx  (Week 3 – Day 17)
 *
 * Fixes applied:
 *   🔧 Better empty state messages explaining WHY summary is unavailable
 *   🔧 Polling stops cleanly using a flag (no memory leaks)
 *   🔧 Shows mic troubleshooting tip when transcript was not captured
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';

interface Meeting {
  _id: string;
  title: string;
  meetingCode: string;
  aiSummary: string;
  actionItems: string[];
  startTime: string;
  endTime: string;
  participants: { user: { name: string; avatar: string }; joinedAt: string }[];
}

export default function PostMeetingSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const navigate  = useNavigate();

  const [meeting,  setMeeting]  = useState<Meeting | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // 🔧 FIX: Use ref to stop polling cleanly on unmount
  const shouldPollRef = useRef(true);

  useEffect(() => {
    if (!id) return;
    shouldPollRef.current = true;
    let attempts = 0;
    const maxAttempts = 10;

    const fetchMeeting = async () => {
      if (!shouldPollRef.current) return;

      try {
        const res = await fetch(`${SERVER_URL}/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Could not fetch meeting');
        const data: Meeting = await res.json();
        setMeeting(data);

        // If AI summary not yet ready, keep polling (max 10 × 2s = 20s)
        if (!data.aiSummary && attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchMeeting, 2000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to load meeting summary.');
        setLoading(false);
      }
    };

    fetchMeeting();

    return () => {
      // 🔧 FIX: Stop polling on unmount
      shouldPollRef.current = false;
    };
  }, [id, token]);

  const duration = meeting
    ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 60000)
    : 0;

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400">{error}</div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Meeting Summary</h1>
          {meeting && (
            <p className="text-gray-400 text-sm mt-1">
              {meeting.title} · {meeting.meetingCode} · {duration} min
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm"
        >
          ← Dashboard
        </button>
      </div>

      {loading && !meeting?.aiSummary && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3 animate-spin">🤖</div>
          <p className="text-gray-400">Generating AI summary…</p>
          <p className="text-gray-600 text-xs mt-1">This usually takes 5–10 seconds</p>
        </div>
      )}

      {meeting && (
        <div className="space-y-6">

          {/* AI Summary */}
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
              🤖 AI Meeting Summary
            </h2>
            {meeting.aiSummary ? (
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                {meeting.aiSummary}
              </p>
            ) : (
              // 🔧 FIX: Clear explanation instead of generic "unavailable"
              <div className="space-y-2">
                <p className="text-gray-500 text-sm italic">
                  No transcript was provided — summary unavailable.
                </p>
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-3 text-xs text-yellow-300 space-y-1">
                  <p className="font-medium">💡 Why does this happen?</p>
                  <ul className="list-disc list-inside space-y-0.5 text-yellow-400/80">
                    <li>Microphone permission was not granted in the browser</li>
                    <li>You joined and ended the meeting without speaking</li>
                    <li>You are using Firefox (Speech API requires Chrome or Edge)</li>
                  </ul>
                  <p className="mt-2 font-medium">Next time:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-yellow-400/80">
                    <li>Click <strong>Allow</strong> when the browser asks for mic access</li>
                    <li>Use <strong>Chrome</strong> or <strong>Edge</strong> for best results</li>
                    <li>Speak during the meeting — transcript captures your voice in real time</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Action Items */}
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              ✅ Action Items
            </h2>
            {meeting.actionItems?.length > 0 ? (
              <ul className="space-y-2">
                {meeting.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="mt-0.5 w-5 h-5 rounded-full border border-green-500 flex items-center justify-center text-xs text-green-400 shrink-0">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">No action items extracted yet.</p>
            )}
          </section>

          {/* Participants */}
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-blue-400 font-semibold mb-3">👥 Participants</h2>
            <div className="flex flex-wrap gap-2">
              {meeting.participants.map((p, i) => (
                <span
                  key={i}
                  className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full text-xs"
                >
                  {p.user?.name ?? 'Unknown'}
                </span>
              ))}
            </div>
          </section>

          {/* Export hint */}
          <p className="text-gray-600 text-xs text-center pb-4">
            💡 Action items are automatically synced to your project board (Week 3 – Day 19)
          </p>
        </div>
      )}
    </div>
  );
}
