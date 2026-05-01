import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setToken } = useAuthStore();
  const navigate = useNavigate();
 const API_URL = import.meta.env.VITE_API_URL || 'https://api-production-b6fe.up.railway.app';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
     const res = await axios.post(`${API_URL}/api/auth/login`, form);
      setToken(res.data.token);

      // Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await axios.post('/api/auth/upload-avatar', formData, {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050810',
      display: 'flex', fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        @keyframes gridMove { 0%{background-position:0 0} 100%{background-position:60px 60px} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(110,231,247,0.4)} 50%{box-shadow:0 0 0 6px rgba(110,231,247,0)} }

        .lp-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          border-radius: 12px; padding: 12px 16px; font-size: 14px;
          outline: none; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .lp-input:focus {
          border-color: #6EE7F7; background: rgba(110,231,247,0.06);
          box-shadow: 0 0 0 3px rgba(110,231,247,0.12);
        }
        .lp-input::placeholder { color: rgba(255,255,255,0.2); }

        .lp-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #3B5BDB, #6EE7F7);
          border: none; border-radius: 12px; color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s, transform 0.2s;
          position: relative; overflow: hidden;
        }
        .lp-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .lp-btn::after {
          content: ''; position: absolute;
          top: -50%; left: -60%; width: 40%; height: 200%;
          background: rgba(255,255,255,0.15); transform: skewX(-20deg);
          transition: left 0.5s;
        }
        .lp-btn:hover::after { left: 120%; }

        .lp-chip { animation: float 4s ease-in-out infinite; }
        .lp-chip:nth-child(2) { animation-delay: 0.5s; }
        .lp-chip:nth-child(3) { animation-delay: 1s; }

        .avatar-upload-btn {
          position: absolute; bottom: 0; right: 0;
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg, #3B5BDB, #6EE7F7);
          border: 2px solid #050810;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 12px; transition: transform 0.2s;
        }
        .avatar-upload-btn:hover { transform: scale(1.1); }

        .pw-toggle {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.35); font-size: 13px;
          padding: 0; transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .pw-toggle:hover { color: #6EE7F7; }

        .social-btn {
          flex: 1; padding: 11px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: rgba(255,255,255,0.6);
          font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
          transition: all 0.2s;
        }
        .social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }
      `}</style>

      {/* Animated grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(110,231,247,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(110,231,247,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px', animation: 'gridMove 20s linear infinite'
      }}/>
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,91,219,0.15) 0%, transparent 70%)',
        top: -150, left: -150, pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(110,231,247,0.1) 0%, transparent 70%)',
        bottom: -100, right: -100, pointerEvents: 'none'
      }}/>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px',
        position: 'relative', zIndex: 1
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #6EE7F7, #3B5BDB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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

        {/* Hero */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 38, color: '#fff', lineHeight: 1.15,
          letterSpacing: -1, marginBottom: 16
        }}>
          AI-Powered<br/>
          <span style={{
            background: 'linear-gradient(90deg, #6EE7F7, #3B5BDB)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Enterprise</span><br/>
          Meetings
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 14,
          lineHeight: 1.7, maxWidth: 320, marginBottom: 36
        }}>
          Transform every meeting into actionable intelligence with real-time AI summaries and smart collaboration.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: '🎥', label: 'Real-Time Video', sub: '50+ participants' },
            { icon: '🤖', label: 'AI Summaries', sub: '85%+ accuracy' },
            { icon: '✅', label: 'Action Items', sub: 'Auto-extracted' },
          ].map((f, i) => (
            <div key={i} className="lp-chip" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, fontSize: 14,
                background: 'linear-gradient(135deg, rgba(110,231,247,0.2), rgba(59,91,219,0.2))',
                border: '1px solid rgba(110,231,247,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24,
          marginTop: 36, paddingTop: 28,
          borderTop: '1px solid rgba(255,255,255,0.07)'
        }}>
          {[
            { num: '40%', label: 'Less Follow-up' },
            { num: '99.9%', label: 'Uptime SLA' },
            { num: '10k+', label: 'Meetings/Day' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 20, color: '#6EE7F7'
              }}>{s.num}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: 1040, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '32px 24px',
        position: 'relative', zIndex: 1
      }}>
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '36px 32px',
          position: 'relative', overflow: 'hidden',
          animation: 'fadeUp 0.5s ease both'
        }}>
          {/* Scanline */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(110,231,247,0.4), transparent)',
            animation: 'scanline 4s linear infinite', pointerEvents: 'none'
          }}/>

          {/* ── AVATAR UPLOAD ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #6EE7F7',
                    boxShadow: '0 0 0 4px rgba(110,231,247,0.15)'
                  }}
                />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(110,231,247,0.15), rgba(59,91,219,0.15))',
                  border: '2px dashed rgba(110,231,247,0.3)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 28
                }}>👤</div>
              )}
              <label className="avatar-upload-btn" title="Upload profile photo">
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              {avatarPreview ? 'Photo selected ✓' : 'Upload profile photo (optional)'}
            </div>
          </div>

          {/* Security badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: '#6EE7F7',
            background: 'rgba(110,231,247,0.08)',
            border: '1px solid rgba(110,231,247,0.15)',
            borderRadius: 6, padding: '4px 10px', marginBottom: 16
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#6EE7F7', display: 'inline-block',
              animation: 'pulse-dot 2s infinite'
            }}/>
            Secure connection · OWASP
          </div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 22, color: '#fff', letterSpacing: -0.5, marginBottom: 6
          }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
            Sign in to your IntellMeet account
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                letterSpacing: '0.5px', textTransform: 'uppercase'
              }}>Email Address</label>
              <input
                className="lp-input"
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
                required
              />
            </div>

            {/* Password with show/hide toggle */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{
                  fontSize: 12, fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.5px', textTransform: 'uppercase'
                }}>Password</label>
                <span style={{ fontSize: 11, color: '#6EE7F7', cursor: 'pointer' }}>
                  Forgot password?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="lp-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  style={{ paddingRight: 56 }}
                  required
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(229,62,62,0.1)',
                border: '1px solid rgba(229,62,62,0.25)',
                borderRadius: 10, padding: '10px 14px',
                color: '#fc8181', fontSize: 13, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block'
                  }}/>
                  Signing in...
                </span>
              ) : 'Sign In to IntellMeet →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
            or continue with
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
          </div>

          {/* Social buttons */}
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
         
           <button 
  className="social-btn" 
  onClick={() => {
    console.log('Google clicked'); // Add this too
    window.location.href = `${API_URL}/auth/google`;
  }}
>
  
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="social-btn" onClick={() => window.location.href = `${API_URL}/auth/github`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Sign up link */}
          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6EE7F7', fontWeight: 600, textDecoration: 'none' }}>
              Create account →
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Protected by enterprise-grade security · OWASP compliant
          </p>
        </div>
      </div>
    </div>
  );
}