import { useState } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { buildOtpDiagnostics, parseApiError } from '../errorHelpers';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setDiagnostics(null);

    try {
      const response = await API.post('forgot-password/', { email });
      if (response?.data?.email_sent === false) {
        setError(response?.data?.detail || 'OTP generated but email sending failed.');
        setDiagnostics(buildOtpDiagnostics(response?.data));
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        nav(`/reset-password?email=${encodeURIComponent(email)}`, { state: { email } });
      }, 2000);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to send OTP. Please try again.');
      setError(parsed.message);
      setDiagnostics(parsed.diagnostics);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B82 50%, #5B3FA8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'white', borderRadius: '20px',
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(26,14,78,0.35)',
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '16px',
          }}>ABC</div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1A1A2E' }}>Forgot Password?</h2>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B6B8A' }}>
            Enter your email and we'll send you an OTP to reset your password.
          </p>
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
            <strong>Diagnostics:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
              {diagnostics.errorCode && <li><strong>Error:</strong> {diagnostics.errorCode}</li>}
              {diagnostics.provider && <li><strong>Email Provider:</strong> {diagnostics.provider}</li>}
              {diagnostics.host && <li><strong>SMTP Host:</strong> {diagnostics.host}</li>}
              {diagnostics.otpGenerated !== undefined && (
                <li><strong>OTP Generated:</strong> {diagnostics.otpGenerated ? 'Yes' : 'No'}</li>
              )}
              {diagnostics.nextStep && <li><strong>Next Step:</strong> {diagnostics.nextStep}</li>}
            </ul>
          </div>
        )}

        {success && (
          <div style={{
            color: '#16a34a', marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#F0FDF4', borderRadius: '8px',
            fontSize: '13.5px', border: '1px solid #86EFAC',
          }}>OTP sent successfully! Redirecting…</div>
        )}

        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' }}>Email address</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            style={{
              width: '100%', padding: '11px 14px',
              border: '1.5px solid #DDD4F8', borderRadius: '9px',
              boxSizing: 'border-box', fontSize: '14px', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#7C5DC7'}
            onBlur={e => e.target.style.borderColor = '#DDD4F8'}
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: loading ? '#C4B5F0' : 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
            color: 'white', border: 'none', borderRadius: '9px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '700', fontSize: '15px',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(91,63,168,0.35)',
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Sending OTP…' : 'Send OTP'}
        </button>

        <p style={{ marginTop: '18px', textAlign: 'center', color: '#6B6B8A', fontSize: '13.5px' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}


