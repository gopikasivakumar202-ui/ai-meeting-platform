/**
 * PostMeetingSummaryPage.tsx  (Week 3 – Day 17)
 *
 * Rendered at /meeting/:id/summary after "End & Summarise" is clicked.
 * Polls or fetches the meeting document (which now has aiSummary + actionItems
 * filled by the server after receiving the transcript).
 */

import { useEffect, useState } from 'react';
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

  // Poll until aiSummary is populated (server may take a second to call OpenAI)
  useEffect(() => {
    if (!id) return;
    let attempts = 0;
    const maxAttempts = 10;

    const fetchMeeting = async () => {
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
              <p className="text-gray-500 text-sm italic">Summary not yet available…</p>
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
