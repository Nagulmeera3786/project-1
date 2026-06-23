import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import API from '../api';

export default function EmployeeDualOTP() {
  const loc = useLocation();
  const queryEmail = new URLSearchParams(loc.search).get('email') || '';
  const email = loc.state?.email || queryEmail;
  const initialMessage = loc.state?.message || '';

  const [employeeOtp, setEmployeeOtp] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(initialMessage);

  const submit = async () => {
    if (!email) {
      setError('Employee email not found. Please start signup again.');
      return;
    }
    if (employeeOtp.length !== 6 || adminOtp.length !== 6) {
      setError('Enter valid 6-digit employee OTP and admin OTP.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await API.post('employee/verify-dual-otp/', {
        email,
        employee_otp: employeeOtp,
        admin_otp: adminOtp,
      });
      setMessage('Verification successful. You can now login as employee.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Dual OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B82 50%, #5B3FA8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'white',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 24px 64px rgba(26,14,78,0.35)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1A1A2E' }}>Employee Dual OTP Verification</h2>
          <p style={{ marginTop: '8px', color: '#6B6B8A', fontSize: '14px' }}>
            Verify OTP sent to employee email and admin email.
          </p>
          {email && <p style={{ marginTop: '6px', color: '#3D2B82', fontSize: '13px' }}>Employee: {email}</p>}
        </div>

        {error && (
          <div
            style={{
              color: '#DC2626',
              marginBottom: '16px',
              padding: '12px 14px',
              backgroundColor: '#FFF0F0',
              borderRadius: '8px',
              fontSize: '13.5px',
              border: '1px solid #FCA5A5',
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              color: '#166534',
              marginBottom: '16px',
              padding: '12px 14px',
              backgroundColor: '#ECFDF5',
              borderRadius: '8px',
              fontSize: '13.5px',
              border: '1px solid #86EFAC',
            }}
          >
            {message}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2D1B69' }}>Employee OTP</label>
          <input
            type="text"
            maxLength={6}
            value={employeeOtp}
            onChange={(e) => setEmployeeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1.5px solid #DDD4F8',
              borderRadius: '9px',
              letterSpacing: '8px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2D1B69' }}>Admin OTP</label>
          <input
            type="text"
            maxLength={6}
            value={adminOtp}
            onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1.5px solid #DDD4F8',
              borderRadius: '9px',
              letterSpacing: '8px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#C4B5F0' : 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
            color: 'white',
            border: 'none',
            borderRadius: '9px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          {loading ? 'Verifying...' : 'Verify Both OTPs'}
        </button>

        <p style={{ marginTop: '14px', textAlign: 'center', color: '#6B6B8A', fontSize: '13px' }}>
          <Link to="/signup" style={{ color: '#5B3FA8', fontWeight: 600, textDecoration: 'none' }}>
            Back to Signup
          </Link>
          {' • '}
          <Link to="/login" style={{ color: '#5B3FA8', fontWeight: 600, textDecoration: 'none' }}>
            Employee Login
          </Link>
        </p>
      </div>
    </div>
  );
}
