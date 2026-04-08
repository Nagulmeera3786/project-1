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
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Forgot Password</h2>
      <p style={{ color: '#666' }}>Enter your email address and we'll send you an OTP to reset your password.</p>
      
      {error && (
        <div style={{ color: '#d32f2f', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {diagnostics && (
        <div style={{ color: '#f57c00', marginBottom: '10px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '4px', border: '1px solid #ffe0b2', fontSize: '12px' }}>
          <strong>📋 Diagnostics:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {diagnostics.errorCode && <li><strong>Error:</strong> {diagnostics.errorCode}</li>}
            {diagnostics.provider && <li><strong>Email Provider:</strong> {diagnostics.provider}</li>}
            {diagnostics.host && <li><strong>SMTP Host:</strong> {diagnostics.host}</li>}
            {diagnostics.otpGenerated !== undefined && (
              <li><strong>OTP Generated:</strong> {diagnostics.otpGenerated ? '✓ Yes' : '✗ No'}</li>
            )}
            {diagnostics.nextStep && (
              <li><strong>Next Step:</strong> {diagnostics.nextStep}</li>
            )}
          </ul>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#e65100' }}>
            💡 Tip: Share this info with your developer. Check Render logs at: https://dashboard.render.com → Logs
          </p>
        </div>
      )}
      
      {success && (
        <div style={{ color: '#388e3c', marginBottom: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
          ✓ OTP sent successfully! Redirecting...
        </div>
      )}
      
      <input 
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
      />
      
      <button 
        onClick={submit}
        disabled={loading}
        style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Sending OTP...' : 'Send OTP'}
      </button>

      <p style={{ marginTop: '15px', textAlign: 'center', color: '#666' }}>
        Remember your password? <Link to="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>Login</Link>
      </p>
    </div>
  );
}


