import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setToken(res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const pw = strength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][pw];
  const strengthColor = ['', '#e53e3e', '#ED8936', '#ECC94B', '#48bb78', '#6EE7F7'][pw];

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
        .rp-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          border-radius: 12px; padding: 12px 16px; font-size: 14px;
          outline: none; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .rp-input:focus {
          border-color: #6EE7F7; background: rgba(110,231,247,0.06);
          box-shadow: 0 0 0 3px rgba(110,231,247,0.12);
        }
        .rp-input::placeholder { color: rgba(255,255,255,0.2); }
        .rp-input.error { border-color: rgba(229,62,62,0.5); }
        .rp-input.valid { border-color: rgba(72,187,120,0.5); }
        .rp-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #3B5BDB, #6EE7F7);
          border: none; border-radius: 12px; color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s, transform 0.2s;
        }
        .rp-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .rp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rp-chip { animation: float 4s ease-in-out infinite; }
        .rp-chip:nth-child(2) { animation-delay: 0.5s; }
        .rp-chip:nth-child(3) { animation-delay: 1s; }
        .rp-chip:nth-child(4) { animation-delay: 1.5s; }
      `}</style>

      {/* Background */}
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

      {/* Left Panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #6EE7F7, #3B5BDB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="8.5" r="3.5" fill="white" opacity="0.9"/>
              <path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff' }}>
            IntellMeet
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 38, color: '#fff', lineHeight: 1.15,
          letterSpacing: -1, marginBottom: 16
        }}>
          Start for<br/>
          <span style={{
            background: 'linear-gradient(90deg, #6EE7F7, #3B5BDB)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>free today</span><br/>
          it's easy
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 14,
          lineHeight: 1.7, maxWidth: 320, marginBottom: 36
        }}>
          Join thousands of teams already running smarter meetings with AI-powered summaries and action items.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: '⚡', label: 'Instant Setup', sub: 'Ready in under 60 seconds' },
            { icon: '🔒', label: 'Enterprise Security', sub: 'SOC2 · OWASP compliant' },
            { icon: '🤖', label: 'AI from Day One', sub: 'No configuration needed' },
            { icon: '💳', label: 'Free to Start', sub: 'No credit card required' },
          ].map((f, i) => (
            <div key={i} className="rp-chip" style={{
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
      </div>

      {/* Right Panel - Register Card */}
      <div style={{
        width: 1140, display: 'flex', alignItems: 'center',
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

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: '#6EE7F7',
            background: 'rgba(110,231,247,0.08)',
            border: '1px solid rgba(110,231,247,0.15)',
            borderRadius: 6, padding: '4px 10px', marginBottom: 20
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7F7', display: 'inline-block' }}/>
            Free account · No card needed
          </div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 22, color: '#fff', letterSpacing: -0.5, marginBottom: 6
          }}>Create your account</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            Join IntellMeet and run smarter meetings
          </p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                letterSpacing: '0.5px', textTransform: 'uppercase'
              }}>Full Name</label>
              <input
                className="rp-input"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); setError(''); }}
                required
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                letterSpacing: '0.5px', textTransform: 'uppercase'
              }}>Email Address</label>
              <input
                className="rp-input"
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
                required
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                letterSpacing: '0.5px', textTransform: 'uppercase'
              }}>Password</label>
              <input
                className={`rp-input ${form.password && pw < 2 ? 'error' : form.password && pw >= 3 ? 'valid' : ''}`}
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                required
              />
            </div>

            {/* Strength bar */}
            {form.password && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= pw ? strengthColor : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.3s'
                    }}/>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strengthColor }}>{strengthLabel}</div>
              </div>
            )}

            {/* Confirm Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8,
                letterSpacing: '0.5px', textTransform: 'uppercase'
              }}>Confirm Password</label>
              <input
                className={`rp-input ${
                  form.confirm && form.confirm !== form.password ? 'error' :
                  form.confirm && form.confirm === form.password ? 'valid' : ''
                }`}
                type="password"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={e => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
                required
              />
              {form.confirm && form.confirm !== form.password && (
                <div style={{ fontSize: 11, color: '#fc8181', marginTop: 4 }}>Passwords do not match</div>
              )}
              {form.confirm && form.confirm === form.password && (
                <div style={{ fontSize: 11, color: '#48bb78', marginTop: 4 }}>Passwords match ✓</div>
              )}
            </div>

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

            <button type="submit" className="rp-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block'
                  }}/>
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
            or
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6EE7F7', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            By creating an account you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}