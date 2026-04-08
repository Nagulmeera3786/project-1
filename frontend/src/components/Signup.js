import { useState } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { buildOtpDiagnostics, parseApiError } from '../errorHelpers';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPass: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setDiagnostics(null);

    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPass) {
      setError('All fields are required');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (form.password !== form.confirmPass) {
      setError('Passwords do not match');
      return;
    }

    if (form.phone.length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('signup/', {
        first_name: form.name,
        username: form.email,
        email: form.email,
        phone_number: form.phone,
        password: form.password,
      });

      if (response.data?.requires_otp === false && response.data?.access) {
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        localStorage.setItem('authToken', response.data.access);
        window.location.href = '/dashboard';
      } else {
        if (response.data?.email_sent === false) {
          setError(response.data?.detail || 'OTP generated but email sending failed.');
          setDiagnostics(buildOtpDiagnostics(response?.data));
          return;
        }
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`, { state: { email: form.email } });
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Signup failed. Please try again.');
      setError(parsed.message);
      setDiagnostics(parsed.diagnostics);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #DDD4F8', borderRadius: '9px',
    boxSizing: 'border-box', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' };
  const fieldStyle = { marginBottom: '14px' };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B82 50%, #5B3FA8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '460px',
        background: 'white', borderRadius: '20px',
        padding: '36px 36px 32px',
        boxShadow: '0 24px 64px rgba(26,14,78,0.35)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px', height: '52px', margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '16px',
          }}>ABC</div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1A1A2E' }}>Create account</h2>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B6B8A' }}>Join ABC Company platform</p>
        </div>

        {error && (
          <div style={{
            color: '#DC2626', marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#FFF0F0', borderRadius: '8px',
            fontSize: '13.5px', border: '1px solid #FCA5A5',
          }}>{error}</div>
        )}

        {diagnostics && (
          <div style={{
            color: '#92400E', marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#FFF7ED', borderRadius: '8px',
            fontSize: '12px', border: '1px solid #FED7AA',
          }}>
            {diagnostics.errorCode && <div><strong>Error:</strong> {diagnostics.errorCode}</div>}
            {diagnostics.provider && <div><strong>Email Provider:</strong> {diagnostics.provider}</div>}
            {diagnostics.host && <div><strong>SMTP Host:</strong> {diagnostics.host}</div>}
            {diagnostics.nextStep && <div><strong>Next Step:</strong> {diagnostics.nextStep}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text" placeholder="Your name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={loading} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C5DC7'}
              onBlur={e => e.target.style.borderColor = '#DDD4F8'}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={loading} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C5DC7'}
              onBlur={e => e.target.style.borderColor = '#DDD4F8'}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel" placeholder="10+ digits"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              disabled={loading} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C5DC7'}
              onBlur={e => e.target.style.borderColor = '#DDD4F8'}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" placeholder="At least 8 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              disabled={loading} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C5DC7'}
              onBlur={e => e.target.style.borderColor = '#DDD4F8'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password" placeholder="Confirm password"
              value={form.confirmPass} onChange={e => setForm({ ...form, confirmPass: e.target.value })}
              disabled={loading} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C5DC7'}
              onBlur={e => e.target.style.borderColor = '#DDD4F8'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#C4B5F0' : 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
              color: 'white', border: 'none', borderRadius: '9px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '700', fontSize: '15px',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(91,63,168,0.35)',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', color: '#6B6B8A', fontSize: '13.5px' }}>
          Already have an account? <Link to="/login" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}


