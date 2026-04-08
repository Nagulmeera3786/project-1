import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaArrowLeft, FaBell, FaPaperPlane } from 'react-icons/fa';

const FILTERS = [
  { value: 'all_users', label: 'All Users' },
  { value: 'verified_users', label: 'Verified Users' },
  { value: 'not_verified_users', label: 'Not Verified Users' },
  { value: 'new_joiners', label: 'New Joiners (Last 7 days)' },
  { value: 'active_users', label: 'Active Users' },
  { value: 'inactive_users', label: 'Inactive Users' },
  { value: 'free_trial_users', label: 'Who Uses Free Trial' },
  { value: 'non_free_trial_users', label: "Who Don't Use Free Trial" },
];

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [audienceFilter, setAudienceFilter] = useState('all_users');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const canSend = useMemo(() => content.trim().length > 0 && previewCount > 0, [content, previewCount]);

  const loadPreview = async (selectedFilter) => {
    setLoadingPreview(true);
    setMessage('');
    try {
      const response = await API.get(`admin/notifications/preview/?audience_filter=${selectedFilter}`);
      setPreview(response.data.preview_recipients || []);
      setPreviewCount(response.data.total_recipients || 0);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to load recipients preview');
      setPreview([]);
      setPreviewCount(0);
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await API.get('admin/notifications/history/');
      setHistory(response.data || []);
    } catch (err) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadPreview(audienceFilter);
    loadHistory();
  }, []);

  const handleFilterChange = async (value) => {
    setAudienceFilter(value);
    await loadPreview(value);
  };

  const sendNotification = async () => {
    setSending(true);
    setMessage('');
    try {
      await API.post('admin/notifications/send/', {
        content: content.trim(),
        audience_filter: audienceFilter,
      });

      setMessage('Notification sent successfully.');
      setContent('');
      await loadPreview(audienceFilter);
      await loadHistory();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="notifications-page" style={{ padding: '24px' }}>
      <button
        className="notifications-back-btn"
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
          backgroundColor: '#f0f0f0',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        <FaArrowLeft /> Back to Dashboard
      </button>

      <div className="white-card notifications-card" style={{ marginBottom: '18px' }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBell /> Send Internal Notifications
        </h2>
        <p style={{ color: '#666', marginTop: 0 }}>
          Internal communication only. No SMS/WhatsApp credentials or external subscriptions are used.
        </p>

        <div className="notifications-form-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Audience Filter</label>
            <select
              value={audienceFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              {FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#555' }}>
              Matched users: <strong>{previewCount}</strong>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Notification Content</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write notification content..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={sendNotification}
            disabled={!canSend || sending}
            className="btn-purple"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
          >
            <FaPaperPlane /> {sending ? 'Sending...' : 'Send Notification'}
          </button>
          <button
            className="notifications-secondary-btn"
            onClick={() => loadPreview(audienceFilter)}
            style={{ padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
          >
            Refresh Preview
          </button>
          {message && <span style={{ color: message.includes('successfully') ? '#2e7d32' : '#c62828' }}>{message}</span>}
        </div>
      </div>

      <div className="white-card notifications-card" style={{ marginBottom: '18px' }}>
        <h3 style={{ marginTop: 0 }}>Recipients Preview (Before Sending)</h3>
        {loadingPreview ? (
          <p>Loading preview...</p>
        ) : preview.length === 0 ? (
          <p>No recipients match this filter.</p>
        ) : (
          <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
            {preview.map((user) => (
              <div key={user.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{user.full_name || user.username}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{user.email}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="white-card notifications-card">
        <h3 style={{ marginTop: 0 }}>Notification History (Notification Module)</h3>
        {history.length === 0 ? (
          <p>No notifications sent yet.</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {history.map((item) => (
              <div key={item.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <strong>{item.audience_filter}</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div style={{ margin: '6px 0', color: '#333' }}>{item.content}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Recipients: {item.recipient_count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

