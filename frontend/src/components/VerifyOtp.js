import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function VerifyOtp() {
  const loc = useLocation();
  const email = loc.state?.email;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!email) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
        <p>Email not found. <Link to="/signup" style={{ color: '#2196F3' }}>Try signing up again</Link></p>
      </div>
    );
  }

  const submit = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await API.post('verify-otp/', { email, otp });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('authToken', res.data.access);
      // Use window.location to force page reload
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Verify Email</h2>
      <p style={{ color: '#666' }}>We've sent a 6-digit OTP to <strong>{email}</strong></p>

      {error && <div style={{ color: '#d32f2f', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Enter OTP (6 digits)</label>
        <input 
          type="text"
          placeholder="000000"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyPress={handleKeyPress}
          disabled={loading}
          maxLength="6"
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '18px', letterSpacing: '5px' }}
        />
      </div>

      <button 
        onClick={submit}
        disabled={loading}
        style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <p style={{ marginTop: '15px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
        Didn't receive OTP? Check spam folder or <Link to="/signup" style={{ color: '#2196F3', textDecoration: 'none' }}>sign up again</Link>
      </p>
    </div>
  );
}

