import { useState } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  const submit = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await API.post('login/', { email, password });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('authToken', res.data.access);
      // Use window.location to force refresh and update isLoggedIn state
      window.location.href = '/dashboard';
    } catch (err) {
      if (!err.response) {
        setError('Network error while logging in. Please check your internet/API server availability and try again.');
      } else {
        setError(err.response?.data?.detail || 'Login failed: ' + err.message);
      }
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
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1A1A2E' }}>Welcome back</h2>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B6B8A' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{
            color: '#DC2626', marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#FFF0F0', borderRadius: '8px',
            fontSize: '13.5px', border: '1px solid #FCA5A5',
          }}>{error}</div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' }}>Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
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

        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13.5px', color: '#2D1B69' }}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ marginTop: '16px', textAlign: 'center', color: '#6B6B8A', fontSize: '13.5px' }}>
          Forgot password? <Link to="/forgot-password" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>Reset here</Link>
        </p>

        <p style={{ marginTop: '10px', textAlign: 'center', color: '#6B6B8A', fontSize: '13.5px' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

