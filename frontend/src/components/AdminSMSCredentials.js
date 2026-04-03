import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaKey, FaArrowLeft, FaSave } from 'react-icons/fa';

export default function AdminSMSCredentials() {
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [senderIds, setSenderIds] = useState('');
  const [freeTrialSenderId, setFreeTrialSenderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [credentials, setCredentials] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await API.get('sms/credentials/');
      setCredentials(response.data);
      setUser(response.data.user || '');
      setSenderIds((response.data.sender_ids || []).join(', '));
      setFreeTrialSenderId(response.data.free_trial_default_sender_id || '');
      setPassword(''); // Don't show password on fetch
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to load credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    // Validation
    if (!user.trim()) {
      setError('Profile ID is required');
      setSaving(false);
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      setSaving(false);
      return;
    }

    if (!senderIds.trim()) {
      setError('At least one sender ID is required');
      setSaving(false);
      return;
    }

    const senderIdArray = senderIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (senderIdArray.length === 0) {
      setError('Please enter at least one sender ID');
      setSaving(false);
      return;
    }

    const normalizedTrialSender = (freeTrialSenderId || '').trim();
    if (!normalizedTrialSender) {
      setError('Please select Free Trial OTP/SMS sender ID');
      setSaving(false);
      return;
    }

    if (!senderIdArray.includes(normalizedTrialSender)) {
      setError('Free Trial OTP/SMS sender ID must be one of configured sender IDs');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        user: user.trim(),
        password: password.trim(),
        sender_ids: senderIdArray,
        free_trial_default_sender_id: normalizedTrialSender,
        is_active: true,
      };

      console.log('Sending payload:', payload);

      const response = await API.patch('sms/credentials/', payload);
      console.log('Save response:', response.data);

      setCredentials(response.data);
      setSuccess('✓ SMS Credentials saved successfully!');
      setPassword('');
      setShowForm(false);
      
      // Fetch updated credentials
      fetchCredentials();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error details:', err);
      const errorMsg = err.response?.data?.detail || 
                       (err.response?.data && typeof err.response.data === 'object' 
                         ? JSON.stringify(err.response.data) 
                         : err.message);
      setError(`Failed to save credentials: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading credentials...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          backgroundColor: '#f0f0f0',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        <FaArrowLeft /> Back to Dashboard
      </button>

      <h2 style={{ color: '#111827', marginBottom: '10px' }}>
        <FaKey style={{ marginRight: '10px' }} />
        SMS Provider Credentials
      </h2>
      <p style={{ color: '#999', marginBottom: '30px' }}>
        Configure your SMS provider credentials here. Your credentials are stored securely and never logged.
      </p>

      {error && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            borderRadius: '6px',
            border: '1px solid #f44336',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            borderRadius: '6px',
            border: '1px solid #4caf50',
          }}
        >
          {success}
        </div>
      )}

      {!showForm && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px',
          }}
        >
          {credentials && credentials.is_active ? (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#999', fontSize: '12px' }}>
                  Profile ID (User)
                </label>
                <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                  {credentials.user}
                </p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#999', fontSize: '12px' }}>
                  Sender IDs
                </label>
                <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                  {credentials.sender_ids && credentials.sender_ids.length > 0
                    ? credentials.sender_ids.join(', ')
                    : 'No sender IDs configured'}
                </p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#999', fontSize: '12px' }}>
                  Free Trial OTP/SMS Sender ID
                </label>
                <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                  {credentials.free_trial_default_sender_id || 'Not selected'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '12px' }}>
                  Password
                </label>
                <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                  ••••••••••
                </p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Edit Credentials
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#999' }}>
              <p>No credentials configured yet.</p>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Add Credentials
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSaveCredentials}
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333',
              }}
            >
              Profile ID (User) *
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Enter your profile ID from SMS provider"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <small style={{ color: '#999' }}>
              Your unique profile ID from the SMS provider
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333',
              }}
            >
              Password / API Key *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password/API key"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <small style={{ color: '#999' }}>
              Your password or API key from the SMS provider
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333',
              }}
            >
              Sender IDs (comma-separated) *
            </label>
            <input
              type="text"
              value={senderIds}
              onChange={(e) => setSenderIds(e.target.value)}
              placeholder="e.g., ABC, MYAPP, SENDER1"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <small style={{ color: '#999' }}>
              List of approved sender IDs separated by commas
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333',
              }}
            >
              Free Trial OTP/SMS Sender ID *
            </label>
            <select
              value={freeTrialSenderId}
              onChange={(e) => setFreeTrialSenderId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">Select sender ID for free trial OTP + SMS</option>
              {senderIds
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean)
                .map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
            </select>
            <small style={{ color: '#999' }}>
              This sender ID will be used automatically for free trial OTP and free trial SMS.
            </small>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError('');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ccc',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: saving ? '#999' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FaSave /> {saving ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>

          <div
            style={{
              marginTop: '30px',
              padding: '15px',
              backgroundColor: '#fff3e0',
              borderLeft: '4px solid #FF9800',
              borderRadius: '4px',
            }}
          >
            <strong style={{ color: '#E65100' }}>⚠️ Security Notice:</strong>
            <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#E65100' }}>
              <li>Your credentials are stored securely in the database</li>
              <li>They are never logged or displayed in plain text</li>
              <li>Only transmitted directly to the SMS provider API</li>
              <li>Admin only can view and modify these credentials</li>
            </ul>
          </div>
        </form>
      )}
    </div>
  );
}
