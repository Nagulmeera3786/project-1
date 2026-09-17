import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { getProfessionalErrorMessage } from '../errorHelpers';

export default function AdminSecuritySettings() {
  const navigate = useNavigate();
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoDisableDays, setAutoDisableDays] = useState('0');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');

  useEffect(() => {
    const load = async () => {
      try {
        const profileResponse = await API.get('profile/');
        const manage = Boolean(
          profileResponse.data?.is_primary_admin ||
          profileResponse.data?.is_staff ||
          profileResponse.data?.is_superuser
        );
        setCanManage(manage);

        const response = await API.get('admin/security-settings/');
        setAutoDisableDays(String(response.data.account_auto_disable_days ?? 0));
        setSessionTimeoutMinutes(String(response.data.session_timeout_minutes ?? 30));
      } catch (err) {
        if (err.response?.status === 403) {
          setError('You do not have permission to access this page. Admin access required.');
        } else {
          setError(getProfessionalErrorMessage(err, 'Failed to load security settings'));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await API.patch('admin/security-settings/', {
        account_auto_disable_days: Number(autoDisableDays),
        session_timeout_minutes: Number(sessionTimeoutMinutes),
      });
      setAutoDisableDays(String(response.data.account_auto_disable_days ?? 0));
      setSessionTimeoutMinutes(String(response.data.session_timeout_minutes ?? 30));
      setMessage('Security settings saved successfully.');
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Failed to save security settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading security settings...</div>;
  }

  if (error && !canManage) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: '#c62828' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '10px' }}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '760px' }}>
      <button
        onClick={() => navigate('/admin/users')}
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
        <FaArrowLeft /> Back to Users
      </button>

      <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FaShieldAlt /> Security Settings
      </h2>
      <p style={{ color: '#666' }}>
        Configure how the platform handles inactive accounts and idle sessions for all users, employees, and admins.
      </p>

      <div className="white-card" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '18px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
          Days-Since-Last-Login Visibility
        </label>
        <p style={{ color: '#666', fontSize: '13px', marginTop: 0 }}>
          Every user's account row shows how many days ago they last logged in (or "Never logged in"), so you can spot
          dormant accounts at a glance. View it on the{' '}
          <span style={{ color: '#5B3FA8', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/admin/users')}>
            Users page
          </span>{' '}
          under the "Last Login" column.
        </p>
      </div>

      <div className="white-card" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '18px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
          Auto-Disable Inactive Accounts
        </label>
        <p style={{ color: '#666', fontSize: '13px', marginTop: 0 }}>
          If a user has not logged in for this many days, their account is automatically disabled. Set to 0 to turn this off.
        </p>
        <input
          type="number"
          min="0"
          value={autoDisableDays}
          onChange={(e) => setAutoDisableDays(e.target.value)}
          disabled={!canManage || saving}
          style={{ width: '200px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="white-card" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '18px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
          Idle Session Timeout With Relogin Popup
        </label>
        <p style={{ color: '#666', fontSize: '13px', marginTop: 0 }}>
          If a signed-in user (admin, employee, or normal user) performs no action on their page for this many minutes,
          they are automatically logged out and shown a pop-up asking them to log in again. Set to 0 to turn this off.
        </p>
        <input
          type="number"
          min="0"
          value={sessionTimeoutMinutes}
          onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
          disabled={!canManage || saving}
          style={{ width: '200px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="white-card" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '18px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
          Inactive Users Notification Options
        </label>
        <p style={{ color: '#666', fontSize: '13px', marginTop: 0 }}>
          When sending an internal notification to "Inactive Users", the admin can choose 15, 30, 45, or 60 days without
          login as the audience. This is configured directly on the{' '}
          <span style={{ color: '#5B3FA8', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/admin/notifications')}>
            Notifications page
          </span>.
        </p>
      </div>

      {canManage && (
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn-purple"
          style={{ padding: '10px 20px' }}
        >
          {saving ? 'Saving...' : 'Save Security Settings'}
        </button>
      )}

      {message && <div style={{ marginTop: '12px', color: '#2e7d32' }}>{message}</div>}
      {error && canManage && <div style={{ marginTop: '12px', color: '#c62828' }}>{error}</div>}
    </div>
  );
}
