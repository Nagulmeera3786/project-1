import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { parseApiError } from '../errorHelpers';

export default function ResetPassword() {
  const loc = useLocation();
  const queryEmail = new URLSearchParams(loc.search).get('email') || '';
  const email = loc.state?.email || queryEmail;
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();

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
            <Link to="/forgot-password" style={{ color: '#5B3FA8', fontWeight: '600', textDecoration: 'none' }}>Start over</Link>
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setError('');
    setDiagnostics(null);

    if (!otp || !newPass || !confirmPass) {
      setError('All fields are required');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    if (newPass.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await API.post('reset-password/', { 
        email, 
        otp, 
        new_password: newPass 
      });
      setSuccess(true);
      setTimeout(() => {
        nav('/login');
      }, 2000);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to reset password. Please try again.');
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
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1A1A2E' }}>Reset Password</h2>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B6B8A' }}>
            OTP sent to <strong style={{ color: '#3D2B82' }}>{email}</strong>
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
            {diagnostics.errorCode && <div><strong>Error:</strong> {diagnostics.errorCode}</div>}
            {diagnostics.nextStep && <div><strong>Next Step:</strong> {diagnostics.nextStep}</div>}
          </div>
        )}
        {success && (
          <div style={{
            color: '#16a34a', marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#F0FDF4', borderRadius: '8px',
            fontSize: '13.5px', border: '1px solid #86EFAC',
          }}>Password reset successfully! Redirecting to login…</div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' }}>Enter OTP (6 digits)</label>
          <input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
            maxLength="6"
            style={{
              width: '100%', padding: '11px 14px',
              border: '1.5px solid #DDD4F8', borderRadius: '9px',
              boxSizing: 'border-box', fontSize: '20px', outline: 'none',
              letterSpacing: '8px', textAlign: 'center',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#7C5DC7'}
            onBlur={e => e.target.style.borderColor = '#DDD4F8'}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' }}>New Password</label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            disabled={loading}
            onKeyPress={handleKeyPress}
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

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' }}>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            disabled={loading}
            onKeyPress={handleKeyPress}
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
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>

        <p style={{ marginTop: '16px', textAlign: 'center', color: '#6B6B8A', fontSize: '13.5px' }}>
          <Link to="/forgot-password" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>
            Didn't receive OTP? Try again
          </Link>
        </p>
      </div>
    </div>
  );
}


