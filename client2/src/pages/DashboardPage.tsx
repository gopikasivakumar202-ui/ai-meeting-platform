import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Meeting {
  _id: string;
  title: string;
  description: string;
  meetingCode: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { token, user, setUser, logout } = useAuthStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingForm, setMeetingForm] = useState({ title: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState('meetings');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUser();
    fetchMeetings();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me', { headers });
      setUser(res.data);
    } catch {
      logout();
      navigate('/login');
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await axios.get('/api/meetings', { headers });
      setMeetings(res.data);
    } catch {
      setError('Failed to fetch meetings');
    }
  };

  const createMeeting = async () => {
    if (!meetingForm.title) return setError('Title is required');
    try {
      const res = await axios.post('/api/meetings', meetingForm, { headers });
      setMeetings(prev => [res.data, ...prev]);
      setMeetingForm({ title: '', description: '' });
      setMessage('Meeting created successfully!');
      setActiveTab('meetings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      await axios.delete(`/api/meetings/${id}`, { headers });
      setMeetings(prev => prev.filter(m => m._id !== id));
      setMessage('Meeting deleted');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const joinMeeting = async () => {
    if (!joinCode) return setError('Enter a meeting code');
    try {
      const res = await axios.post('/api/meetings/join', { meetingCode: joinCode }, { headers });
      navigate(`/meeting/${res.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid meeting code');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = [
    { label: 'Total Meetings', value: meetings.length, icon: '📋', color: '#6EE7F7' },
    { label: 'Active', value: meetings.filter(m => m.status === 'active').length, icon: '🟢', color: '#48bb78' },
    { label: 'Scheduled', value: meetings.filter(m => m.status === 'scheduled').length, icon: '📅', color: '#3B5BDB' },
  ];

  const tabs = [
    { id: 'meetings', label: 'My Meetings', icon: '📋' },
    { id: 'create', label: 'New Meeting', icon: '➕' },
    { id: 'join', label: 'Join Meeting', icon: '🔗' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#050810',
      fontFamily: "'DM Sans', sans-serif", position: 'relative'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        @keyframes gridMove { 0%{background-position:0 0} 100%{background-position:60px 60px} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(72,187,120,0.4)} 50%{box-shadow:0 0 0 5px rgba(72,187,120,0)} }
        @keyframes spin { to{transform:rotate(360deg)} }

        .db-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          border-radius: 12px; padding: 12px 16px; font-size: 14px;
          outline: none; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .db-input:focus {
          border-color: #6EE7F7; background: rgba(110,231,247,0.06);
          box-shadow: 0 0 0 3px rgba(110,231,247,0.12);
        }
        .db-input::placeholder { color: rgba(255,255,255,0.2); }

        .db-textarea {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          border-radius: 12px; padding: 12px 16px; font-size: 14px;
          outline: none; transition: all 0.2s; resize: none;
          font-family: 'DM Sans', sans-serif;
        }
        .db-textarea:focus {
          border-color: #6EE7F7; background: rgba(110,231,247,0.06);
          box-shadow: 0 0 0 3px rgba(110,231,247,0.12);
        }
        .db-textarea::placeholder { color: rgba(255,255,255,0.2); }

        .db-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; transition: border-color 0.2s;
          position: relative; overflow: hidden;
          animation: fadeUp 0.4s ease both;
        }
        .db-card:hover { border-color: rgba(110,231,247,0.2); }

        .db-btn-primary {
          background: linear-gradient(135deg, #3B5BDB, #6EE7F7);
          border: none; border-radius: 12px; color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s, transform 0.2s;
          padding: 12px 20px; display: inline-flex;
          align-items: center; gap: 8px;
        }
        .db-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .db-btn-danger {
          background: rgba(229,62,62,0.1);
          border: 1px solid rgba(229,62,62,0.2);
          border-radius: 10px; color: #fc8181;
          font-size: 13px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; padding: 8px 14px;
        }
        .db-btn-danger:hover {
          background: rgba(229,62,62,0.25);
          border-color: rgba(229,62,62,0.4); color: #fff;
        }

        .db-btn-ghost {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: rgba(255,255,255,0.5);
          font-size: 13px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; padding: 8px 14px;
        }
        .db-btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          color: #fff; border-color: rgba(255,255,255,0.2);
        }

        .db-tab {
          padding: 9px 18px; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: 1px solid transparent;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; display: flex;
          align-items: center; gap: 7px;
        }
        .db-tab.active {
          background: linear-gradient(135deg, rgba(59,91,219,0.3), rgba(110,231,247,0.15));
          border-color: rgba(110,231,247,0.3); color: #6EE7F7;
        }
        .db-tab.inactive {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
        }
        .db-tab.inactive:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.7);
        }

        .meeting-row {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px 24px;
          display: flex; align-items: center;
          justify-content: space-between;
          transition: border-color 0.2s, background 0.2s;
          animation: fadeUp 0.4s ease both;
        }
        .meeting-row:hover {
          border-color: rgba(110,231,247,0.2);
          background: rgba(110,231,247,0.03);
        }

        .nav-btn-logout {
          background: rgba(229,62,62,0.1);
          border: 1px solid rgba(229,62,62,0.2);
          color: #fc8181; border-radius: 10px;
          padding: 8px 16px; font-size: 13px;
          font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .nav-btn-logout:hover {
          background: rgba(229,62,62,0.25);
          color: #fff;
        }

        .code-badge {
          font-family: 'Courier New', monospace;
          font-weight: 700; color: #6EE7F7;
          background: rgba(110,231,247,0.08);
          border: 1px solid rgba(110,231,247,0.15);
          border-radius: 6px; padding: 2px 8px;
          font-size: 12px; letter-spacing: 1px;
        }

        .status-badge {
          font-size: 11px; padding: 3px 10px;
          border-radius: 20px; font-weight: 600;
        }
      `}</style>

      {/* Animated bg grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(110,231,247,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(110,231,247,0.025) 1px, transparent 1px)`,
        backgroundSize: '60px 60px', animation: 'gridMove 20s linear infinite'
      }}/>
      <div style={{
        position: 'fixed', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,91,219,0.1) 0%, transparent 70%)',
        top: -200, left: -200, pointerEvents: 'none', zIndex: 0
      }}/>
      <div style={{
        position: 'fixed', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(110,231,247,0.07) 0%, transparent 70%)',
        bottom: -150, right: -150, pointerEvents: 'none', zIndex: 0
      }}/>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 32px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 64
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6EE7F7, #3B5BDB)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8.5" r="3.5" fill="white" opacity="0.9"/>
                <path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
                  stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
              </svg>
            </div>
            <span style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: 18, color: '#fff'
            }}>IntellMeet</span>
          </div>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" style={{
                    width: 36, height: 36, borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid #6EE7F7'
                  }}/>
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B5BDB, #6EE7F7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 15
                  }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#48bb78', display: 'inline-block',
                      animation: 'pulse-dot 2s infinite'
                    }}/>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{user.role || 'Online'}</span>
                  </div>
                </div>
              </div>
            )}
            <button className="nav-btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px', position: 'relative', zIndex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 28, color: '#fff', letterSpacing: -0.5, marginBottom: 6
          }}>
            Welcome back, <span style={{
              background: 'linear-gradient(90deg, #6EE7F7, #3B5BDB)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Manage your meetings and collaborations from your dashboard.
          </p>
        </div>

        {/* Alerts */}
        {message && (
          <div style={{
            background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.25)',
            borderRadius: 12, padding: '12px 16px', color: '#68d391',
            fontSize: 13, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            ✅ {message}
            <button onClick={() => setMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )}
        {error && (
          <div style={{
            background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.25)',
            borderRadius: 12, padding: '12px 16px', color: '#fc8181',
            fontSize: 13, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            ⚠ {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )}

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, marginBottom: 32
        }}>
          {stats.map((stat, i) => (
            <div key={i} className="db-card" style={{ padding: '24px' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, top: 0,
                background: `linear-gradient(90deg, transparent, ${stat.color}33, transparent)` }}/>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 32, color: stat.color, marginBottom: 4
              }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`db-tab ${activeTab === tab.id ? 'active' : 'inactive'}`}
              onClick={() => { setActiveTab(tab.id); setMessage(''); setError(''); }}
            >
              <span style={{ fontSize: 14 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MEETINGS LIST ── */}
        {activeTab === 'meetings' && (
          <div style={{ animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 18, color: '#fff'
              }}>My Meetings
                <span style={{
                  marginLeft: 10, fontSize: 13, fontWeight: 500,
                  color: '#6EE7F7', background: 'rgba(110,231,247,0.1)',
                  border: '1px solid rgba(110,231,247,0.2)',
                  borderRadius: 20, padding: '2px 10px'
                }}>{meetings.length}</span>
              </h2>
              <button className="db-btn-primary" onClick={() => setActiveTab('create')} style={{ fontSize: 13, padding: '9px 16px' }}>
                ➕ New Meeting
              </button>
            </div>

            {meetings.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '60px 20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 20, fontSize: 15 }}>
                  No meetings yet. Create your first one!
                </p>
                <button className="db-btn-primary" onClick={() => setActiveTab('create')}>
                  ➕ Create Meeting
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {meetings.map((meeting, idx) => (
                  <div key={meeting._id} className="meeting-row"
                    style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>
                          {meeting.title}
                        </h3>
                        <span className="status-badge" style={{
                          background: meeting.status === 'active' ? 'rgba(72,187,120,0.15)' :
                            meeting.status === 'ended' ? 'rgba(100,100,100,0.15)' :
                            'rgba(59,91,219,0.15)',
                          color: meeting.status === 'active' ? '#68d391' :
                            meeting.status === 'ended' ? '#888' : '#6EE7F7',
                          border: `1px solid ${meeting.status === 'active' ? 'rgba(72,187,120,0.25)' :
                            meeting.status === 'ended' ? 'rgba(100,100,100,0.2)' :
                            'rgba(59,91,219,0.25)'}`
                        }}>
                          {meeting.status}
                        </span>
                      </div>
                      {meeting.description && (
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 10px' }}>
                          {meeting.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                          Code: <span className="code-badge">{meeting.meetingCode}</span>
                        </span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                          📅 {new Date(meeting.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 20 }}>
                      <button className="db-btn-primary"
                        style={{ fontSize: 13, padding: '9px 16px' }}
                        onClick={() => navigate(`/meeting/${meeting._id}`)}>
                        🚀 Start
                      </button>
                      <button className="db-btn-danger"
                        onClick={() => deleteMeeting(meeting._id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CREATE MEETING ── */}
        {activeTab === 'create' && (
          <div style={{ maxWidth: 520, animation: 'fadeUp 0.3s ease both' }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '36px 32px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 2, top: 0,
                background: 'linear-gradient(90deg, transparent, rgba(110,231,247,0.3), transparent)',
                animation: 'scanline 4s linear infinite'
              }}/>

              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 20, color: '#fff', marginBottom: 6
              }}>Create New Meeting</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
                A unique code will be auto-generated for your meeting.
              </p>

              <div style={{ marginBottom: 18 }}>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                  letterSpacing: '0.5px', textTransform: 'uppercase'
                }}>Meeting Title *</label>
                <input
                  className="db-input"
                  placeholder="e.g. Team Standup"
                  value={meetingForm.title}
                  onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                  letterSpacing: '0.5px', textTransform: 'uppercase'
                }}>Description (optional)</label>
                <textarea
                  className="db-textarea"
                  placeholder="What is this meeting about?"
                  value={meetingForm.description}
                  onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <button className="db-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                onClick={createMeeting}>
                🚀 Create Meeting
              </button>
            </div>
          </div>
        )}

        {/* ── JOIN MEETING ── */}
        {activeTab === 'join' && (
          <div style={{ maxWidth: 520, animation: 'fadeUp 0.3s ease both' }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '36px 32px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 2, top: 0,
                background: 'linear-gradient(90deg, transparent, rgba(110,231,247,0.3), transparent)',
                animation: 'scanline 4s linear infinite'
              }}/>

              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 20, color: '#fff', marginBottom: 6
              }}>Join a Meeting</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
                Enter the 8-character code shared by the host.
              </p>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                  letterSpacing: '0.5px', textTransform: 'uppercase'
                }}>Meeting Code</label>
                <input
                  className="db-input"
                  placeholder="e.g. AB12CD34"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: '4px', fontSize: 18,
                    textAlign: 'center', fontWeight: 700
                  }}
                  maxLength={8}
                />
                {/* Progress dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: i < joinCode.length ? '#6EE7F7' : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s'
                    }}/>
                  ))}
                </div>
              </div>

              <button
                className="db-btn-primary"
                style={{
                  width: '100%', justifyContent: 'center', padding: '14px',
                  background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
                  opacity: joinCode.length < 8 ? 0.5 : 1,
                  cursor: joinCode.length < 8 ? 'not-allowed' : 'pointer'
                }}
                onClick={joinMeeting}
                disabled={joinCode.length < 8}
              >
                🚪 Join Meeting {joinCode.length === 8 ? '→' : `(${joinCode.length}/8)`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}