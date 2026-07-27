import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { FaCog, FaArrowLeft, FaToggleOn, FaToggleOff, FaFileAlt, FaTrash, FaSave } from 'react-icons/fa';
import { getProfessionalErrorMessage } from '../errorHelpers';

export default function AdminSMSDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAdminAccess, setHasAdminAccess] = useState(true);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState([]);
  const [messageSearch, setMessageSearch] = useState('');
  const [smsCredential, setSmsCredential] = useState(null);
  const [credentialLoading, setCredentialLoading] = useState(true);
  const [senderDrafts, setSenderDrafts] = useState({});
  const [userDrafts, setUserDrafts] = useState({});
  const [senderSuggestions, setSenderSuggestions] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [grantingAdminUserId, setGrantingAdminUserId] = useState(null);
  const [senderIdRequests, setSenderIdRequests] = useState([]);
  const [senderIdRequestsLoading, setSenderIdRequestsLoading] = useState(true);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [requestCountryFilter, setRequestCountryFilter] = useState('all');
  const [requestUseCaseFilter, setRequestUseCaseFilter] = useState('all');
  const [requestIndustryFilter, setRequestIndustryFilter] = useState('all');
  const [selectedSenderIdRequest, setSelectedSenderIdRequest] = useState(null);
  const [savingRequestStatusId, setSavingRequestStatusId] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [rechargeChargeSettings, setRechargeChargeSettings] = useState({
    service_charge_percentage: '0',
    tax_percentage: '0',
    gateway_configured: false,
  });
  const [savingRechargeSettings, setSavingRechargeSettings] = useState(false);
  const [rechargeSettingsMessage, setRechargeSettingsMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchMessages();
    fetchSenderIdRequests();
    fetchRechargeChargeSettings();
  }, []);

  const fetchRechargeChargeSettings = async () => {
    try {
      const response = await API.get('admin/wallet/recharge-settings/');
      setRechargeChargeSettings({
        service_charge_percentage: String(response.data?.service_charge_percentage ?? '0'),
        tax_percentage: String(response.data?.tax_percentage ?? '0'),
        gateway_configured: Boolean(response.data?.gateway_configured),
      });
    } catch (err) {
      setRechargeChargeSettings({
        service_charge_percentage: '0',
        tax_percentage: '0',
        gateway_configured: false,
      });
    }
  };

  const saveRechargeChargeSettings = async () => {
    if (!canManageUsers) {
      return;
    }

    setSavingRechargeSettings(true);
    setRechargeSettingsMessage('');
    try {
      const payload = {
        service_charge_percentage: rechargeChargeSettings.service_charge_percentage,
        tax_percentage: rechargeChargeSettings.tax_percentage,
      };
      const response = await API.patch('admin/wallet/recharge-settings/', payload);
      setRechargeChargeSettings({
        service_charge_percentage: String(response.data?.service_charge_percentage ?? '0'),
        tax_percentage: String(response.data?.tax_percentage ?? '0'),
        gateway_configured: Boolean(response.data?.gateway_configured),
      });
      setRechargeSettingsMessage('Recharge charge settings saved successfully.');
    } catch (err) {
      setRechargeSettingsMessage(`Failed to save recharge settings: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setSavingRechargeSettings(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const profileResponse = await API.get('profile/');
      const manageUsers = Boolean(
        profileResponse.data?.can_manage_support_data ||
        profileResponse.data?.is_primary_admin ||
        profileResponse.data?.is_staff ||
        profileResponse.data?.is_superuser
      );

      const response = await API.get('sms/admin/users/');
      setCanManageUsers(manageUsers);
      setUsers(response.data);
      setHasAdminAccess(true);

      const draftMap = {};
      const profileDraftMap = {};
      response.data.forEach((user) => {
        draftMap[user.id] = {
          sender_id_type: user.sender_id_type || 'alphanumeric',
          sender_id: user.sender_id || '',
        };

        profileDraftMap[user.id] = {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone_number: user.phone_number || '',
          is_active: Boolean(user.is_active),
          is_sms_enabled: Boolean(user.is_sms_enabled),
        };
      });
      setSenderDrafts(draftMap);
      setUserDrafts(profileDraftMap);
      if (manageUsers) {
        fetchCredentials();
      } else {
        setCredentialLoading(false);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setHasAdminAccess(false);
        setError('');
      } else {
        setError(getProfessionalErrorMessage(err, 'Failed to load users'));
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await API.get('sms/messages/');
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchSenderIdRequests = async () => {
    setSenderIdRequestsLoading(true);
    try {
      const response = await API.get('sms/admin/sender-id-requests/');
      const requestItems = Array.isArray(response.data) ? response.data : [];
      setSenderIdRequests(requestItems);
      setSelectedSenderIdRequest((currentSelection) => {
        if (!currentSelection) {
          return requestItems[0] || null;
        }
        return requestItems.find((item) => item.id === currentSelection.id) || requestItems[0] || null;
      });
    } catch (err) {
      console.error('Error fetching sender ID requests:', err);
      setSenderIdRequests([]);
      setSelectedSenderIdRequest(null);
    } finally {
      setSenderIdRequestsLoading(false);
    }
  };

  const updateRequestStatus = async (requestItem, nextStatus) => {
    if (!canManageUsers || !requestItem?.id || !nextStatus) {
      return;
    }

    setSavingRequestStatusId(requestItem.id);
    try {
      const response = await API.patch(`sms/admin/sender-id-requests/${requestItem.id}/`, {
        status: nextStatus,
      });

      const updatedRequest = response.data;
      setSenderIdRequests((prev) => prev.map((item) => (item.id === updatedRequest.id ? updatedRequest : item)));
      setSelectedSenderIdRequest((current) => {
        if (!current || current.id !== updatedRequest.id) {
          return current;
        }
        return updatedRequest;
      });
    } catch (err) {
      alert(`Failed to update request status: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setSavingRequestStatusId(null);
    }
  };

  const inferSenderIdType = (senderIdValue) => {
    const value = String(senderIdValue || '').trim();
    if (!value) {
      return 'alphanumeric';
    }
    return /^\d+$/.test(value) ? 'numeric' : 'alphanumeric';
  };

  const approveAndAssignSenderId = async (requestItem) => {
    if (!canManageUsers || !requestItem?.id || !requestItem?.user) {
      return;
    }

    const requestedSenderId = String(requestItem.required_sender_id || '').trim();
    const senderIdType = inferSenderIdType(requestedSenderId);
    const validationError = validateSenderIdDraft(senderIdType, requestedSenderId);
    if (validationError) {
      alert(`Cannot approve this request: ${validationError}`);
      return;
    }

    setProcessingRequestId(requestItem.id);
    try {
      const userResponse = await API.patch(`admin/users/${requestItem.user}/permissions/`, {
        sender_id_type: senderIdType,
        sender_id: requestedSenderId,
        is_sms_enabled: true,
      });

      const updatedUser = userResponse.data;
      setUsers((prev) => prev.map((item) => (item.id === updatedUser.id ? { ...item, ...updatedUser } : item)));

      const requestResponse = await API.patch(`sms/admin/sender-id-requests/${requestItem.id}/`, {
        status: 'completed',
      });
      const updatedRequest = requestResponse.data;
      setSenderIdRequests((prev) => prev.map((item) => (item.id === updatedRequest.id ? updatedRequest : item)));
      setSelectedSenderIdRequest(updatedRequest);

      alert('Sender ID allocated and request marked as Completed.');
    } catch (err) {
      alert(`Failed to approve and assign sender ID: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const rejectSenderIdRequest = async (requestItem) => {
    if (!canManageUsers || !requestItem?.id) {
      return;
    }

    setProcessingRequestId(requestItem.id);
    try {
      const response = await API.patch(`sms/admin/sender-id-requests/${requestItem.id}/`, {
        status: 'rejected',
      });
      const updatedRequest = response.data;
      setSenderIdRequests((prev) => prev.map((item) => (item.id === updatedRequest.id ? updatedRequest : item)));
      setSelectedSenderIdRequest(updatedRequest);
    } catch (err) {
      alert(`Failed to reject request: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const fetchCredentials = async () => {
    if (!canManageUsers) {
      setCredentialLoading(false);
      return;
    }

    try {
      const response = await API.get('sms/credentials/');
      setSmsCredential(response.data);
    } catch (err) {
      console.error('Error fetching credentials:', err);
    } finally {
      setCredentialLoading(false);
    }
  };

  const overview = useMemo(() => {
    const totalUsers = users.length;
    const adminUsers = users.filter((user) => user.is_staff).length;
    const customerUsers = users.filter((user) => !user.is_staff).length;
    const verifiedUsers = users.filter((user) => user.is_active).length;
    const smsEnabledUsers = users.filter((user) => user.is_sms_enabled).length;
    const loggedInUsers = users.filter((user) => Boolean(user.last_login)).length;

    const totalMessages = messages.length;
    const sentMessages = messages.filter((msg) => ['sent', 'delivered'].includes(msg.status)).length;
    const failedMessages = messages.filter((msg) => msg.status === 'failed').length;
    const senderIdRequestsCount = senderIdRequests.length;
    const senderIdCompleted = senderIdRequests.filter((requestItem) => requestItem.status === 'completed').length;
    const senderIdPending = senderIdRequests.filter((requestItem) => requestItem.status === 'progress').length;

    return {
      totalUsers,
      adminUsers,
      customerUsers,
      verifiedUsers,
      smsEnabledUsers,
      loggedInUsers,
      totalMessages,
      sentMessages,
      failedMessages,
      senderIdRequestsCount,
      senderIdCompleted,
      senderIdPending,
    };
  }, [users, messages, senderIdRequests]);

  const searchedMessages = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();
    if (!query) {
      return messages;
    }

    return messages.filter((msg) => {
      const haystack = [
        msg.display_sender_id,
        msg.recipient_username,
        msg.recipient_number,
        msg.message_content,
        msg.status,
        msg.message_id,
        msg.send_mode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [messages, messageSearch]);

  const requestCountryOptions = useMemo(
    () => Array.from(new Set(senderIdRequests.map((requestItem) => String(requestItem.destination_country || '').trim()).filter(Boolean))).sort(),
    [senderIdRequests]
  );

  const filteredSenderIdRequests = useMemo(() => {
    const query = requestSearch.trim().toLowerCase();

    return senderIdRequests.filter((requestItem) => {
      const statusMatch = requestStatusFilter === 'all' || requestItem.status === requestStatusFilter;
      const countryMatch = requestCountryFilter === 'all' || String(requestItem.destination_country || '').toLowerCase() === requestCountryFilter;
      const useCaseMatch = requestUseCaseFilter === 'all' || requestItem.primary_use_case === requestUseCaseFilter;
      const industryMatch = requestIndustryFilter === 'all' || requestItem.industry_sector_type === requestIndustryFilter;

      if (!query) {
        return statusMatch && countryMatch && useCaseMatch && industryMatch;
      }

      const haystack = [
        requestItem.full_name,
        requestItem.email,
        requestItem.contact_number,
        requestItem.required_sender_id,
        requestItem.destination_country,
        requestItem.primary_use_case,
        requestItem.company_name,
        requestItem.industry_sector_type,
        requestItem.company_website,
        requestItem.message_content,
        requestItem.user_email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return statusMatch && countryMatch && useCaseMatch && industryMatch && haystack.includes(query);
    });
  }, [senderIdRequests, requestSearch, requestStatusFilter, requestCountryFilter, requestUseCaseFilter, requestIndustryFilter]);

  const requestStatusOptions = [
    { value: 'progress', label: 'Progress' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
  ];

  const requestUseCaseOptions = [
    { value: 'otp', label: 'OTP' },
    { value: 'two_factor_authentication', label: 'Two-Factor authentication' },
    { value: 'transactional_notifications', label: 'Transactional Notifications' },
    { value: 'critical_alerts', label: 'Critical alerts' },
    { value: 'customer_service', label: 'Customer service' },
    { value: 'marketing_promotions', label: 'Marketing promotions' },
  ];

  const requestIndustryOptions = [
    { value: 'fintech', label: 'Fintech' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'telecom', label: 'Telecom' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'government', label: 'Government' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'travel', label: 'Travel' },
    { value: 'other', label: 'Other' },
  ];

  const updateUserDraft = (userId, field, value) => {
    setUserDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: value,
      },
    }));
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

  const validateSenderIdDraft = (senderIdType, senderIdValue) => {
    const value = String(senderIdValue || '').trim();
    if (!value) {
      return '';
    }

    if (senderIdType === 'numeric') {
      if (!/^\d+$/.test(value)) {
        return 'Numeric sender ID must contain only digits';
      }
      if (value.length < 10 || value.length > 15) {
        return 'Numeric sender ID length must be between 10 and 15 digits';
      }
      return '';
    }

    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return 'Alphanumeric sender ID must use only letters and numbers';
    }
    if (value.length < 3 || value.length > 11) {
      return 'Alphanumeric sender ID length must be between 3 and 11 characters';
    }
    return '';
  };

  const saveSenderId = async (userId) => {
    if (!canManageUsers) {
      return;
    }

    const draft = senderDrafts[userId] || { sender_id_type: 'alphanumeric', sender_id: '' };
    const validationError = validateSenderIdDraft(draft.sender_id_type, draft.sender_id);
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      const response = await API.patch(`admin/users/${userId}/permissions/`, {
        sender_id_type: draft.sender_id_type,
        sender_id: String(draft.sender_id || '').trim(),
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
      alert(`Failed to save sender ID: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
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
      alert(`Failed to update permission: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    }
  };

  const saveUserDetails = async (user) => {
    if (!canManageUsers) {
      return;
    }

    const draft = userDrafts[user.id] || {};
    setSavingUserId(user.id);
    try {
      const response = await API.patch(`admin/users/${user.id}/permissions/`, {
        first_name: draft.first_name,
        last_name: draft.last_name,
        phone_number: draft.phone_number,
        is_active: draft.is_active,
        is_sms_enabled: draft.is_sms_enabled,
      });

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                first_name: response.data.first_name || '',
                last_name: response.data.last_name || '',
                phone_number: response.data.phone_number || '',
                is_active: Boolean(response.data.is_active),
                is_sms_enabled: Boolean(response.data.is_sms_enabled),
              }
            : item
        )
      );

      setUserDrafts((prev) => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          phone_number: response.data.phone_number || '',
          is_active: Boolean(response.data.is_active),
          is_sms_enabled: Boolean(response.data.is_sms_enabled),
        },
      }));
    } catch (err) {
      alert(`Failed to save user details: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const deleteUser = async (user) => {
    if (!canManageUsers) {
      return;
    }

    if (!window.confirm(`Delete user ${user.username}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(user.id);
    try {
      await API.delete(`admin/users/${user.id}/permissions/`);
      setUsers((prevUsers) => prevUsers.filter((item) => item.id !== user.id));
      setUserDrafts((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setSenderDrafts((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setSenderSuggestions((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    } catch (err) {
      alert(`Failed to delete user: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  const grantAdminAccess = async (user) => {
    if (!canManageUsers) {
      return;
    }

    if (!window.confirm(`Grant full admin access to ${user.username}? This enables all admin functionalities.`)) {
      return;
    }

    setGrantingAdminUserId(user.id);
    try {
      const response = await API.patch(`admin/users/${user.id}/permissions/`, {
        is_staff: true,
        is_superuser: true,
        is_active: true,
        is_sms_enabled: true,
      });

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                is_staff: Boolean(response.data.is_staff),
                is_superuser: Boolean(response.data.is_superuser),
                is_active: Boolean(response.data.is_active),
                is_sms_enabled: Boolean(response.data.is_sms_enabled),
              }
            : item
        )
      );

      setUserDrafts((prev) => ({
        ...prev,
        [user.id]: {
          ...(prev[user.id] || {}),
          is_active: true,
          is_sms_enabled: true,
        },
      }));

      alert(`${user.username} now has full admin access.`);
    } catch (err) {
      alert(`Failed to grant admin access: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setGrantingAdminUserId(null);
    }
  };

  const revokeAdminAccess = async (user) => {
    if (!canManageUsers) {
      return;
    }

    if (!window.confirm(`Revoke admin access for ${user.username}? User will become a normal user.`)) {
      return;
    }

    setGrantingAdminUserId(user.id);
    try {
      const response = await API.patch(`admin/users/${user.id}/permissions/`, {
        is_staff: false,
        is_superuser: false,
      });

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                is_staff: Boolean(response.data.is_staff),
                is_superuser: Boolean(response.data.is_superuser),
              }
            : item
        )
      );

      alert(`${user.username} admin access has been revoked.`);
    } catch (err) {
      alert(`Failed to revoke admin access: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setGrantingAdminUserId(null);
    }
  };

  const downloadUserData = async () => {
    try {
      const response = await API.get('admin/users/export/', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      alert(`Error downloading file: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div
        style={{
          padding: '40px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          borderRadius: '8px',
        }}
      >
        <p>{error}</p>
        <Link to="/dashboard" style={{ color: '#2196F3' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-compact-panel dashboard-shell" style={{ padding: '24px' }}>
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

      <h2 style={{ color: '#111827', marginBottom: '20px' }}>
        <FaCog style={{ marginRight: '10px' }} />
        Admin SMS Management
      </h2>

      <div
        style={{
          backgroundColor: '#ede7f6',
          color: '#5e35b1',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaFileAlt />
          <div>
            <div style={{ fontWeight: 'bold' }}>DLT Configuration</div>
            <div style={{ fontSize: '13px' }}>Manage DLT template and sender registration settings.</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/sms/credentials')}
          style={{
            padding: '8px 14px',
            backgroundColor: '#5e35b1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Configure
        </button>
      </div>

      {!hasAdminAccess && (
        <div
          style={{
            backgroundColor: '#fff3e0',
            color: '#E65100',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          You can view DLT Configuration here, but user SMS management is available to admin only.
        </div>
      )}

      {/* Tabs */}
      {hasAdminAccess && <div style={{ marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'overview' ? '#5B3FA8' : 'transparent',
            color: activeTab === 'overview' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: activeTab === 'overview' ? '3px solid #5B3FA8' : 'none',
          }}
        >
          Project Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'users' ? '#3949AB' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: activeTab === 'users' ? '3px solid #3949AB' : 'none',
          }}
        >
          Users & SMS Eligibility
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'messages' ? '#6D4C41' : 'transparent',
            color: activeTab === 'messages' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: activeTab === 'messages' ? '3px solid #6D4C41' : 'none',
          }}
        >
          Message History
        </button>
        <button
          onClick={() => setActiveTab('senderIdRequests')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'senderIdRequests' ? '#00897B' : 'transparent',
            color: activeTab === 'senderIdRequests' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: activeTab === 'senderIdRequests' ? '3px solid #00897B' : 'none',
          }}
        >
          Sender ID Requests
        </button>
      </div>}

      {/* Overview Tab */}
      {hasAdminAccess && activeTab === 'overview' && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Complete Project Snapshot</h3>
          <section className="metrics-section" style={{ marginBottom: '20px' }}>
          <div className="admin-metrics-grid">
            {[
              ['Customers', overview.customerUsers],
              ['All Users', overview.totalUsers],
              ['Admin Users', overview.adminUsers],
              ['Logged-in Users', overview.loggedInUsers],
              ['Verified Users', overview.verifiedUsers],
              ['SMS Enabled Users', overview.smsEnabledUsers],
              ['Total Messages', overview.totalMessages],
              ['Successful Messages', overview.sentMessages],
              ['Failed Messages', overview.failedMessages],
              ['Sender ID Requests', overview.senderIdRequestsCount],
              ['Requests In Progress', overview.senderIdPending],
              ['Requests Completed', overview.senderIdCompleted],
            ].map(([label, value]) => (
              <div
                key={label}
                className="admin-metric-card"
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{value}</div>
              </div>
            ))}
          </div>
          </section>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>SMS Credentials Details</h4>
            {canManageUsers ? (
              credentialLoading ? (
                <p style={{ margin: 0, color: '#666' }}>Loading credentials...</p>
              ) : !smsCredential ? (
                <p style={{ margin: 0, color: '#b71c1c' }}>Credential data unavailable.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div><strong>Provider User:</strong> {smsCredential.user || '-'}</div>
                  <div><strong>Credential Active:</strong> {smsCredential.is_active ? 'Yes' : 'No'}</div>
                  <div><strong>Sender IDs:</strong> {(smsCredential.sender_ids || []).length}</div>
                  <div><strong>Default Trial Sender:</strong> {smsCredential.free_trial_default_sender_id || '-'}</div>
                  <div><strong>Last Updated:</strong> {smsCredential.updated_at ? new Date(smsCredential.updated_at).toLocaleString() : '-'}</div>
                </div>
              )
            ) : (
              <p style={{ margin: 0, color: '#666' }}>SMS credentials are hidden for your account role.</p>
            )}
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>Recharge Charge Settings</h4>
            <p style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '13px' }}>
              These percentages are applied on the user-entered recharge amount.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>Service Charge %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rechargeChargeSettings.service_charge_percentage}
                  onChange={(e) => setRechargeChargeSettings((prev) => ({ ...prev, service_charge_percentage: e.target.value }))}
                  disabled={!canManageUsers || savingRechargeSettings}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>Tax %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rechargeChargeSettings.tax_percentage}
                  onChange={(e) => setRechargeChargeSettings((prev) => ({ ...prev, tax_percentage: e.target.value }))}
                  disabled={!canManageUsers || savingRechargeSettings}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </label>
              <button
                type="button"
                onClick={saveRechargeChargeSettings}
                disabled={!canManageUsers || savingRechargeSettings}
                style={{
                  padding: '9px 14px',
                  backgroundColor: '#5B3FA8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !canManageUsers || savingRechargeSettings ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {savingRechargeSettings ? 'Saving...' : 'Save Charges'}
              </button>
            </div>
            {rechargeSettingsMessage && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: rechargeSettingsMessage.toLowerCase().startsWith('failed') ? '#b91c1c' : '#166534' }}>
                {rechargeSettingsMessage}
              </div>
            )}
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              Razorpay env status: {rechargeChargeSettings.gateway_configured ? 'Configured' : 'Not configured'}
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
              Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env, then restart backend.
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h4 style={{ margin: 0, padding: '14px 16px', borderBottom: '1px solid #eee' }}>Recent Message Activity</h4>
            {messages.length === 0 ? (
              <div style={{ padding: '16px', color: '#666' }}>No message activity yet.</div>
            ) : (
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {messages.slice(0, 10).map((msg) => (
                  <div
                    key={`overview-msg-${msg.id}`}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', color: '#222', marginBottom: '4px' }}>
                        {msg.recipient_username || msg.recipient_number || '-'}
                      </div>
                      <div style={{ color: '#555', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.message_content}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                      <div>{msg.send_mode || 'single'}</div>
                      <div>{new Date(msg.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {hasAdminAccess && activeTab === 'users' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h3>Manage User SMS Eligibility ({users.length} users)</h3>
            <button
              onClick={downloadUserData}
              style={{
                padding: '10px 20px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Download Users Data (Excel)
            </button>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div className="admin-table-scroll">
            <table
              className="admin-compact-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                    User
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                    Name
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                    Email
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                    Phone
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                    Status
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                    SMS Enabled
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                    Sender Type
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                    Sender ID
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: user.is_sms_enabled ? '#e8f5e9' : '#fff',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = user.is_sms_enabled ? '#e8f5e9' : '#fff')
                    }
                  >
                    <td style={{ padding: '15px' }}>
                      <strong>{user.username}</strong>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="First name"
                          value={userDrafts[user.id]?.first_name || ''}
                          onChange={(e) => updateUserDraft(user.id, 'first_name', e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px', width: '120px' }}
                        />
                        <input
                          type="text"
                          placeholder="Last name"
                          value={userDrafts[user.id]?.last_name || ''}
                          onChange={(e) => updateUserDraft(user.id, 'last_name', e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px', width: '120px' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>{user.email}</td>
                    <td style={{ padding: '10px' }}>
                      <input
                        type="text"
                        placeholder="Phone"
                        value={userDrafts[user.id]?.phone_number || ''}
                        onChange={(e) => updateUserDraft(user.id, 'phone_number', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px', width: '130px' }}
                      />
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <select
                        value={userDrafts[user.id]?.is_active ? 'active' : 'inactive'}
                        onChange={(e) => updateUserDraft(user.id, 'is_active', e.target.value === 'active')}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: userDrafts[user.id]?.is_sms_enabled ? '#c8e6c9' : '#ffcccc',
                          color: userDrafts[user.id]?.is_sms_enabled ? '#2e7d32' : '#d32f2f',
                        }}
                      >
                        {userDrafts[user.id]?.is_sms_enabled ? '✓ Enabled' : '✗ Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', textTransform: 'capitalize' }}>
                      {user.sender_id_type || 'alphanumeric'}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {user.sender_id || '-'}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {canManageUsers ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() =>
                              updateUserDraft(user.id, 'is_sms_enabled', !Boolean(userDrafts[user.id]?.is_sms_enabled))
                            }
                            style={{
                              padding: '8px 12px',
                              backgroundColor: userDrafts[user.id]?.is_sms_enabled ? '#f44336' : '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {userDrafts[user.id]?.is_sms_enabled ? (
                              <>
                                <FaToggleOff /> Mark Disabled
                              </>
                            ) : (
                              <>
                                <FaToggleOn /> Mark Enabled
                              </>
                            )}
                          </button>

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <select
                              value={senderDrafts[user.id]?.sender_id_type || 'alphanumeric'}
                              onChange={(e) => updateSenderDraft(user.id, 'sender_id_type', e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px' }}
                            >
                              <option value="numeric">Numeric</option>
                              <option value="alphanumeric">Alphanumeric</option>
                            </select>
                            <input
                              type="text"
                              value={senderDrafts[user.id]?.sender_id || ''}
                              onChange={(e) => updateSenderDraft(user.id, 'sender_id', e.target.value)}
                              placeholder="Sender ID"
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', width: '110px', fontSize: '12px' }}
                            />
                            <button
                              onClick={() => saveSenderId(user.id)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#5e35b1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              Save Sender
                            </button>
                            <button
                              onClick={() => saveUserDetails(user)}
                              disabled={savingUserId === user.id}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#1f7a4c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: savingUserId === user.id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <FaSave /> {savingUserId === user.id ? 'Saving...' : 'Save User'}
                            </button>
                            <button
                              onClick={() => grantAdminAccess(user)}
                              disabled={grantingAdminUserId === user.id || user.is_superuser}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: user.is_superuser ? '#607d8b' : '#6a1b9a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: grantingAdminUserId === user.id || user.is_superuser ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                              title={user.is_superuser ? 'Already full admin' : 'Grant full admin access'}
                            >
                              {grantingAdminUserId === user.id
                                ? 'Granting...'
                                : user.is_superuser
                                ? 'Full Admin'
                                : 'Grant Admin Access'}
                            </button>
                            <button
                              onClick={() => revokeAdminAccess(user)}
                              disabled={grantingAdminUserId === user.id || !user.is_staff}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: !user.is_staff ? '#9e9e9e' : '#455a64',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: grantingAdminUserId === user.id || !user.is_staff ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                              title={!user.is_staff ? 'User is not admin/staff' : 'Revoke admin/staff access'}
                            >
                              Revoke Admin Access
                            </button>
                            <button
                              onClick={() => deleteUser(user)}
                              disabled={deletingUserId === user.id}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#b71c1c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: deletingUserId === user.id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <FaTrash /> {deletingUserId === user.id ? 'Deleting...' : 'Delete User'}
                            </button>
                          </div>

                          {(senderSuggestions[user.id] || []).length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                                    fontSize: '11px',
                                  }}
                                >
                                  {suggestedId}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#6B7280', fontWeight: 600 }}>Limited</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {hasAdminAccess && activeTab === 'messages' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>All SMS Messages ({searchedMessages.length} shown)</h3>
            <input
              type="search"
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              placeholder="Search message, recipient, status, ID..."
              style={{
                minWidth: '280px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            />
          </div>
          {searchedMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              No messages sent yet
            </div>
          ) : (
            <div
              style={{

                backgroundColor: 'white',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div className="admin-table-scroll">
              <table
                className="admin-compact-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      Sender ID
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      Recipient
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      Message
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchedMessages.slice(0, 20).map((msg) => (
                    <tr
                      key={msg.id}
                      style={{
                        borderBottom: '1px solid #eee',
                        backgroundColor:
                          msg.status === 'delivered'
                            ? '#e8f5e9'
                            : msg.status === 'failed'
                            ? '#ffebee'
                            : '#fff',
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <strong>{msg.display_sender_id}</strong>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {msg.recipient_username || msg.recipient_number}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={msg.message_content}
                      >
                        {msg.message_content}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor:
                              msg.status === 'delivered'
                                ? '#c8e6c9'
                                : msg.status === 'failed'
                                ? '#ffcccc'
                                : '#fff3e0',
                            color:
                              msg.status === 'delivered'
                                ? '#2e7d32'
                                : msg.status === 'failed'
                                ? '#d32f2f'
                                : '#f57f17',
                          }}
                        >
                          {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                        {new Date(msg.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {searchedMessages.length > 20 && (
                <div style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                  Showing 20 of {searchedMessages.length} messages
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sender ID Requests Tab */}
      {hasAdminAccess && activeTab === 'senderIdRequests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Sender ID Requests ({filteredSenderIdRequests.length} shown)</h3>
            <input
              type="search"
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              placeholder="Search requester, company, sender ID, message..."
              style={{
                minWidth: '280px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value="all">All statuses</option>
              {requestStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select value={requestCountryFilter} onChange={(e) => setRequestCountryFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value="all">All countries</option>
              {requestCountryOptions.map((country) => (
                <option key={country} value={country.toLowerCase()}>{country}</option>
              ))}
            </select>

            <select value={requestUseCaseFilter} onChange={(e) => setRequestUseCaseFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value="all">All use cases</option>
              {requestUseCaseOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select value={requestIndustryFilter} onChange={(e) => setRequestIndustryFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value="all">All industries</option>
              {requestIndustryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {senderIdRequestsLoading ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '30px' }}>Loading sender ID requests...</div>
          ) : filteredSenderIdRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              No sender ID requests found
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)', gap: '16px', alignItems: 'start' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div className="admin-table-scroll">
                  <table className="admin-compact-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Requester</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Sender ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Company</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Use Case</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSenderIdRequests.map((requestItem) => {
                        const isSelected = selectedSenderIdRequest?.id === requestItem.id;
                        const badgeColor = requestItem.status === 'completed'
                          ? '#c8e6c9'
                          : requestItem.status === 'rejected'
                          ? '#ffcccc'
                          : '#fff3e0';
                        const badgeTextColor = requestItem.status === 'completed'
                          ? '#2e7d32'
                          : requestItem.status === 'rejected'
                          ? '#d32f2f'
                          : '#f57f17';

                        return (
                          <tr
                            key={requestItem.id}
                            onClick={() => setSelectedSenderIdRequest(requestItem)}
                            style={{
                              borderBottom: '1px solid #eee',
                              backgroundColor: isSelected ? '#e0f2f1' : '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 'bold' }}>{requestItem.full_name}</div>
                              <div style={{ color: '#666', fontSize: '12px' }}>{requestItem.email}</div>
                            </td>
                            <td style={{ padding: '12px' }}><strong>{requestItem.required_sender_id}</strong></td>
                            <td style={{ padding: '12px' }}>{requestItem.company_name}</td>
                            <td style={{ padding: '12px' }}>{requestItem.primary_use_case}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: badgeColor,
                                  color: badgeTextColor,
                                }}
                              >
                                {String(requestItem.status_label || requestItem.status || '').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{new Date(requestItem.created_at).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: '16px' }}>
                {selectedSenderIdRequest ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0' }}>{selectedSenderIdRequest.company_name}</h4>
                      <div style={{ color: '#666' }}>{selectedSenderIdRequest.full_name} · {selectedSenderIdRequest.email}</div>
                    </div>

                    <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: '#374151' }}>
                      <div><strong>Contact:</strong> {selectedSenderIdRequest.contact_number}</div>
                      <div><strong>Sender ID:</strong> {selectedSenderIdRequest.required_sender_id}</div>
                      <div><strong>Country:</strong> {selectedSenderIdRequest.destination_country}</div>
                      <div><strong>Use case:</strong> {selectedSenderIdRequest.primary_use_case}</div>
                      <div><strong>Industry:</strong> {selectedSenderIdRequest.industry_sector_type}</div>
                      <div><strong>Website:</strong> <a href={selectedSenderIdRequest.company_website} target="_blank" rel="noreferrer">{selectedSenderIdRequest.company_website}</a></div>
                      <div><strong>User:</strong> {selectedSenderIdRequest.user_email || '-'}</div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Message content</div>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', whiteSpace: 'pre-wrap', color: '#334155' }}>
                        {selectedSenderIdRequest.message_content}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Documentation</div>
                      {selectedSenderIdRequest.company_documentation_url ? (
                        <a href={selectedSenderIdRequest.company_documentation_url} target="_blank" rel="noreferrer">Open uploaded documentation</a>
                      ) : (
                        <span style={{ color: '#666' }}>No uploaded document link available.</span>
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Review status</div>
                      <select
                        value={selectedSenderIdRequest.status}
                        onChange={(e) => updateRequestStatus(selectedSenderIdRequest, e.target.value)}
                        disabled={!canManageUsers || savingRequestStatusId === selectedSenderIdRequest.id || processingRequestId === selectedSenderIdRequest.id}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      >
                        {requestStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      {!canManageUsers && <div style={{ marginTop: '6px', color: '#666', fontSize: '12px' }}>Status editing is read-only for your role.</div>}
                    </div>

                    {canManageUsers && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => approveAndAssignSenderId(selectedSenderIdRequest)}
                          disabled={processingRequestId === selectedSenderIdRequest.id}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#1f7a4c',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: processingRequestId === selectedSenderIdRequest.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {processingRequestId === selectedSenderIdRequest.id ? 'Processing...' : 'Approve + Assign Sender ID'}
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectSenderIdRequest(selectedSenderIdRequest)}
                          disabled={processingRequestId === selectedSenderIdRequest.id}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#b71c1c',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: processingRequestId === selectedSenderIdRequest.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Reject Request
                        </button>
                      </div>
                    )}

                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      Submitted {new Date(selectedSenderIdRequest.created_at).toLocaleString()} · Last updated {new Date(selectedSenderIdRequest.updated_at).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#666' }}>Select a request to inspect its uploaded data and review status.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

