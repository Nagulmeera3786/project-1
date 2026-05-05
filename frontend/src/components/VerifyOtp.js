import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import API from '../api';
import { buildOtpDiagnostics, parseApiError } from '../errorHelpers';

export default function VerifyOtp() {
  const loc = useLocation();
  const queryEmail = new URLSearchParams(loc.search).get('email') || '';
  const email = loc.state?.email || queryEmail;
  const fromLogin = Boolean(loc.state?.fromLogin);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const [message, setMessage] = useState('');
  const [lastSubmittedOtp, setLastSubmittedOtp] = useState('');

  if (!email) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B82 50%, #5B3FA8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'white', borderRadius: '20px', padding: '40px 36px',
          boxShadow: '0 24px 64px rgba(26,14,78,0.35)', textAlign: 'center',
        }}>
          <p style={{ color: '#6B6B8A', fontSize: '14px' }}>
            Email not found.{' '}
            <Link to="/signup" style={{ color: '#5B3FA8', fontWeight: '600', textDecoration: 'none' }}>Try signing up again</Link>
          </p>
        </div>
      </div>
    );
  }

  const submit = async (otpValue = otp) => {
    const normalizedOtp = String(otpValue || '').trim();

    if (!normalizedOtp || normalizedOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setLastSubmittedOtp(normalizedOtp);
    setError('');
    setDiagnostics(null);
    setMessage('');

    try {
      const res = await API.post('verify-otp/', { email, otp: normalizedOtp });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('authToken', res.data.access);
      // Use window.location to force page reload
      window.location.href = '/dashboard';
    } catch (err) {
      const parsed = parseApiError(err, 'Invalid or expired OTP. Please try again.');
      setError(parsed.message);
      setDiagnostics(parsed.diagnostics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length < 6 && lastSubmittedOtp) {
      setLastSubmittedOtp('');
    }
  }, [otp, lastSubmittedOtp]);

  useEffect(() => {
    if (otp.length !== 6 || loading || otp === lastSubmittedOtp) {
      return;
    }

    submit(otp);
  }, [otp, loading, lastSubmittedOtp]);

  const resendOtp = async () => {
    if (!email || resending) {
      return;
    }

    setResending(true);
    setError('');
    setDiagnostics(null);
    setMessage('');
    try {
      const response = await API.post('resend-otp/', { email });
      if (response?.data?.email_sent === false) {
        setError(response?.data?.detail || 'OTP generated but email sending failed.');
        setDiagnostics(buildOtpDiagnostics(response?.data));
      } else {
        setMessage('A new OTP has been sent to your email.');
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Could not resend OTP right now.');
      setError(parsed.message);
      setDiagnostics(parsed.diagnostics);
    } finally {
      setResending(false);
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
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1A1A2E' }}>Verify Email</h2>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B6B8A' }}>
            We sent a 6-digit OTP to <strong style={{ color: '#3D2B82' }}>{email}</strong>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#9B9BB4' }}>
            Verification starts automatically when you enter all 6 digits.
          </p>
        </div>

        {fromLogin && (
          <div style={{
            marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#F5F3FF', borderRadius: '8px',
            fontSize: '13px', color: '#4C3A92', border: '1px solid #DDD4F8',
          }}>
            Your account exists but isn't verified yet. Complete OTP verification to continue.
          </div>
        )}

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
        {message && (
          <div style={{
            color: '#16a34a', marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#F0FDF4', borderRadius: '8px',
            fontSize: '13.5px', border: '1px solid #86EFAC',
          }}>{message}</div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' }}>Enter OTP (6 digits)</label>
          <input
            type="text"
            placeholder="0  0  0  0  0  0"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={handleKeyPress}
            disabled={loading}
            maxLength="6"
            style={{
              width: '100%', padding: '14px',
              border: '1.5px solid #DDD4F8', borderRadius: '9px',
              boxSizing: 'border-box', fontSize: '24px', outline: 'none',
              letterSpacing: '12px', textAlign: 'center',
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
          {loading ? 'Verifying…' : 'Verify OTP'}
        </button>

        <button
          onClick={resendOtp}
          disabled={resending || loading}
          style={{
            width: '100%', padding: '11px', marginTop: '10px',
            background: 'white', color: '#5B3FA8',
            border: '1.5px solid #DDD4F8', borderRadius: '9px',
            cursor: resending || loading ? 'not-allowed' : 'pointer',
            fontWeight: '600', fontSize: '14px',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => { if (!resending && !loading) e.currentTarget.style.borderColor = '#7C5DC7'; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#DDD4F8'}
        >
          {resending ? 'Resending…' : 'Resend OTP'}
        </button>

        <p style={{ marginTop: '16px', textAlign: 'center', color: '#6B6B8A', fontSize: '12.5px' }}>
          Didn't receive it? Check your spam folder or{' '}
          <Link to="/signup" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>sign up again</Link>
        </p>
        <p style={{ marginTop: '6px', textAlign: 'center', color: '#6B6B8A', fontSize: '12.5px' }}>
          Back to{' '}
          <Link to="/login" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>login</Link>
        </p>
      </div>
    </div>
  );
}


