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
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
        <p>Email not found. <Link to="/forgot-password" style={{ color: '#2196F3' }}>Start over</Link></p>
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
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Reset Password</h2>
      <p style={{ color: '#666' }}>We've sent an OTP to <strong>{email}</strong></p>

      {error && <div style={{ color: '#d32f2f', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}
      {diagnostics && (
        <div style={{ color: '#92400E', marginBottom: '10px', padding: '10px', backgroundColor: '#FFF7ED', borderRadius: '4px', border: '1px solid #FED7AA', fontSize: '12px' }}>
          {diagnostics.errorCode && <div><strong>Error:</strong> {diagnostics.errorCode}</div>}
          {diagnostics.nextStep && <div><strong>Next Step:</strong> {diagnostics.nextStep}</div>}
        </div>
      )}
      
      {success && <div style={{ color: '#388e3c', marginBottom: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>✓ Password reset successfully! Redirecting to login...</div>}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Enter OTP (6 digits)</label>
        <input 
          type="text"
          placeholder="000000"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={loading}
          maxLength="6"
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password</label>
        <input 
          type="password"
          placeholder="At least 8 characters"
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          disabled={loading}
          onKeyPress={handleKeyPress}
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Confirm Password</label>
        <input 
          type="password"
          placeholder="Confirm password"
          value={confirmPass}
          onChange={e => setConfirmPass(e.target.value)}
          disabled={loading}
          onKeyPress={handleKeyPress}
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
      </div>

      <button 
        onClick={submit}
        disabled={loading}
        style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>

      <p style={{ marginTop: '15px', textAlign: 'center', color: '#666' }}>
        <Link to="/forgot-password" style={{ color: '#2196F3', textDecoration: 'none' }}>Didn't receive OTP? Try again</Link>
      </p>
    </div>
  );
}


