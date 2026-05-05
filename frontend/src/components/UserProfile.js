import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { FaArrowLeft, FaMoon, FaSun } from 'react-icons/fa';

const THEME_STORAGE_KEY = 'dashboardTheme';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [senderIdType, setSenderIdType] = useState('alphanumeric');
  const [senderId, setSenderId] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const enabled = storedTheme === 'dark';
    setIsDarkMode(enabled);
    document.body.classList.toggle('dark-theme', enabled);
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await API.get('profile/');
      setUser(response.data);
      setFirstName(response.data.first_name || '');
      setLastName(response.data.last_name || '');
      setPhoneNumber(response.data.phone_number || '');
      setSenderIdType(response.data.sender_id_type || 'alphanumeric');
      setSenderId(response.data.sender_id || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', next);
  };

  const saveProfileSettings = async () => {
    setSaveLoading(true);
    setSaveMessage('');
    setSuggestions([]);

    try {
      const response = await API.patch('profile/', {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        sender_id_type: senderIdType,
        sender_id: senderId,
      });

      setUser(response.data);
      setFirstName(response.data.first_name || '');
      setLastName(response.data.last_name || '');
      setPhoneNumber(response.data.phone_number || '');
      setSenderIdType(response.data.sender_id_type || 'alphanumeric');
      setSenderId(response.data.sender_id || '');
      setSaveMessage('Profile updated successfully.');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to save profile settings.';
      const responseSuggestions = err.response?.data?.suggestions || [];
      setSaveMessage(detail);
      setSuggestions(responseSuggestions);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '720px',
        margin: '50px auto',
        padding: '20px',
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        borderRadius: '8px',
      }}>
        <p>{error}</p>
        <Link to="/dashboard" style={{ color: '#2196F3' }}>Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '36px auto', padding: '0 16px' }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(26, 14, 78, 0.08)',
        border: '1px solid #EDE8FB',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #F0EFFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F5F3FF',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#5B3FA8',
              fontWeight: 600,
            }}
          >
            <FaArrowLeft /> Back
          </button>

          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isDarkMode ? '#1a0e4e' : '#F5F3FF',
              color: isDarkMode ? '#A78BFA' : '#5B3FA8',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />} {isDarkMode ? 'Dark mode on' : 'Enable dark mode'}
          </button>
        </div>

        <div style={{ padding: '24px 22px 26px' }}>
          <h2 style={{ marginTop: 0, marginBottom: 4, color: '#1a0e4e' }}>Profile Settings</h2>
          <p style={{ marginTop: 0, marginBottom: 20, color: '#6B6B8A', fontSize: 14 }}>
            Manage your personal information and sender ID preferences.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#514b79' }}>First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={inputStyle}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#514b79' }}>Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={inputStyle}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#514b79' }}>Email</label>
            <input
              value={user?.email || ''}
              disabled
              style={{ ...inputStyle, background: '#f4f3f9', color: '#817ca2' }}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#514b79' }}>Phone Number</label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={inputStyle}
              placeholder="10+ digit phone number"
            />
          </div>

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f0eef8' }}>
            <h3 style={{ marginTop: 0, marginBottom: 14, color: '#1c1748' }}>Sender ID Settings</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#514b79' }}>Sender ID Type</label>
              <select
                value={senderIdType}
                onChange={(e) => setSenderIdType(e.target.value)}
                style={inputStyle}
              >
                <option value="numeric">Numeric</option>
                <option value="alphanumeric">Alphanumeric</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#514b79' }}>Sender ID</label>
              <input
                type="text"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                placeholder={senderIdType === 'numeric' ? '6-15 digits' : '3-11 letters or numbers'}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            onClick={saveProfileSettings}
            disabled={saveLoading}
            style={{
              marginTop: 8,
              background: saveLoading ? '#a6a0c3' : 'linear-gradient(135deg, #5537a8, #7d63cc)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              cursor: saveLoading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </button>

          {saveMessage && (
            <p style={{
              marginTop: '12px',
              color: saveMessage.toLowerCase().includes('success') ? '#2e7d32' : '#d32f2f',
              fontSize: '14px',
            }}>
              {saveMessage}
            </p>
          )}

          {suggestions.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#666' }}>
                Suggested Sender IDs:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map((suggestedId) => (
                  <button
                    key={suggestedId}
                    onClick={() => setSenderId(suggestedId)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #6a4ad1',
                      borderRadius: '20px',
                      backgroundColor: '#eee8ff',
                      color: '#4b2f92',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {suggestedId}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #d8d4ee',
  fontSize: '14px',
  boxSizing: 'border-box',
};

