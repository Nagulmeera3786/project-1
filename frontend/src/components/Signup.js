import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { parseApiError } from '../errorHelpers';
import { COUNTRY_CODES } from './countryCodes';

export default function Signup() {
  const [signupMode, setSignupMode] = useState('user');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPass: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBufferingImage, setShowBufferingImage] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    () => COUNTRY_CODES.find(country => country.iso2 === 'IN') || COUNTRY_CODES[0]
  );
  const countryPickerRef = useRef(null);
  const bufferingTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = event => {
      if (countryPickerRef.current && !countryPickerRef.current.contains(event.target)) {
        setShowCountryPicker(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      if (bufferingTimerRef.current) {
        clearTimeout(bufferingTimerRef.current);
      }
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) {
      return COUNTRY_CODES;
    }

    return COUNTRY_CODES.filter(country => {
      const searchTarget = `${country.name} ${country.iso2} ${country.dialCode}`.toLowerCase();
      return searchTarget.includes(query);
    });
  }, [countrySearch]);

  const startBufferingFlow = () => {
    if (bufferingTimerRef.current) {
      clearTimeout(bufferingTimerRef.current);
    }
    setError('');
    setShowBufferingImage(true);
    bufferingTimerRef.current = setTimeout(() => {
      setShowBufferingImage(false);
      setError('Please try again after sometime.');
    }, 45000);
  };

  const isRecoverableEmployeeSignupTimeout = err => {
    if (err?.response) {
      return false;
    }

    const errorCode = String(err?.code || '').toUpperCase();
    const errorMessage = String(err?.message || '').toLowerCase();
    return errorCode === 'ECONNABORTED' || errorMessage.includes('timeout');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setShowBufferingImage(false);
    if (bufferingTimerRef.current) {
      clearTimeout(bufferingTimerRef.current);
    }

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

    const normalizedPhone = form.phone.replace(/\D/g, '');
    const fullPhoneNumber = `${selectedCountry.dialCode}${normalizedPhone}`;
    const totalDigits = fullPhoneNumber.replace(/\D/g, '').length;

    if (totalDigits < 10 || totalDigits > 15) {
      setError('Enter a valid mobile number with country code');
      return;
    }

    setLoading(true);

    try {
      if (signupMode === 'employee') {
        await API.post('employee/signup/', {
          first_name: form.name,
          email: form.email,
          phone_number: fullPhoneNumber,
          password: form.password,
          department: 'General',
        }, {
          timeout: 90000,
        });
        navigate(`/employee/verify-dual-otp?email=${encodeURIComponent(form.email)}`, { state: { email: form.email } });
      } else {
        const response = await API.post('signup/', {
          first_name: form.name,
          username: form.email,
          email: form.email,
          phone_number: fullPhoneNumber,
          password: form.password,
        });

        if (response.data?.requires_otp === false && response.data?.access) {
          localStorage.setItem('access', response.data.access);
          localStorage.setItem('refresh', response.data.refresh);
          localStorage.setItem('authToken', response.data.access);
          window.location.href = '/dashboard';
        } else {
          // Continue to OTP verification even when provider reports delayed delivery.
          navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`, { state: { email: form.email } });
        }
      }
    } catch (err) {
      if (signupMode === 'employee' && isRecoverableEmployeeSignupTimeout(err)) {
        navigate(`/employee/verify-dual-otp?email=${encodeURIComponent(form.email)}`, {
          state: {
            email: form.email,
            message: 'OTP delivery is taking longer than expected, but if you received the codes you can continue here.',
          },
        });
        return;
      }

      const parsed = parseApiError(err, 'Signup failed. Please try again.');
      if (parsed.isBuffering) {
        startBufferingFlow();
      } else {
        setShowBufferingImage(false);
        setError(parsed.message);
      }
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
                <div style={{ marginBottom: '14px', display: 'flex', gap: '8px' }}>
                  {[
                    { key: 'user', label: 'User Signup' },
                    { key: 'employee', label: 'Employee Signup' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSignupMode(item.key)}
                      style={{
                        flex: 1,
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: signupMode === item.key ? '1px solid #7C5DC7' : '1px solid #DDD4F8',
                        background: signupMode === item.key ? '#F5F2FF' : '#fff',
                        color: signupMode === item.key ? '#4C3A92' : '#6B6B8A',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px', height: '52px', margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '16px',
          }}>BHI</div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1A1A2E' }}>Create account</h2>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#6B6B8A' }}>Join Bhisha platform</p>
        </div>

        {error && (
          <div style={{
            color: '#DC2626', marginBottom: '16px', padding: '12px 14px',
            backgroundColor: '#FFF0F0', borderRadius: '8px',
            fontSize: '13.5px', border: '1px solid #FCA5A5',
          }}>{error}</div>
        )}

        {showBufferingImage && (
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src="/buffering.svg"
              alt=""
              aria-hidden="true"
              style={{ width: '64px', height: '64px' }}
            />
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
            <label style={labelStyle}>Mobile Number</label>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', alignItems: 'start' }}>
              <div ref={countryPickerRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowCountryPicker(prev => !prev)}
                  style={{
                    ...inputStyle,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: loading ? '#F5F3FF' : 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>{selectedCountry.dialCode} ({selectedCountry.iso2})</span>
                  <span style={{ color: '#6B6B8A', fontSize: '12px' }}>▼</span>
                </button>

                {showCountryPicker && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #DDD4F8',
                    borderRadius: '12px',
                    boxShadow: '0 18px 40px rgba(45,27,105,0.18)',
                    padding: '10px',
                    zIndex: 10,
                  }}>
                    <input
                      type="text"
                      placeholder="Search country or code"
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      style={{ ...inputStyle, marginBottom: '8px', padding: '9px 11px' }}
                    />
                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {filteredCountries.map(country => (
                        <button
                          key={`${country.iso2}-${country.dialCode}`}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setCountrySearch('');
                            setShowCountryPicker(false);
                          }}
                          style={{
                            width: '100%',
                            border: 'none',
                            background: country.iso2 === selectedCountry.iso2 && country.dialCode === selectedCountry.dialCode ? '#F5F2FF' : 'transparent',
                            color: '#1A1A2E',
                            padding: '9px 10px',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          {country.name} · {country.dialCode}
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div style={{ padding: '8px 10px', color: '#6B6B8A', fontSize: '13px' }}>No country code found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <input
                type="tel"
                placeholder="Mobile number"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                disabled={loading}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#7C5DC7'}
                onBlur={e => e.target.style.borderColor = '#DDD4F8'}
              />
            </div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#6B6B8A' }}>
              Your account will store {selectedCountry.dialCode} with this mobile number.
            </div>
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
            disabled={loading || showBufferingImage}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#C4B5F0' : 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
              color: 'white', border: 'none', borderRadius: '9px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '700', fontSize: '15px',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(91,63,168,0.35)',
            }}
          >
            {loading
              ? 'Creating account...'
              : (showBufferingImage
                ? 'Please wait...'
                : (signupMode === 'employee' ? 'Create Employee Account' : 'Create Account'))}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', color: '#6B6B8A', fontSize: '13.5px' }}>
          Already have an account? <Link to="/login" style={{ color: '#5B3FA8', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}


