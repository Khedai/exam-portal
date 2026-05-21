import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Award, Shield } from 'lucide-react';

const features = [
  { icon: <BookOpen size={20} />, text: 'Multiple question types' },
  { icon: <Clock size={20} />,    text: 'Timed assessments' },
  { icon: <Award size={20} />,    text: 'Instant results & feedback' },
  { icon: <Shield size={20} />,   text: 'Secure & tamper-proof' },
];

// ─── South African ID validator ───────────────────────────────────────────────
// Validates: 13 digits, valid YYMMDD birth date, citizenship digit 0 or 1,
// and passing Luhn checksum — rejects random number strings.
function validateSAID(id: string): string | null {
  if (!/^\d{13}$/.test(id)) return 'ID must be exactly 13 digits.';

  const mm = parseInt(id.slice(2, 4));
  const dd = parseInt(id.slice(4, 6));
  if (mm < 1 || mm > 12) return 'Invalid birth month in ID number.';
  if (dd < 1 || dd > 31) return 'Invalid birth day in ID number.';

  const citizenship = parseInt(id[10]);
  if (citizenship > 1) return 'Invalid citizenship digit in ID number.';

  // Luhn checksum — standard algorithm (double every second digit from the right)
  let sum = 0;
  let doubleIt = false;
  for (let i = id.length - 1; i >= 0; i--) {
    let d = parseInt(id[i]);
    if (doubleIt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleIt = !doubleIt;
  }
  if (sum % 10 !== 0) return 'ID number is invalid — please check and try again.';

  return null; // all good
}

// SA cell number: 10 digits starting with 0, or 11 digits starting with 27
function validateCell(cell: string): string | null {
  const digits = cell.replace(/\s/g, '');
  if (!/^\d+$/.test(digits)) return 'Cell number must contain digits only.';
  if (/^0[6-8]\d{8}$/.test(digits)) return null;            // 07x / 06x / 08x
  if (/^27[6-8]\d{8}$/.test(digits)) return null;           // +27 format
  return 'Enter a valid SA cell number (e.g. 0821234567).';
}

const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', surname: '', cellNumber: '', studentId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const set = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 13);
    set('studentId', value);
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d\s]/g, '').slice(0, 12);
    set('cellNumber', value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())    newErrors.name    = 'First name is required.';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required.';

    const cellErr = validateCell(formData.cellNumber);
    if (cellErr) newErrors.cellNumber = cellErr;

    const idErr = validateSAID(formData.studentId);
    if (idErr) newErrors.studentId = idErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    sessionStorage.setItem('studentInfo', JSON.stringify(formData));
    navigate('/dashboard');
  };

  const idStatus = (() => {
    if (!formData.studentId) return null;
    if (formData.studentId.length < 13) return { ok: false, msg: `${formData.studentId.length}/13 digits` };
    const err = validateSAID(formData.studentId);
    return err ? { ok: false, msg: err } : { ok: true, msg: '✓ Valid SA ID' };
  })();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={18} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>ExamPortal</h1>
        </div>
        <button className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={() => navigate('/teacher/login')}>
          Teacher Login
        </button>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', maxWidth: '960px', width: '100%', alignItems: 'center' }} className="landing-grid">

          {/* Branding side */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(4,170,109,0.3)' }}>
              <BookOpen size={40} color="white" />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2, color: '#111' }}>
              Online Assessment<br />
              <span style={{ color: 'var(--primary)' }}>Made Simple</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: '0 0 32px', lineHeight: 1.6 }}>
              A streamlined platform for students to take timed exams and receive instant, detailed feedback.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.07)', fontSize: '13px', fontWeight: 600, color: '#374151', backdropFilter: 'blur(4px)' }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Form side */}
          <div className="card" style={{ padding: '36px', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', borderRadius: 16 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Student Sign In</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px' }}>
              Enter your details to access your assessments.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="First Name" error={errors.name}>
                  <input type="text" required value={formData.name} placeholder="Anita"
                    style={errors.name ? errStyle : {}}
                    onChange={e => set('name', e.target.value)} />
                </Field>
                <Field label="Surname" error={errors.surname}>
                  <input type="text" required value={formData.surname} placeholder="Job"
                    style={errors.surname ? errStyle : {}}
                    onChange={e => set('surname', e.target.value)} />
                </Field>
              </div>

              {/* Cell number */}
              <Field label="Cell Number" error={errors.cellNumber} style={{ marginTop: '16px' }}>
                <input
                  type="tel"
                  required
                  value={formData.cellNumber}
                  onChange={handleCellChange}
                  placeholder="0821234567"
                  inputMode="tel"
                  style={errors.cellNumber ? errStyle : {}}
                />
              </Field>

              {/* SA ID */}
              <Field label="SA ID Number (13 Digits)" error={errors.studentId || (idStatus && !idStatus.ok ? idStatus.msg : '')}>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={handleIdChange}
                  placeholder="8001015009087"
                  inputMode="numeric"
                  maxLength={13}
                  style={errors.studentId || (idStatus && !idStatus.ok) ? errStyle : idStatus?.ok ? okStyle : {}}
                />
                {idStatus && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: idStatus.ok ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {idStatus.ok ? idStatus.msg : idStatus.msg}
                    </span>
                  </div>
                )}
              </Field>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '8px', borderRadius: '10px' }}>
                Access My Exams
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px', marginBottom: 0 }}>
              By continuing, you agree to the assessment terms and academic integrity policy.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 700px) { .landing-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </div>
  );
};

// ─── Helper sub-components ────────────────────────────────────────────────────
const errStyle: React.CSSProperties = {
  borderColor: 'var(--danger)',
  boxShadow: '0 0 0 3px rgba(211,47,47,0.12)',
};
const okStyle: React.CSSProperties = {
  borderColor: 'var(--primary)',
  boxShadow: '0 0 0 3px rgba(4,170,109,0.12)',
};

const Field: React.FC<{ label: string; error?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ label, error, style, children }) => (
  <div className="input-group" style={{ marginBottom: 0, ...style }}>
    <label>{label}</label>
    {children}
    {error && <p style={{ color: 'var(--danger)', fontSize: '12px', margin: '5px 0 0', fontWeight: 600 }}>{error}</p>}
  </div>
);

export default LandingPage;
