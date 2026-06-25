import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { FaUsers, FaDownload, FaArrowLeft } from 'react-icons/fa';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [senderDrafts, setSenderDrafts] = useState({});
  const [senderSuggestions, setSenderSuggestions] = useState({});
  const [adminSenderIds, setAdminSenderIds] = useState([]);
  const [creditDrafts, setCreditDrafts] = useState({});
  const [deletingUserId, setDeletingUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const profileResponse = await API.get('profile/');
      const manageUsers = Boolean(
        profileResponse.data?.can_manage_support_data ||
        profileResponse.data?.is_primary_admin ||
        profileResponse.data?.is_staff ||
        profileResponse.data?.is_superuser
      );

      const usersResponse = await API.get('admin/users/');
      let credentialsResponse = { data: { sender_ids: [] } };
      if (manageUsers) {
        credentialsResponse = await API.get('sms/credentials/');
      }

      setCanManageUsers(manageUsers);
      const userRows = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      setUsers(userRows);
      setAdminSenderIds(credentialsResponse.data?.sender_ids || []);
      const draftMap = {};
      userRows.forEach((user) => {
        draftMap[user.id] = {
          sender_id_type: user.sender_id_type || 'alphanumeric',
          sender_id: user.sender_id || '',
          free_trial_sender_id: user.free_trial_sender_id || '',
        };
      });
      setSenderDrafts(draftMap);
      const draftCredits = {};
      userRows.forEach((user) => {
        draftCredits[user.id] = {
          add_message_credits: '',
          add_email_validation_credits: '',
        };
      });
      setCreditDrafts(draftCredits);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have permission to access this page. Support or admin access required.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load users');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSenderDraft = (userId, field, value) => {
    setSenderDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: value,
      },
    }));
  };

  const saveSenderId = async (userId) => {
    if (!canManageUsers) {
      return;
    }

    const draft = senderDrafts[userId] || { sender_id_type: 'alphanumeric', sender_id: '' };
    try {
      const response = await API.patch(`admin/users/${userId}/permissions/`, {
        sender_id_type: draft.sender_id_type,
        sender_id: draft.sender_id,
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                sender_id_type: response.data.sender_id_type,
                sender_id: response.data.sender_id,
              }
            : user
        )
      );

      setSenderDrafts((prev) => ({
        ...prev,
        [userId]: {
          sender_id_type: response.data.sender_id_type || 'alphanumeric',
          sender_id: response.data.sender_id || '',
          free_trial_sender_id: response.data.free_trial_sender_id || prev[userId]?.free_trial_sender_id || '',
        },
      }));

      setSenderSuggestions((prev) => ({ ...prev, [userId]: [] }));
    } catch (err) {
      const suggestions = err.response?.data?.suggestions || [];
      setSenderSuggestions((prev) => ({ ...prev, [userId]: suggestions }));
      alert('Failed to save sender ID: ' + (err.response?.data?.detail || err.message));
    }
  };

  const updatePermission = async (userId, payload) => {
    if (!canManageUsers) {
      return;
    }

    try {
      const response = await API.patch(`admin/users/${userId}/permissions/`, payload);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_staff: response.data.is_staff,
                is_active: response.data.is_active,
                is_sms_enabled: response.data.is_sms_enabled,
                free_trial_sender_id: response.data.free_trial_sender_id,
              }
            : user
        )
      );
    } catch (err) {
      alert('Failed to update permission: ' + (err.response?.data?.detail || err.message));
    }
  };

  const deleteUser = async (userId, username) => {
    if (!canManageUsers) {
      return;
    }

    if (!window.confirm(`Delete user ${username}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await API.delete(`admin/users/${userId}/permissions/`);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setSenderDrafts((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setSenderSuggestions((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingUserId(null);
    }
  };

  const updateCreditDraft = (userId, field, value) => {
    setCreditDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: value,
      },
    }));
  };

  const saveWalletCredits = async (userId) => {
    if (!canManageUsers) {
      return;
    }

    const draft = creditDrafts[userId] || {};
    const addMessage = Number(draft.add_message_credits || 0);
    const addEmail = Number(draft.add_email_validation_credits || 0);

    if (!Number.isFinite(addMessage) || !Number.isFinite(addEmail)) {
      alert('Please enter valid credit values');
      return;
    }

    try {
      const response = await API.patch(`admin/users/${userId}/wallet/credits/`, {
        add_message_credits: String(addMessage),
        add_email_validation_credits: String(addEmail),
      });

      setUsers((prev) => prev.map((user) => (
        user.id === userId
          ? {
              ...user,
              wallet_balance: response.data.message_credits,
              email_validation_balance: response.data.email_validation_credits,
            }
          : user
      )));

      setCreditDrafts((prev) => ({
        ...prev,
        [userId]: {
          add_message_credits: '',
          add_email_validation_credits: '',
        },
      }));
    } catch (err) {
      alert('Failed to update credits: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    const haystack = [
      user.username,
      user.first_name,
      user.last_name,
      user.email,
      user.phone_number,
      user.sender_id,
      user.free_trial_sender_id,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  const downloadExcel = async () => {
    try {
      const response = await API.get('admin/users/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      alert('Error downloading file: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading users...</div>;
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '1000px',
        margin: '50px auto',
        padding: '20px',
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        borderRadius: '8px'
      }}>
        <p>{error}</p>
        <Link to="/dashboard" style={{ color: '#2196F3' }}>Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="admin-compact-panel" style={{ padding: '24px' }}>
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
          cursor: 'pointer'
        }}
      >
        <FaArrowLeft /> Back to Dashboard
      </button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px'
      }}>
        <h2 style={{ margin: 0, color: '#111827' }}>
          <FaUsers style={{ marginRight: '10px' }} />
          Users Management
        </h2>
        {canManageUsers && (
          <button
            onClick={downloadExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            <FaDownload /> Download Excel
          </button>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name, email, phone, sender ID..."
          style={{ width: '100%', maxWidth: '420px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        />
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div className="admin-table-scroll">
        <table className="admin-compact-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Username</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Phone</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Account Type</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>SMS Access</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Sender Type</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Sender ID</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Free Trial Sender</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Joined Date</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: '1px solid #eee',
                  backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#fafafa'}
              >
                <td style={{ padding: '15px' }}>{user.username}</td>
                <td style={{ padding: '15px' }}>{[user.first_name, user.last_name].filter(Boolean).join(' ') || '-'}</td>
                <td style={{ padding: '15px' }}>{user.email}</td>
                <td style={{ padding: '15px' }}>{user.phone_number || '-'}</td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: user.is_active ? '#e8f5e9' : '#ffebee',
                    color: user.is_active ? '#2e7d32' : '#c62828'
                  }}>
                    {user.is_active ? '✓ Verified' : '✗ Not Verified'}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: user.is_staff ? '#e3f2fd' : '#f3e5f5',
                    color: user.is_staff ? '#1565c0' : '#6a1b9a'
                  }}>
                    {user.is_staff ? 'Admin' : 'User'}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: user.is_sms_enabled ? '#e8f5e9' : '#ffebee',
                    color: user.is_sms_enabled ? '#2e7d32' : '#c62828'
                  }}>
                    {user.is_sms_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'center', textTransform: 'capitalize' }}>
                  {user.sender_id_type || 'alphanumeric'}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  {user.sender_id || '-'}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  {user.free_trial_sender_id || '-'}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  {new Date(user.date_joined).toLocaleDateString()}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {canManageUsers ? (
                      <>
                        <button
                          onClick={() => updatePermission(user.id, { is_staff: !user.is_staff })}
                          style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: user.is_staff ? '#ef5350' : '#42a5f5', color: 'white' }}
                        >
                          {user.is_staff ? 'Revoke Admin' : 'Grant Admin'}
                        </button>
                        <button
                          onClick={() => updatePermission(user.id, { is_active: !user.is_active })}
                          style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: user.is_active ? '#ef5350' : '#66bb6a', color: 'white' }}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => updatePermission(user.id, { is_sms_enabled: !user.is_sms_enabled })}
                          style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: user.is_sms_enabled ? '#ef5350' : '#66bb6a', color: 'white' }}
                        >
                          {user.is_sms_enabled ? 'Disable SMS' : 'Enable SMS'}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.username)}
                          disabled={deletingUserId === user.id}
                          style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: deletingUserId === user.id ? 'not-allowed' : 'pointer', backgroundColor: '#c62828', color: 'white' }}
                        >
                          {deletingUserId === user.id ? 'Deleting...' : 'Delete User'}
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#6B7280', fontWeight: 600 }}>Limited</span>
                    )}
                  </div>

                  {canManageUsers ? (
                    <>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <select
                          value={senderDrafts[user.id]?.sender_id_type || 'alphanumeric'}
                          onChange={(e) => updateSenderDraft(user.id, 'sender_id_type', e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd' }}
                        >
                          <option value="numeric">Numeric</option>
                          <option value="alphanumeric">Alphanumeric</option>
                        </select>
                        <input
                          type="text"
                          value={senderDrafts[user.id]?.sender_id || ''}
                          onChange={(e) => updateSenderDraft(user.id, 'sender_id', e.target.value)}
                          placeholder="Sender ID"
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', width: '120px' }}
                        />
                        <button
                          onClick={() => saveSenderId(user.id)}
                          style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#5e35b1', color: 'white' }}
                        >
                          Save Sender
                        </button>

                        <select
                          value={senderDrafts[user.id]?.free_trial_sender_id || ''}
                          onChange={(e) => updateSenderDraft(user.id, 'free_trial_sender_id', e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', width: '140px' }}
                        >
                          <option value="">Trial Sender ID</option>
                          {adminSenderIds.map((senderId) => (
                            <option key={`${user.id}-trial-${senderId}`} value={senderId}>{senderId}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => updatePermission(user.id, { free_trial_sender_id: senderDrafts[user.id]?.free_trial_sender_id || '' })}
                          style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#00897b', color: 'white' }}
                        >
                          Save Trial Sender
                        </button>
                      </div>

                      {(senderSuggestions[user.id] || []).length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {senderSuggestions[user.id].map((suggestedId) => (
                            <button
                              key={`${user.id}-${suggestedId}`}
                              onClick={() => updateSenderDraft(user.id, 'sender_id', suggestedId)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #5e35b1',
                                borderRadius: '14px',
                                backgroundColor: '#ede7f6',
                                color: '#5e35b1',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              {suggestedId}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ marginTop: '8px', color: '#6B7280', fontSize: '12px' }}>Sender and admin settings are hidden in support mode.</div>
                  )}

                  {canManageUsers && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        step="0.0001"
                        value={creditDrafts[user.id]?.add_message_credits || ''}
                        onChange={(e) => updateCreditDraft(user.id, 'add_message_credits', e.target.value)}
                        placeholder="+ Messaging"
                        style={{ width: '110px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        step="0.0001"
                        value={creditDrafts[user.id]?.add_email_validation_credits || ''}
                        onChange={(e) => updateCreditDraft(user.id, 'add_email_validation_credits', e.target.value)}
                        placeholder="+ Mail"
                        style={{ width: '110px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                      <button
                        onClick={() => saveWalletCredits(user.id)}
                        style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#1d4ed8', color: 'white' }}
                      >
                        Add Credits
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#334155' }}>
                    <div><strong>Messaging Credits:</strong> {user.wallet_balance || '0'}</div>
                    <div><strong>Mail Credits:</strong> {user.email_validation_balance || '0'}</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
        <p>Total Users: <strong>{filteredUsers.length}</strong></p>
        <p>Verified: <strong style={{ color: '#2e7d32' }}>{filteredUsers.filter(u => u.is_active).length}</strong></p>
        <p>Not Verified: <strong style={{ color: '#c62828' }}>{filteredUsers.filter(u => !u.is_active).length}</strong></p>
      </div>
    </div>
  );
}

