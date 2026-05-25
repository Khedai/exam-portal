import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const TeacherLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [shaking, setShaking] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('isTeacher', 'true');
      navigate('/teacher');
    } else {
      setError('Incorrect password. Please try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #0288d1 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        animation: shaking ? 'shake 0.4s ease' : undefined,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', padding: '16px 24px', borderRadius: 18,
            background: 'rgba(255,255,255,0.95)',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <img src="/logo.png" alt="Khusela Community Enrichment" style={{ height: '60px', objectFit: 'contain' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' }}>Teacher Administration Portal</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '36px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} color="#1565c0" />
            </div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '19px' }}>Secure Login</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px' }}>
            Enter the administrator password to continue.
          </p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Admin Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                  placeholder="Enter password"
                  required
                  style={error ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(211,47,47,0.12)', paddingRight: '44px' } : { paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <p style={{ color: 'var(--danger)', fontSize: '13px', margin: '6px 0 0', fontWeight: 600 }}>{error}</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', borderRadius: '10px' }}>
              <Lock size={16} /> Sign In
            </button>
          </form>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', margin: '20px auto 0',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 600,
            padding: '8px 16px', borderRadius: '8px',
            transition: 'color 0.15s',
          }}
        >
          <ArrowLeft size={16} /> Back to Student Portal
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default TeacherLogin;
