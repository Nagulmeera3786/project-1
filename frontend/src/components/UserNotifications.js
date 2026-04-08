import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaArrowLeft, FaBell } from 'react-icons/fa';

export default function UserNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await API.get('notifications/my/');
      setItems(response.data || []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (recipientId) => {
    try {
      await API.patch(`notifications/my/${recipientId}/read/`, {});
      setItems((prev) => prev.map((item) => (item.id === recipientId ? { ...item, is_read: true } : item)));
    } catch (err) {
      // no-op
    }
  };

  return (
    <div className="notifications-page" style={{ padding: '24px' }}>
      <button
        className="notifications-back-btn"
        onClick={() => navigate('/dashboard')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: '#f0f0f0', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}
      >
        <FaArrowLeft /> Back
      </button>

      <div className="white-card notifications-card">
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBell /> My Notifications
        </h2>

        {loading ? (
          <p>Loading notifications...</p>
        ) : items.length === 0 ? (
          <p>No notifications available.</p>
        ) : (
          <div>
            {items.map((item) => (
              <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #efefef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <strong>{item.is_read ? 'Read' : 'Unread'}</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>{new Date(item.notification_created_at).toLocaleString()}</span>
                </div>
                <div style={{ marginTop: '6px' }}>{item.content}</div>
                {!item.is_read && (
                  <button
                    className="notifications-secondary-btn"
                    onClick={() => markAsRead(item.id)}
                    style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

