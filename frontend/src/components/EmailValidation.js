import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';
import { FaArrowLeft, FaUpload, FaEnvelopeOpenText, FaListUl, FaKey, FaHistory, FaServer, FaUserShield } from 'react-icons/fa';

const tabButtonStyle = (active) => ({
  border: active ? '1px solid #7C5DC7' : '1px solid #d1d5db',
  background: active ? '#f5f3ff' : '#fff',
  color: active ? '#4c3a92' : '#374151',
  borderRadius: '999px',
  padding: '8px 12px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
});

const endpointCards = [
  {
    title: 'Single Email API Validation',
    path: '/api/auth/email-validation/api/validate/',
    payload: {
      api_key: '<YOUR_API_KEY>',
      user_id: '<YOUR_USER_ID>',
      password: '<YOUR_PASSWORD>',
      email: 'user@example.com',
    },
  },
  {
    title: 'Multiple Email API Validation',
    path: '/api/auth/email-validation/api/validate/',
    payload: {
      api_key: '<YOUR_API_KEY>',
      user_id: '<YOUR_USER_ID>',
      password: '<YOUR_PASSWORD>',
      emails: ['one@example.com', 'two@example.com'],
    },
  },
  {
    title: 'File API Validation',
    path: '/api/auth/email-validation/api/validate/',
    payload: {
      api_key: '<YOUR_API_KEY>',
      user_id: '<YOUR_USER_ID>',
      password: '<YOUR_PASSWORD>',
      source_file: '<multipart-file>',
    },
  },
];

export default function EmailValidation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('validate');
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0');
  const [canViewSupportData, setCanViewSupportData] = useState(false);
  const [canManageValidation, setCanManageValidation] = useState(false);

  const [mode, setMode] = useState('single');
  const [singleEmail, setSingleEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [sourceFile, setSourceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFileName, setLastFileName] = useState('');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ safe_to_send_yes: 0, safe_to_send_no: 0 });

  const [apiKeys, setApiKeys] = useState([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  const [historyItems, setHistoryItems] = useState([]);
  const [historySource, setHistorySource] = useState('all');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryRequestIds, setExpandedHistoryRequestIds] = useState({});

  const [latestByUser, setLatestByUser] = useState([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [selectedUserCreditDraft, setSelectedUserCreditDraft] = useState({ add_message_credits: '', add_email_validation_credits: '' });
  const [adminLoading, setAdminLoading] = useState(false);

  const [creditSetting, setCreditSetting] = useState({ value: '0', description: '' });

  useEffect(() => {
    const initialize = async () => {
      try {
        const [profile, wallet] = await Promise.all([API.get('profile/'), API.get('wallet/')]);
        const adminUser = Boolean(profile.data?.is_staff || profile.data?.is_superuser || profile.data?.is_primary_admin);
        const supportUser = Boolean(profile.data?.can_view_support_data || profile.data?.is_employee);
        const providerBalance = wallet.data?.verifalia_credits;
        const validationBalance = wallet.data?.email_validation_balance;
        setIsAdmin(adminUser);
        setCanViewSupportData(supportUser);
        setCanManageValidation(adminUser);
        setWalletBalance(
          (adminUser || supportUser) && providerBalance !== undefined && providerBalance !== null
            ? String(providerBalance)
            : String(validationBalance ?? '0')
        );
      } catch {
        setIsAdmin(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') || '').trim().toLowerCase();
    if (tab === 'keys') {
      setActiveTab('api-keys');
    } else if (tab === 'history') {
      setActiveTab('history');
    } else if (tab === 'endpoints') {
      setActiveTab('api-docs');
    } else if (tab === 'admin') {
      setActiveTab('admin');
    } else if (tab === 'validate') {
      setActiveTab('validate');
    }
  }, [location.search]);

  const fetchApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const res = await API.get('email-validation/api-keys/');
      setApiKeys(Array.isArray(res.data) ? res.data : []);
    } catch {
      setApiKeys([]);
    } finally {
      setApiKeysLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (historySource !== 'all') {
        params.set('source', historySource);
      }
      if (historyQuery.trim()) {
        params.set('q', historyQuery.trim());
      }
      const sourceQuery = params.toString() ? `?${params.toString()}` : '';
      const res = await API.get(`email-validation/history/${sourceQuery}`);
      setHistoryItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (!canViewSupportData) {
      return;
    }

    setAdminLoading(true);
    try {
      const [latestRes, creditRes, usersRes] = await Promise.all([
        API.get('admin/email-validation/history/latest/'),
        API.get('admin/email-validation/credit-settings/'),
        API.get('admin/users/'),
      ]);
      setLatestByUser(Array.isArray(latestRes.data) ? latestRes.data : []);
      setCreditSetting({
        value: String(creditRes.data?.value ?? '0'),
        description: String(creditRes.data?.description ?? ''),
      });
      setAdminUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLatestByUser([]);
      setAdminUsers([]);
      setError(`Admin data load failed: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchApiKeys();
    }
    if (activeTab === 'history') {
      fetchHistory();
    }
    if (activeTab === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, canViewSupportData]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [historySource, historyQuery]);

  const runValidation = async (event) => {
    event.preventDefault();
    setError('');
    setResults([]);
    setSummary({ safe_to_send_yes: 0, safe_to_send_no: 0 });
    setLastFileName('');

    if (mode === 'single' && !singleEmail.trim()) {
      setError('Please enter an email address.');
      return;
    }
    if (mode === 'bulk' && !bulkEmails.trim()) {
      setError('Please enter bulk emails.');
      return;
    }
    if (mode === 'file' && !sourceFile) {
      setError('Please upload a file to validate.');
      return;
    }

    if (Number(walletBalance || 0) <= 0) {
      setError(isAdmin ? 'Provider credits are exhausted.' : 'No email validation credits available.');
      return;
    }

    setLoading(true);
    try {
      let response;

      if (mode === 'file') {
        const formData = new FormData();
        formData.append('source_file', sourceFile);
        response = await API.post('email-validation/validate/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload = {};
        if (mode === 'single') {
          payload.email = singleEmail.trim();
        } else if (mode === 'bulk') {
          payload.emails = bulkEmails.trim();
        }
        response = await API.post('email-validation/validate/', payload);
      }

      setResults(Array.isArray(response.data?.results) ? response.data.results : []);
      setSummary({
        safe_to_send_yes: Number(response.data?.summary?.safe_to_send_yes || 0),
        safe_to_send_no: Number(response.data?.summary?.safe_to_send_no || 0),
      });
      setLastFileName(response.data?.source_file_name || '');
      if (isAdmin) {
        const refreshedWallet = await API.get('wallet/');
        setWalletBalance(String(refreshedWallet.data?.email_validation_balance ?? walletBalance));
      } else {
        setWalletBalance(String(response.data?.wallet_balance ?? walletBalance));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Email validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSourceFile(null);
    if (!file) {
      return;
    }

    const fileName = String(file.name || '').toLowerCase();
    const allowed = ['.xlsv', '.csv', '.txt', '.xls', '.xlsx'];
    if (!allowed.some((ext) => fileName.endsWith(ext))) {
      setError('Unsupported file type. Allowed: .xlsv, .csv, .txt, .xls, .xlsx');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum allowed size is 10MB.');
      return;
    }

    setError('');
    setSourceFile(file);
  };

  const createApiKey = async () => {
    if (!canManageValidation) {
      setError('Read-only support mode. API key changes are disabled.');
      return;
    }

    if (!newApiKeyName.trim()) {
      setError('Enter a name for API key');
      return;
    }
    setError('');
    try {
      await API.post('email-validation/api-keys/', { name: newApiKeyName.trim() });
      setNewApiKeyName('');
      fetchApiKeys();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create API key');
    }
  };

  const toggleApiKeyStatus = async (item) => {
    if (!canManageValidation) {
      setError('Read-only support mode. API key changes are disabled.');
      return;
    }

    try {
      await API.patch(`email-validation/api-keys/${item.id}/`, { is_active: !item.is_active });
      fetchApiKeys();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update API key');
    }
  };

  const deleteApiKey = async (item) => {
    if (!canManageValidation) {
      setError('Read-only support mode. API key changes are disabled.');
      return;
    }

    try {
      await API.delete(`email-validation/api-keys/${item.id}/`);
      fetchApiKeys();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete API key');
    }
  };

  const loadUserHistory = async (userId) => {
    setSelectedAdminUser(userId);
    const selected = adminUsers.find((row) => Number(row.id) === Number(userId)) || null;
    setSelectedUserDetails(selected);
    setSelectedUserCreditDraft({ add_message_credits: '', add_email_validation_credits: '' });
    setAdminLoading(true);
    try {
      const res = await API.get(`admin/email-validation/history/users/${userId}/`);
      setSelectedUserHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSelectedUserHistory([]);
    } finally {
      setAdminLoading(false);
    }
  };

  const saveSelectedUserCredits = async () => {
    if (!isAdmin || !selectedUserDetails) {
      return;
    }

    const addMessage = Number(selectedUserCreditDraft.add_message_credits || 0);
    const addEmail = Number(selectedUserCreditDraft.add_email_validation_credits || 0);
    if (!Number.isFinite(addMessage) || !Number.isFinite(addEmail)) {
      setError('Enter valid credit values.');
      return;
    }

    try {
      await API.patch(`admin/users/${selectedUserDetails.id}/wallet/credits/`, {
        add_message_credits: String(addMessage),
        add_email_validation_credits: String(addEmail),
      });

      await fetchAdminData();
      setSelectedUserCreditDraft({ add_message_credits: '', add_email_validation_credits: '' });
      await loadUserHistory(selectedUserDetails.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update user credits.');
    }
  };

  const saveCreditSetting = async () => {
    if (!canManageValidation) {
      setError('Read-only support mode. Credit settings are disabled.');
      return;
    }

    try {
      await API.patch('admin/email-validation/credit-settings/', {
        value: creditSetting.value,
        description: creditSetting.description,
      });
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save credit setting');
    }
  };

  const safeUnsafeRatio = useMemo(() => {
    const total = summary.safe_to_send_yes + summary.safe_to_send_no;
    if (!total) {
      return { safePct: 0, unsafePct: 0 };
    }
    return {
      safePct: Math.round((summary.safe_to_send_yes / total) * 100),
      unsafePct: Math.round((summary.safe_to_send_no / total) * 100),
    };
  }, [summary]);

  const formatLiveResult = (row) => {
    if (row?.summary) {
      return row.summary;
    }

    return [
      '#### Validation summary',
      `Input data:**${row?.email || '-'}**`,
      '',
      `Classification:${row?.classification || 'Unknown'}`,
      '',
      '---',
      `Status:${row?.status || 'Validation completed.'}`,
      '',
      `Status code:${row?.statusCode || 'Success'}`,
    ].join('\n');
  };

  const toggleHistoryFullResult = (requestKey) => {
    setExpandedHistoryRequestIds((prev) => ({
      ...prev,
      [requestKey]: !prev[requestKey],
    }));
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1240px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
          backgroundColor: '#eef2ff',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#1e3a8a',
          fontWeight: 600,
        }}
      >
        <FaArrowLeft /> Back to Dashboard
      </button>

      <h2 style={{ color: '#111827', marginBottom: '4px' }}>Email Validation Platform</h2>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '16px' }}>
        Dashboard + API validation, key management, source history, and admin credits.
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button onClick={() => setActiveTab('validate')} style={tabButtonStyle(activeTab === 'validate')}>
          <FaEnvelopeOpenText /> Validate
        </button>
        <button onClick={() => setActiveTab('api-keys')} style={tabButtonStyle(activeTab === 'api-keys')}>
          <FaKey /> API Keys
        </button>
        <button onClick={() => setActiveTab('history')} style={tabButtonStyle(activeTab === 'history')}>
          <FaHistory /> History
        </button>
        <button onClick={() => setActiveTab('api-docs')} style={tabButtonStyle(activeTab === 'api-docs')}>
          <FaServer /> API Endpoints
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('admin')} style={tabButtonStyle(activeTab === 'admin')}>
            <FaUserShield /> Admin Center
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>{isAdmin ? 'Provider Wallet Balance' : 'Email Validation Wallet Balance'}</div>
          <div style={{ color: '#111827', fontSize: '24px', fontWeight: 800 }}>{walletBalance}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>Safe to Send</div>
          <div style={{ color: '#166534', fontSize: '24px', fontWeight: 800 }}>{summary.safe_to_send_yes}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>Unsafe</div>
          <div style={{ color: '#991b1b', fontSize: '24px', fontWeight: 800 }}>{summary.safe_to_send_no}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>Safe/Unsafe Ratio</div>
          <div style={{ color: '#1f2937', fontSize: '18px', fontWeight: 800 }}>{safeUnsafeRatio.safePct}% / {safeUnsafeRatio.unsafePct}%</div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {activeTab === 'validate' && (
        <>
          <form onSubmit={runValidation} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[{ key: 'single', label: 'Single Email', icon: <FaEnvelopeOpenText /> }, { key: 'bulk', label: 'Bulk Emails', icon: <FaListUl /> }, { key: 'file', label: 'Upload File', icon: <FaUpload /> }].map((item) => (
                <label key={item.key} style={{ border: '1px solid #d1d5db', background: mode === item.key ? '#eef2ff' : '#fff', color: mode === item.key ? '#1e3a8a' : '#374151', borderRadius: '999px', padding: '8px 12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="email_mode" value={item.key} checked={mode === item.key} onChange={() => setMode(item.key)} style={{ display: 'none' }} />
                  {item.icon} {item.label}
                </label>
              ))}
            </div>

            {mode === 'single' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Single Email</label>
                <input type="email" value={singleEmail} onChange={(e) => setSingleEmail(e.target.value)} placeholder="user@example.com" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              </div>
            )}

            {mode === 'bulk' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Bulk Emails</label>
                <textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  placeholder="one email per line, comma, or semicolon"
                  rows={5}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
                />
              </div>
            )}

            {mode === 'file' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Upload File (.xlsv, .csv, .txt, .xls, .xlsx)</label>
                <input type="file" onChange={handleFileChange} accept=".xlsv,.csv,.txt,.xls,.xlsx" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                <small style={{ color: '#6b7280' }}>{sourceFile ? `Selected: ${sourceFile.name}` : 'Maximum file size: 10MB'}</small>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '14px', padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Validating...' : 'Validate Emails'}
            </button>
          </form>

          {lastFileName && (
            <div style={{ marginBottom: '10px', color: '#475569', fontSize: '13px' }}>
              Source file: <strong>{lastFileName}</strong>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '12px 14px', fontWeight: 800, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                Validation Results
              </div>
              <div style={{ padding: '12px 14px', background: '#fcfcff', display: 'grid', gap: '10px' }}>
                {results.map((row, idx) => (
                  <div key={`summary-${row.email || idx}-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', padding: '10px' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px', color: '#374151', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                      {formatLiveResult(row)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'api-keys' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Manage API Keys</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="Key name"
                style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
              <button onClick={createApiKey} style={{ padding: '10px 12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Create
              </button>
            </div>

            {apiKeysLoading ? (
              <div>Loading API keys...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {apiKeys.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.key}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => toggleApiKeyStatus(item)} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                          {item.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => deleteApiKey(item)} style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#9f1239', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && <div style={{ color: '#6b7280' }}>No API keys yet.</div>}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>API Auth Requirements</h3>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#374151', lineHeight: 1.7 }}>
              <li>Send `api_key`, `user_id`, and `password` in request body or `X-API-Key` header.</li>
              <li>Use endpoint: `/api/auth/email-validation/api/validate/`</li>
              <li>Supports `email`, `emails`, or `source_file` (multipart).</li>
              <li>Returns simplified yes/no fields and detailed provider output.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Validation History by Source</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'dashboard', 'api'].map((item) => (
                <button key={item} onClick={() => setHistorySource(item)} style={tabButtonStyle(historySource === item)}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <input
              type="search"
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search by request ID, user ID, email, or file name..."
              style={{ width: '100%', maxWidth: '460px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
          </div>

          {historyLoading ? (
            <div>Loading history...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyItems.map((item) => {
                const requestKey = item.request_id || String(item.id);
                const firstResult = Array.isArray(item.results_summary?.results) && item.results_summary.results.length > 0
                  ? item.results_summary.results[0]
                  : null;
                const primaryEmail = firstResult?.email
                  || (Array.isArray(item.emails_requested) && item.emails_requested.length > 0 ? item.emails_requested[0] : '-')
                  || '-';
                const primaryStatus = firstResult?.status || firstResult?.classification || 'Validation completed';
                const isExpanded = Boolean(expandedHistoryRequestIds[requestKey]);

                return (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'grid', gap: '3px' }}>
                        <div style={{ fontWeight: 800 }}>Request ID: {requestKey}</div>
                        <div style={{ fontSize: '12px', color: '#1f2937' }}>Unique ID: {item.id}</div>
                        <div style={{ fontSize: '12px', color: '#1f2937' }}>Mail: {primaryEmail}</div>
                        <div style={{ fontSize: '12px', color: '#1f2937' }}>Status: {primaryStatus}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleHistoryFullResult(requestKey)}
                        style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700, color: '#1e3a8a' }}
                      >
                        {isExpanded ? 'Hide Full Result' : 'Full Result'}
                      </button>
                    </div>

                    {isExpanded && Array.isArray(item.results_summary?.results) && item.results_summary.results.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                        {item.results_summary.results.map((row, idx) => (
                          <div key={`${item.id}-history-result-${idx}`} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#f8fafc' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '11px', color: '#334155', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                              {formatLiveResult(row)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {historyItems.length === 0 && <div style={{ color: '#6b7280' }}>No history records found.</div>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'api-docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          {endpointCards.map((item) => (
            <div key={item.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}><strong>POST</strong> {item.path}</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'admin' && isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Credit Cost Settings</h3>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Credits per email validation</label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={creditSetting.value}
              onChange={(e) => setCreditSetting((prev) => ({ ...prev, value: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px' }}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Description</label>
            <input
              type="text"
              value={creditSetting.description}
              onChange={(e) => setCreditSetting((prev) => ({ ...prev, description: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px' }}
            />
            <button onClick={saveCreditSetting} style={{ padding: '10px 12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              Save Credit Setting
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Users</h3>
            {adminLoading ? (
              <div>Loading admin analytics...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {adminUsers.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.email}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          User ID: {item.id} Â· {item.email_validation_count || 0} requests
                        </div>
                      </div>
                      <button onClick={() => loadUserHistory(item.id)} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                {adminUsers.length === 0 && <div style={{ color: '#6b7280' }}>No users found.</div>}
              </div>
            )}
          </div>

          <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Selected User Details</h3>
            {selectedUserDetails && (
              <div style={{ marginBottom: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                <div style={{ fontSize: '13px', color: '#1f2937' }}><strong>User ID:</strong> {selectedUserDetails.id}</div>
                <div style={{ fontSize: '13px', color: '#1f2937' }}><strong>Email:</strong> {selectedUserDetails.email}</div>
                <div style={{ fontSize: '13px', color: '#1f2937' }}><strong>Messaging Credits:</strong> {selectedUserDetails.wallet_balance || '0'}</div>
                <div style={{ fontSize: '13px', color: '#1f2937' }}><strong>Email Credits:</strong> {selectedUserDetails.email_validation_balance || '0'}</div>
                <div style={{ fontSize: '13px', color: '#1f2937' }}><strong>API Keys:</strong> {selectedUserDetails.api_key_count || 0}</div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedUserCreditDraft.add_message_credits}
                    onChange={(e) => setSelectedUserCreditDraft((prev) => ({ ...prev, add_message_credits: e.target.value }))}
                    placeholder="+ Messaging"
                    style={{ width: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedUserCreditDraft.add_email_validation_credits}
                    onChange={(e) => setSelectedUserCreditDraft((prev) => ({ ...prev, add_email_validation_credits: e.target.value }))}
                    placeholder="+ Email"
                    style={{ width: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                  <button
                    onClick={saveSelectedUserCredits}
                    style={{ padding: '8px 10px', border: 'none', borderRadius: '6px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add Credits
                  </button>
                </div>
              </div>
            )}

            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Selected User History</h3>
            {selectedUserHistory.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Select a user from latest list.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedUserHistory.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontWeight: 700 }}>#{item.id} Â· User ID: {item.user} Â· {item.source}</div>
                    {item.provider_message_id && (
                      <div style={{ fontSize: '12px', color: '#1f2937' }}>Provider Message ID: {item.provider_message_id}</div>
                    )}
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.email_count} emails Â· Cost {item.cost_deducted} Â· {new Date(item.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}









