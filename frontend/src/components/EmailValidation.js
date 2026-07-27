import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';
import { getProfessionalErrorMessage } from '../errorHelpers';
import { FaArrowLeft, FaUpload, FaEnvelopeOpenText, FaListUl, FaKey, FaServer, FaUserShield } from 'react-icons/fa';

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
  {
    title: 'Check Validation Status (API)',
    path: '/api/auth/email-validation/api/status/',
    payload: {
      api_key: '<YOUR_API_KEY>',
      user_id: '<YOUR_USER_ID>',
      password: '<YOUR_PASSWORD>',
      request_id: '<REQUEST_ID>',
    },
  },
  {
    title: 'Control Validation Task (API)',
    path: '/api/auth/email-validation/api/control/',
    payload: {
      api_key: '<YOUR_API_KEY>',
      user_id: '<YOUR_USER_ID>',
      password: '<YOUR_PASSWORD>',
      request_id: '<REQUEST_ID>',
      action: 'pause',
    },
  },
];

export default function EmailValidation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('validate');
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0');
  const [providerEmailBalance, setProviderEmailBalance] = useState('');
  const [providerMessageBalance, setProviderMessageBalance] = useState('');
  const [canViewSupportData, setCanViewSupportData] = useState(false);
  const [canManageValidation, setCanManageValidation] = useState(false);

  const [mode, setMode] = useState('single');
  const [singleEmail, setSingleEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [sourceFile, setSourceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [lastFileName, setLastFileName] = useState('');
  const [latestRequestId, setLatestRequestId] = useState('');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ safe_to_send_yes: 0, safe_to_send_no: 0 });
  const [deliverableEmailsText, setDeliverableEmailsText] = useState('');
  const [showComposePanel, setShowComposePanel] = useState(false);
  const [sendingDeliverableEmails, setSendingDeliverableEmails] = useState(false);
  const [sendSummary, setSendSummary] = useState(null);
  const [mailDraft, setMailDraft] = useState({ subject: '', body: '' });
  const [smtpDraft, setSmtpDraft] = useState({
    provider: '',
    host: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    useTls: true,
    useSsl: false,
  });
  const progressIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const [activeRequestMeta, setActiveRequestMeta] = useState(null);
  const [progressTimeline, setProgressTimeline] = useState([]);
  const [keepInBackground, setKeepInBackground] = useState(false);

  const [apiKeys, setApiKeys] = useState([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  const [latestByUser, setLatestByUser] = useState([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [selectedUserCreditDraft, setSelectedUserCreditDraft] = useState({ add_message_credits: '', add_email_validation_credits: '' });
  const [adminLoading, setAdminLoading] = useState(false);

  const [creditSetting, setCreditSetting] = useState({
    value: '0',
    description: '',
    provider_mode: 'own_system',
  });
  const [validationProviderMode, setValidationProviderMode] = useState('own_system');

  useEffect(() => {
    const initialize = async () => {
      try {
        const [profile, wallet] = await Promise.all([API.get('profile/'), API.get('wallet/')]);
        const adminUser = Boolean(profile.data?.is_staff || profile.data?.is_superuser || profile.data?.is_primary_admin);
        const supportUser = Boolean(profile.data?.can_view_support_data || profile.data?.is_employee);
        const currentProviderEmailBalance = wallet.data?.provider_email_balance;
        const currentProviderMessageBalance = wallet.data?.provider_message_balance;
        const validationBalance = wallet.data?.balance;
        const providerMode = String(wallet.data?.email_validation_provider_mode || 'own_system').toLowerCase();
        setIsAdmin(adminUser);
        setCanViewSupportData(supportUser);
        setCanManageValidation(true);
        setValidationProviderMode(providerMode);
        setWalletBalance(String(validationBalance ?? '0'));
        setProviderEmailBalance(currentProviderEmailBalance !== undefined && currentProviderEmailBalance !== null ? String(currentProviderEmailBalance) : '');
        setProviderMessageBalance(currentProviderMessageBalance !== undefined && currentProviderMessageBalance !== null ? String(currentProviderMessageBalance) : '');
      } catch {
        setIsAdmin(false);
      }
    };

    initialize();
  }, []);

  const refreshWalletBalance = async (preferResponseBalance) => {
    if (!isAdmin && preferResponseBalance !== undefined && preferResponseBalance !== null) {
      setWalletBalance(String(preferResponseBalance));
      return;
    }

    try {
      const refreshedWallet = await API.get('wallet/');
      const currentProviderEmailBalance = refreshedWallet.data?.provider_email_balance;
      const currentProviderMessageBalance = refreshedWallet.data?.provider_message_balance;
      const validationBalance = refreshedWallet.data?.balance;
      const providerMode = String(refreshedWallet.data?.email_validation_provider_mode || validationProviderMode || 'own_system').toLowerCase();
      setWalletBalance(String(validationBalance ?? preferResponseBalance ?? walletBalance));
      setValidationProviderMode(providerMode);
      setProviderEmailBalance(currentProviderEmailBalance !== undefined && currentProviderEmailBalance !== null ? String(currentProviderEmailBalance) : providerEmailBalance);
      setProviderMessageBalance(currentProviderMessageBalance !== undefined && currentProviderMessageBalance !== null ? String(currentProviderMessageBalance) : providerMessageBalance);
    } catch {
      if (preferResponseBalance !== undefined && preferResponseBalance !== null) {
        setWalletBalance(String(preferResponseBalance));
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') || '').trim().toLowerCase();
    if (tab === 'keys') {
      setActiveTab('api-keys');
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
        provider_mode: String(creditRes.data?.provider_mode ?? 'own_system'),
      });
      setAdminUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLatestByUser([]);
      setAdminUsers([]);
      setError(`Admin data load failed: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchApiKeys();
    }
    if (activeTab === 'admin') {
      fetchAdminData();
      if (isAdmin) {
        fetchApiKeys();
      }
    }
  }, [activeTab, canViewSupportData, isAdmin]);

  useEffect(() => {
    if (!loading) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    if (progressStage !== 'validating') {
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      setProgressPercent((prev) => Math.min(prev + 1, 97));
    }, 1200);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [loading, progressStage]);

  const applyValidationPayload = (data = {}) => {
    const history = data?.history || {};
    const historySummary = history?.results_summary || {};
    const historyResults = Array.isArray(historySummary?.results) ? historySummary.results : [];
    const responseResults = Array.isArray(data?.results) ? data.results : [];
    const effectiveResults = responseResults.length > 0 ? responseResults : historyResults;

    const responseSummary = data?.summary || {};
    const safeCount = Number(
      responseSummary?.safe_to_send_yes ?? historySummary?.safe_count ?? 0
    );
    const unsafeCount = Number(
      responseSummary?.safe_to_send_no ?? historySummary?.unsafe_count ?? 0
    );

    setResults(effectiveResults);
    setSummary({ safe_to_send_yes: safeCount, safe_to_send_no: unsafeCount });
    setLastFileName(data?.source_file_name || history?.file_name || '');
    setLatestRequestId(data?.request_id || history?.request_id || '');
    const modeFromPayload = String(
      data?.provider_mode
      || historySummary?.provider_mode
      || validationProviderMode
      || 'own_system'
    ).toLowerCase();
    setValidationProviderMode(modeFromPayload);
  };

  const hydrateFromHistoryRow = (current = {}) => {
    const rs = current?.results_summary || {};
    const progressPercent = Number(rs?.progress_percent || 0);
    const processedCount = Number(rs?.processed_count || 0);
    const totalCount = Number(rs?.total_count || current?.email_count || 0);
    const elapsedSeconds = Number(rs?.elapsed_seconds || 0);
    const etaSeconds = Number(rs?.eta_seconds || 0);
    const processingState = String(current?.processing_state || rs?.processing_state || current?.status || 'pending').toLowerCase();

    setActiveRequestMeta({
      requestId: current?.request_id || '',
      status: String(current?.status || 'pending').toLowerCase(),
      processingState,
      progressPercent,
      processedCount,
      totalCount,
      elapsedSeconds,
      etaSeconds,
      workerActive: Boolean(current?.worker_active),
      fileName: current?.file_name || '',
    });

    setProgressPercent(progressPercent);
    setStatusMessage(`Validation ${processingState} - ${progressPercent}%`);
    setProgressStage('validating');
    setProgressTimeline((prev) => {
      const next = [...prev, { at: Date.now(), value: progressPercent }];
      return next.slice(-24);
    });

    const stateDone = ['completed', 'failed', 'cancelled', 'stopped'].includes(processingState);
    if (stateDone || String(current?.status || '').toLowerCase() === 'completed' || String(current?.status || '').toLowerCase() === 'failed') {
      applyValidationPayload({
        request_id: current?.request_id,
        source_file_name: current?.file_name,
        history: current,
        results: Array.isArray(rs?.results) ? rs.results : [],
        summary: {
          safe_to_send_yes: Number(rs?.safe_count || 0),
          safe_to_send_no: Number(rs?.unsafe_count || 0),
        },
      });
      if (stateDone) {
        setLoading(false);
        localStorage.removeItem('emailValidationActiveRequestId');
      }
    }

    return stateDone;
  };

  const loadRequestStatus = async (requestId) => {
    if (!requestId) {
      return false;
    }

    const response = await API.get(`email-validation/history/${requestId}/status/`, { timeout: 60000 });
    return hydrateFromHistoryRow(response.data || {});
  };

  const runRequestAction = async (action) => {
    const requestId = activeRequestMeta?.requestId || latestRequestId;
    if (!requestId) {
      setError('No active request found.');
      return;
    }

    try {
      setError('');
      const response = await API.patch(`email-validation/history/${requestId}/control/`, { action });
      const done = hydrateFromHistoryRow(response.data || {});
      if (!done) {
        setLoading(true);
      }
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not apply request action.'));
    }
  };

  const recoverValidationFromHistory = async ({ startedAtMs, expectedFileName }) => {
    const response = await API.get('email-validation/history/', {
      params: { source: 'dashboard' },
      timeout: 60000,
    });

    const rows = Array.isArray(response.data) ? response.data : [];
    if (rows.length === 0) {
      return false;
    }

    const lowerFileName = String(expectedFileName || '').trim().toLowerCase();
    const graceStart = Number(startedAtMs || Date.now()) - 120000;

    const candidates = rows.filter((item) => {
      const createdAt = new Date(item?.created_at || 0).getTime();
      return Number.isFinite(createdAt) && createdAt >= graceStart;
    });

    const preferredByFile = lowerFileName
      ? candidates.find((item) => String(item?.file_name || '').trim().toLowerCase() === lowerFileName)
      : null;

    const chosen = preferredByFile || candidates[0] || rows[0];
    const historyResults = Array.isArray(chosen?.results_summary?.results) ? chosen.results_summary.results : [];
    if (!chosen || historyResults.length === 0) {
      return false;
    }

    applyValidationPayload({
      request_id: chosen.request_id,
      source_file_name: chosen.file_name,
      history: chosen,
      summary: {
        safe_to_send_yes: Number(chosen?.results_summary?.safe_count || 0),
        safe_to_send_no: Number(chosen?.results_summary?.unsafe_count || 0),
      },
      results: historyResults,
    });

    return true;
  };

  const waitForValidationHistoryCompletion = async (requestId) => {
    if (!requestId) {
      return false;
    }

    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await API.get('email-validation/history/', {
        params: { q: requestId },
        timeout: 60000,
      });

      const rows = Array.isArray(response.data) ? response.data : [];
      const current = rows.find((item) => String(item?.request_id || '') === String(requestId)) || rows[0];
      if (current && String(current?.status || '').toLowerCase() === 'completed') {
        applyValidationPayload({
          request_id: current.request_id,
          source_file_name: current.file_name,
          history: current,
          results: Array.isArray(current?.results_summary?.results) ? current.results_summary.results : [],
          summary: {
            safe_to_send_yes: Number(current?.results_summary?.safe_count || 0),
            safe_to_send_no: Number(current?.results_summary?.unsafe_count || 0),
          },
        });
        return true;
      }

      if (current && String(current?.status || '').toLowerCase() === 'failed') {
        setError(String(current?.results_summary?.error || 'Email validation failed.'));
        setStatusMessage('Validation failed.');
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return false;
  };

  useEffect(() => {
    if (!activeRequestMeta?.requestId || keepInBackground) {
      return undefined;
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const done = await loadRequestStatus(activeRequestMeta.requestId);
        if (done && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          localStorage.removeItem('emailValidationActiveRequestId');
        }
      } catch {
        // Keep polling silently; network hiccups should not stop UI tracking.
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeRequestMeta?.requestId, keepInBackground]);

  useEffect(() => {
    const persistedRequestId = localStorage.getItem('emailValidationActiveRequestId');
    if (!persistedRequestId) {
      return;
    }

    loadRequestStatus(persistedRequestId).catch(() => {
      localStorage.removeItem('emailValidationActiveRequestId');
    });
  }, []);

  const runValidation = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setResults([]);
    setSummary({ safe_to_send_yes: 0, safe_to_send_no: 0 });
    setDeliverableEmailsText('');
    setShowComposePanel(false);
    setSendSummary(null);
    setLastFileName('');
    setLatestRequestId('');
    setActiveRequestMeta(null);
    setProgressTimeline([]);
    setKeepInBackground(false);
    setProgressPercent(0);
    setProgressStage(mode === 'file' ? 'uploading' : 'validating');
    setStatusMessage(mode === 'file' ? 'Uploading file...' : 'Preparing validation request...');

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
      setError('No wallet credits available.');
      return;
    }

    setLoading(true);
    const startedAtMs = Date.now();
    try {
      let response;

      if (mode === 'file') {
        const formData = new FormData();
        formData.append('source_file', sourceFile);
        response = await API.post('email-validation/validate/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 900000,
          onUploadProgress: (progressEvent) => {
            const loaded = Number(progressEvent?.loaded || 0);
            const total = Number(progressEvent?.total || 0);
            if (total > 0) {
              const percent = Math.min(100, Math.round((loaded / total) * 100));
              if (percent < 100) {
                setProgressStage('uploading');
                setStatusMessage(`Uploading file... ${percent}%`);
                setProgressPercent(Math.min(percent, 92));
              } else {
                setProgressStage('validating');
                setStatusMessage('Upload complete. Validating emails...');
                setProgressPercent((prev) => Math.max(prev, 93));
              }
            } else {
              setProgressStage('uploading');
              setStatusMessage('Uploading file...');
              setProgressPercent((prev) => Math.max(prev, 20));
            }
          },
        });
      } else {
        const payload = {};
        if (mode === 'single') {
          payload.email = singleEmail.trim();
        } else if (mode === 'bulk') {
          payload.emails = bulkEmails.trim();
        }
        setProgressStage('validating');
        setStatusMessage('Validating emails...');
        setProgressPercent(15);
        response = await API.post('email-validation/validate/', payload, { timeout: 900000 });
      }

      const isQueuedFileValidation = mode === 'file' && String(response?.status || '').toLowerCase() === '202';
      const pendingRequestId = response.data?.request_id || response.data?.history?.request_id || '';

      if (isQueuedFileValidation || String(response.data?.status || '').toLowerCase() === 'pending') {
        setStatusMessage('File accepted. Validation is running in the background...');
        setProgressStage('validating');
        setProgressPercent(35);
        setLatestRequestId(pendingRequestId);
        localStorage.setItem('emailValidationActiveRequestId', String(pendingRequestId));
        await loadRequestStatus(pendingRequestId);
        await refreshWalletBalance(response.data?.wallet_balance);
        return;
      }

      applyValidationPayload(response.data || {});
      setProgressPercent(100);
      setStatusMessage('Validation completed successfully.');

      await refreshWalletBalance(response.data?.wallet_balance);
    } catch (err) {
      const detail = getProfessionalErrorMessage(err, 'Email validation failed.');
      const code = String(err.code || '').toUpperCase();
      const message = String(err.message || '').toLowerCase();
      const isTimeoutOrNetwork = code === 'ECONNABORTED' || message.includes('timeout') || message.includes('network');

      if (isTimeoutOrNetwork) {
        try {
          const recovered = await recoverValidationFromHistory({
            startedAtMs,
            expectedFileName: mode === 'file' ? sourceFile?.name : '',
          });
          if (recovered) {
            setInfo('Validation completed on server and results were recovered from history.');
            setError('');
            setProgressPercent(100);
            setStatusMessage('Validation completed successfully.');
            return;
          }
        } catch {
          // Fall back to regular error handling below.
        }
      }

      setError(detail);
      setStatusMessage('Validation failed.');
    } finally {
      setLoading(false);
      setProgressStage('idle');
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

    if (file.size > 25 * 1024 * 1024) {
      setError('File too large. Maximum allowed size is 25MB.');
      return;
    }

    setError('');
    setSourceFile(file);
  };

  const createApiKey = async () => {
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
      setError(getProfessionalErrorMessage(err, 'Could not create API key'));
    }
  };

  const toggleApiKeyStatus = async (item) => {
    try {
      await API.patch(`email-validation/api-keys/${item.id}/`, { is_active: !item.is_active });
      fetchApiKeys();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not update API key'));
    }
  };

  const deleteApiKey = async (item) => {
    try {
      await API.delete(`email-validation/api-keys/${item.id}/`);
      fetchApiKeys();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not delete API key'));
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
      const response = await API.patch(`admin/users/${selectedUserDetails.id}/wallet/credits/`, {
        add_message_credits: String(addMessage),
        add_email_validation_credits: String(addEmail),
      });

      setSelectedUserDetails((prev) => (prev ? {
        ...prev,
        wallet_balance: response.data?.message_credits ?? prev.wallet_balance,
        email_validation_balance: response.data?.email_validation_credits ?? prev.email_validation_balance,
      } : prev));

      await fetchAdminData();
      setSelectedUserCreditDraft({ add_message_credits: '', add_email_validation_credits: '' });
      await loadUserHistory(selectedUserDetails.id);
      setError('');
      setInfo(`Credits updated. Unified wallet: ${response.data?.message_credits || response.data?.email_validation_credits || '0'}`);
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not update user credits.'));
    }
  };

  const saveCreditSetting = async () => {
    if (!canManageValidation) {
      setError('Only admin users can update credit settings.');
      return;
    }

    try {
      await API.patch('admin/email-validation/credit-settings/', {
        value: creditSetting.value,
        description: creditSetting.description,
        provider_mode: creditSetting.provider_mode,
      });
      setValidationProviderMode(String(creditSetting.provider_mode || 'own_system').toLowerCase());
      fetchAdminData();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not save credit setting'));
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

  const isDeliverableResult = (row) => {
    const quality = String(row?.bhisha_result?.quality || row?.classification || '').trim().toLowerCase();
    if (quality === 'deliverable' || quality === 'safe') {
      return true;
    }
    return Boolean(
      row?.validMailbox
      && row?.validSyntax
      && !row?.disposable
      && !row?.roleBased
      && !row?.risky
    );
  };

  const deliverableEmails = useMemo(() => {
    const seen = new Set();
    const normalized = [];
    results.forEach((row) => {
      const email = String(row?.email || '').trim().toLowerCase();
      if (!email || seen.has(email) || !isDeliverableResult(row)) {
        return;
      }
      seen.add(email);
      normalized.push(email);
    });
    return normalized;
  }, [results]);

  useEffect(() => {
    if (deliverableEmails.length === 0) {
      setDeliverableEmailsText('');
      setShowComposePanel(false);
      return;
    }
    setDeliverableEmailsText(deliverableEmails.join('\n'));
  }, [deliverableEmails]);

  const sendToDeliverableEmails = async () => {
    setError('');
    setInfo('');
    setSendSummary(null);

    if (!deliverableEmailsText.trim()) {
      setError('Deliverable email list is empty.');
      return;
    }
    if (!mailDraft.subject.trim()) {
      setError('Enter mail subject.');
      return;
    }
    if (!mailDraft.body.trim()) {
      setError('Enter mail body.');
      return;
    }
    if (!smtpDraft.host.trim() || !smtpDraft.port.trim() || !smtpDraft.username.trim() || !smtpDraft.password.trim()) {
      setError('Enter all required SMTP details: host, port, username, password.');
      return;
    }

    setSendingDeliverableEmails(true);
    try {
      const response = await API.post('email-validation/send-deliverable-mails/', {
        deliverable_emails: deliverableEmailsText,
        subject: mailDraft.subject,
        body: mailDraft.body,
        smtp_provider: smtpDraft.provider,
        smtp_host: smtpDraft.host,
        smtp_port: smtpDraft.port,
        smtp_username: smtpDraft.username,
        smtp_password: smtpDraft.password,
        from_email: smtpDraft.fromEmail || smtpDraft.username,
        smtp_use_tls: smtpDraft.useTls,
        smtp_use_ssl: smtpDraft.useSsl,
      });
      setSendSummary(response.data || null);
      setInfo(`Mail send completed. Sent: ${response.data?.sent_count || 0}, Failed: ${response.data?.failed_count || 0}.`);
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not send mails to deliverable emails.'));
    } finally {
      setSendingDeliverableEmails(false);
    }
  };

  const formatLiveResult = (row) => {
    const toBool = (value) => {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      const normalized = String(value || '').trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
      }
      return false;
    };

    const profile = row?.bhisha_result?.result_profile;
    if (profile) {
      return profile;
    }

    const validSyntax = toBool(row?.bhisha_result?.valid_syntax ?? row?.validSyntax);
    const disposable = toBool(row?.bhisha_result?.disposable ?? row?.disposable);
    const roleBased = toBool(row?.bhisha_result?.role_based ?? row?.roleBased);
    const catchAll = toBool(row?.bhisha_result?.catch_all ?? row?.catchAll);
    const validInbox = Boolean(row?.validMailbox && validSyntax && !disposable && !roleBased);
    const rawStatus = disposable
      ? 'do_not_mail (disposable)'
      : roleBased
        ? 'do_not_mail (role_based)'
        : catchAll
          ? 'risky (catch_all)'
          : validSyntax
            ? 'safe_to_mail'
            : 'invalid (syntax)';

    return [
      `Results Profile for: ${String(row?.email || '').trim().toLowerCase()}`,
      '----------------------------------------',
      `Valid Inbox:    ${String(validInbox)}`,
      `Valid Syntax:   ${String(validSyntax)}`,
      `Disposable:     ${String(disposable)}`,
      `Role Based:     ${String(roleBased)}`,
      `Catch All:      ${String(catchAll)}`,
      'Risk Factors:   None Detected',
      '----------------------------------------',
      `Raw Status Details:  ${rawStatus}`,
      `Is Free Domain?:     ${String(Boolean(row?.email && String(row.email).includes('@')) || disposable)}`,
    ].join('\n');
  };

  const formatBoolValue = (value) => {
    if (value === true) {
      return 'Yes';
    }
    return 'No';
  };

  const getBoolStyles = (value) => {
    if (value === true) {
      return { color: '#166534', background: '#dcfce7', border: '#86efac' };
    }
    return { color: '#991b1b', background: '#fee2e2', border: '#fca5a5' };
  };

  const factorCards = (row) => {
    const toBool = (value) => {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      const normalized = String(value || '').trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
      }
      return false;
    };

    const bhisha = row?.bhisha_result || {};
    const factors = [
      { label: 'Valid Inbox', type: 'bool', value: toBool(bhisha.valid_inbox ?? row?.validMailbox) },
      { label: 'Valid Syntax', type: 'bool', value: toBool(bhisha.valid_syntax ?? row?.validSyntax) },
      { label: 'Spam / Do Not Mail', type: 'bool', value: toBool(bhisha.spam ?? row?.spam) },
      { label: 'Catch All', type: 'bool', value: toBool(bhisha.catch_all ?? row?.catchAll) },
      { label: 'Disposable', type: 'bool', value: toBool(bhisha.disposable ?? row?.disposable) },
      { label: 'Role Based', type: 'bool', value: toBool(bhisha.role_based ?? row?.roleBased) },
      { label: 'Risk Factors', type: 'text', value: bhisha.risk_factors || 'None Detected' },
      { label: 'Raw Status', type: 'text', value: bhisha.raw_status_details || row?.statusCode || 'safe_to_mail' },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '10px' }}>
        {factors.map((factor) => {
          const style = factor.type === 'bool'
            ? getBoolStyles(factor.value)
            : { color: '#1f2937', background: '#eef2ff', border: '#c7d2fe' };

          const displayValue = factor.type === 'bool'
            ? formatBoolValue(factor.value)
            : String(factor.value);

          return (
            <div key={`${row?.email || 'factor'}-${factor.label}`} style={{ border: `1px solid ${style.border}`, borderRadius: '8px', padding: '8px', background: style.background }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>{factor.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: style.color }}>{displayValue}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const isOwnSystemModeActive = isAdmin && String(creditSetting.provider_mode || '').toLowerCase() === 'own_system';

  const isOwnSystemValidationResultMode = String(validationProviderMode || '').toLowerCase() === 'own_system';

  const getOwnSystemMailStatus = (row) => {
    const bhisha = row?.bhisha_result || {};
    const validInbox = Boolean(bhisha.valid_inbox);
    return validInbox ? 'Valid' : 'Invalid';
  };

  const getOwnSystemMailStatusStyle = (statusValue) => {
    if (statusValue === 'Valid') {
      return { color: '#166534', background: '#dcfce7', border: '#86efac' };
    }
    return { color: '#991b1b', background: '#fee2e2', border: '#fca5a5' };
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
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>Unified Wallet Balance</div>
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
        {isAdmin && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>ZeroBounce Provider Balance</div>
            <div style={{ color: '#0f766e', fontSize: '24px', fontWeight: 800 }}>{providerEmailBalance || '-'}</div>
          </div>
        )}
        {isAdmin && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>SMS Provider Balance</div>
            <div style={{ color: '#0f766e', fontSize: '24px', fontWeight: 800 }}>{providerMessageBalance || '-'}</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {info && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#ecfdf5', color: '#166534', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
          {info}
        </div>
      )}

      {activeTab === 'validate' && (
        <>
          {isAdmin && (
            <div
              style={{
                marginBottom: '12px',
                border: '1px solid #dbeafe',
                background: '#eff6ff',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: 700 }}>
                Current Global Validation Mode
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#1f2937',
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '999px',
                  padding: '4px 10px',
                }}
              >
                {String(validationProviderMode || 'own_system').toLowerCase() === 'zerobounce'
                  ? 'API Mode'
                  : 'Own System Mode'}
              </div>
            </div>
          )}

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
                <small style={{ color: '#6b7280' }}>{sourceFile ? `Selected: ${sourceFile.name}` : 'Maximum file size: 25MB'}</small>
              </div>
            )}

            <button
              type="submit"
              disabled={loading && !activeRequestMeta?.requestId}
              style={{ marginTop: '14px', padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Validating...' : 'Validate Emails'}
            </button>

            {loading && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ marginBottom: '6px', fontSize: '12px', color: '#374151', fontWeight: 600 }}>{statusMessage || 'Processing...'}</div>
                <div style={{ height: '10px', width: '100%', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: progressStage === 'uploading' ? '#2563eb' : '#16a34a',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>{Math.round(progressPercent)}%</div>
              </div>
            )}

            {activeRequestMeta?.requestId && (
              <div style={{ marginTop: '12px', border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: 700, marginBottom: '6px' }}>
                  Live Task Status: {activeRequestMeta.processingState || activeRequestMeta.status}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#1f2937', marginBottom: '8px' }}>
                  <span><strong>Progress:</strong> {activeRequestMeta.progressPercent || 0}%</span>
                  <span><strong>Processed:</strong> {activeRequestMeta.processedCount || 0}/{activeRequestMeta.totalCount || 0}</span>
                  <span><strong>Elapsed:</strong> {activeRequestMeta.elapsedSeconds || 0}s</span>
                  <span><strong>ETA:</strong> {activeRequestMeta.etaSeconds || 0}s</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '36px', marginBottom: '8px' }}>
                  {(progressTimeline.length ? progressTimeline : [{ value: activeRequestMeta.progressPercent || 0 }]).map((point, index) => (
                    <div
                      key={`spark-${index}`}
                      title={`${Math.round(point.value || 0)}%`}
                      style={{
                        width: '6px',
                        height: `${Math.max(3, Math.round((Number(point.value || 0) / 100) * 34))}px`,
                        background: '#2563eb',
                        borderRadius: '3px',
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => runRequestAction('start')} style={{ border: '1px solid #bfdbfe', background: '#ffffff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>Start</button>
                  <button type="button" onClick={() => runRequestAction('pause')} style={{ border: '1px solid #bfdbfe', background: '#ffffff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>Pause</button>
                  <button type="button" onClick={() => runRequestAction('resume')} style={{ border: '1px solid #bfdbfe', background: '#ffffff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>Resume</button>
                  <button type="button" onClick={() => runRequestAction('stop')} style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>Stop</button>
                  <button type="button" onClick={() => runRequestAction('cancel')} style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>Cancel</button>
                  <button
                    type="button"
                    onClick={() => {
                      setKeepInBackground((prev) => !prev);
                      if (!keepInBackground) {
                        setLoading(false);
                      }
                    }}
                    style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}
                  >
                    {keepInBackground ? 'Resume Live Tracking' : 'Run In Background'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {latestRequestId && (
            <div style={{ marginBottom: '10px', color: '#475569', fontSize: '13px' }}>
              Request ID: <strong>{latestRequestId}</strong>
            </div>
          )}

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
                    {isOwnSystemValidationResultMode ? (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                        <div style={{ fontSize: '13px', color: '#111827', fontWeight: 700, marginBottom: '6px' }}>
                          Entered Mail: {String(row?.email || '').trim().toLowerCase() || '-'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 700 }}>Validation Status</div>
                          <div
                            style={{
                              border: `1px solid ${getOwnSystemMailStatusStyle(getOwnSystemMailStatus(row)).border}`,
                              background: getOwnSystemMailStatusStyle(getOwnSystemMailStatus(row)).background,
                              color: getOwnSystemMailStatusStyle(getOwnSystemMailStatus(row)).color,
                              borderRadius: '999px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            {getOwnSystemMailStatus(row)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {isOwnSystemModeActive && (
                          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '12px', color: '#475569', fontWeight: 700 }}>Own System Mail Status</div>
                            <div
                              style={{
                                border: `1px solid ${getOwnSystemMailStatusStyle(getOwnSystemMailStatus(row)).border}`,
                                background: getOwnSystemMailStatusStyle(getOwnSystemMailStatus(row)).background,
                                color: getOwnSystemMailStatusStyle(getOwnSystemMailStatus(row)).color,
                                borderRadius: '999px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 800,
                              }}
                            >
                              {getOwnSystemMailStatus(row)}
                            </div>
                          </div>
                        )}
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px', color: '#374151', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                          {formatLiveResult(row)}
                        </pre>
                        {factorCards(row)}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                Deliverable Emails ({deliverableEmails.length})
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>
                After validation, review/edit the list below and proceed to write and send mail using your own SMTP credentials.
              </div>
              <textarea
                value={deliverableEmailsText}
                onChange={(e) => setDeliverableEmailsText(e.target.value)}
                rows={8}
                placeholder="Deliverable emails will appear here (one per line)"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical', marginBottom: '10px' }}
              />
              <button
                type="button"
                onClick={() => setShowComposePanel((prev) => !prev)}
                disabled={!deliverableEmailsText.trim()}
                style={{ padding: '10px 12px', border: 'none', borderRadius: '8px', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: deliverableEmailsText.trim() ? 'pointer' : 'not-allowed' }}
              >
                {showComposePanel ? 'Hide Mail Writer' : 'Proceed / Write Mails to Deliverable Emails'}
              </button>

              {showComposePanel && (
                <div style={{ marginTop: '12px', border: '1px solid #dbeafe', background: '#f8fbff', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>Sender Mail Details (your SMTP)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" placeholder="Email provider (e.g. Gmail, Outlook)" value={smtpDraft.provider} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, provider: e.target.value }))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                    <input type="text" placeholder="SMTP host" value={smtpDraft.host} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, host: e.target.value }))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                    <input type="number" placeholder="SMTP port" value={smtpDraft.port} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, port: e.target.value }))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                    <input type="text" placeholder="SMTP username / mail" value={smtpDraft.username} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, username: e.target.value }))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                    <input type="password" placeholder="SMTP password / app passkey" value={smtpDraft.password} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, password: e.target.value }))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                    <input type="email" placeholder="From email (optional)" value={smtpDraft.fromEmail} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, fromEmail: e.target.value }))} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', color: '#1f2937', fontSize: '13px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={smtpDraft.useTls} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, useTls: e.target.checked }))} /> Use TLS
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={smtpDraft.useSsl} onChange={(e) => setSmtpDraft((prev) => ({ ...prev, useSsl: e.target.checked }))} /> Use SSL
                    </label>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>Mail Content</div>
                  <input type="text" placeholder="Subject" value={mailDraft.subject} onChange={(e) => setMailDraft((prev) => ({ ...prev, subject: e.target.value }))} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '8px' }} />
                  <textarea value={mailDraft.body} onChange={(e) => setMailDraft((prev) => ({ ...prev, body: e.target.value }))} rows={5} placeholder="Write your email message" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', marginBottom: '10px' }} />

                  <button
                    type="button"
                    onClick={sendToDeliverableEmails}
                    disabled={sendingDeliverableEmails}
                    style={{ padding: '10px 12px', border: 'none', borderRadius: '8px', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: sendingDeliverableEmails ? 'not-allowed' : 'pointer' }}
                  >
                    {sendingDeliverableEmails ? 'Checking SMTP and Sending...' : 'Check Details and Send Mails'}
                  </button>

                  {sendSummary && (
                    <div style={{ marginTop: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px', color: '#166534', fontSize: '13px' }}>
                      Requested: <strong>{sendSummary.requested_count || 0}</strong> · Sent: <strong>{sendSummary.sent_count || 0}</strong> · Failed: <strong>{sendSummary.failed_count || 0}</strong>
                    </div>
                  )}
                </div>
              )}
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
                        {isAdmin && (
                          <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
                            Created by: {item.created_by || item.user_email || '-'} · Used by: {item.used_by || '-'} · Usage: {item.usage_count ?? 0}
                          </div>
                        )}
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
              <li>Returns only the compact Bhisha result fields for each email, plus request metadata.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'api-docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px', color: '#1e3a8a', fontSize: '13px', lineHeight: 1.6 }}>
            Email validation input syntax: use `email` for single, `emails` (array or newline/comma string) for bulk, and `source_file` as multipart file upload.
            Long file jobs return pending status with a `request_id`. Use status and control APIs with actions: `start`, `pause`, `resume`, `stop`, `cancel`.
          </div>
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
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Validation provider mode</label>
            <select
              value={creditSetting.provider_mode}
              onChange={(e) => setCreditSetting((prev) => ({ ...prev, provider_mode: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px' }}
            >
              <option value="own_system">Own System (SMTP + DNS)</option>
              <option value="zerobounce">ZeroBounce API</option>
            </select>
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
                <div style={{ fontSize: '13px', color: '#1f2937' }}><strong>Unified Wallet Credits (SMS + Email):</strong> {selectedUserDetails.wallet_balance || selectedUserDetails.email_validation_balance || '0'}</div>
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

            <h3 style={{ marginTop: '16px', marginBottom: '10px' }}>API Keys (Admin Visibility)</h3>
            {apiKeys.length === 0 ? (
              <div style={{ color: '#6b7280', marginBottom: '10px' }}>No API keys found.</div>
            ) : (
              <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                {apiKeys.map((item) => (
                  <div key={`admin-key-${item.id}`} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>Key: {item.masked_key || item.key || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>Created by: {item.created_by || item.user_email || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>Used by: {item.used_by || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>Usage Count: {item.usage_count ?? 0}</div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Selected User History</h3>
            {selectedUserHistory.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Select a user from latest list.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedUserHistory.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontWeight: 700 }}>#{item.id} · User ID: {item.user} · {item.user_email || 'Unknown user'} · {item.source}</div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>API Key: {item.api_key_name || 'Dashboard / direct request'}</div>
                    {item.provider_message_id && (
                      <div style={{ fontSize: '12px', color: '#1f2937' }}>Provider Message ID: {item.provider_message_id}</div>
                    )}
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.email_count} emails · Cost {item.cost_deducted} · {new Date(item.created_at).toLocaleString()}</div>
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









