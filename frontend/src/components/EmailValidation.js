import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';
import { getProfessionalErrorMessage } from '../errorHelpers';
import { FaArrowLeft, FaUpload, FaEnvelopeOpenText, FaListUl, FaKey, FaServer, FaUserShield } from 'react-icons/fa';

const MAX_EMAIL_VALIDATION_UPLOAD_MB = 500;

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
  const [dlrReport, setDlrReport] = useState(null);
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
  const [fileUploadReady, setFileUploadReady] = useState(false);

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
    ip_whitelist_text: '',
    ip_whitelist_user_email: '',
  });
  const [validationProviderMode, setValidationProviderMode] = useState('own_system');
  const [ipWhitelistRequestDraft, setIpWhitelistRequestDraft] = useState({ requested_ip: '', request_note: '' });
  const [ipWhitelistRequests, setIpWhitelistRequests] = useState([]);
  const [ipWhitelistRequestLoading, setIpWhitelistRequestLoading] = useState(false);
  const [creatingIpWhitelistRequest, setCreatingIpWhitelistRequest] = useState(false);
  const [adminIpWhitelistRequests, setAdminIpWhitelistRequests] = useState([]);
  const [savingAdminIpRequestId, setSavingAdminIpRequestId] = useState(null);
  const [selectedUserIpWhitelistDraft, setSelectedUserIpWhitelistDraft] = useState('');

  const formatDuration = (seconds) => {
    const value = Math.max(0, Number(seconds || 0));
    if (!Number.isFinite(value)) {
      return '0s';
    }
    if (value < 60) {
      return `${Math.round(value)}s`;
    }
    const totalSeconds = Math.round(value);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

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
    } else if (tab === 'ip-whitelist') {
      setActiveTab('ip-whitelist');
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

  const fetchUserIpWhitelistRequests = async () => {
    setIpWhitelistRequestLoading(true);
    try {
      const response = await API.get('email-validation/ip-whitelist-requests/');
      setIpWhitelistRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setIpWhitelistRequests([]);
      const statusCode = Number(err?.response?.status || 0);
      if (statusCode >= 500) {
        setError('Whitelist request service is temporarily unavailable. Please try again shortly.');
      }
    } finally {
      setIpWhitelistRequestLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (!canViewSupportData) {
      return;
    }

    setAdminLoading(true);
    try {
      const [latestRes, creditRes, usersRes, ipRequestsRes] = await Promise.allSettled([
        API.get('admin/email-validation/history/latest/'),
        API.get('admin/email-validation/credit-settings/'),
        API.get('admin/users/'),
        API.get('admin/email-validation/ip-whitelist-requests/'),
      ]);

      if (latestRes.status === 'fulfilled') {
        setLatestByUser(Array.isArray(latestRes.value.data) ? latestRes.value.data : []);
      } else {
        setLatestByUser([]);
      }

      if (creditRes.status === 'fulfilled') {
        setCreditSetting({
          value: String(creditRes.value.data?.value ?? '0'),
          description: String(creditRes.value.data?.description ?? ''),
          provider_mode: String(creditRes.value.data?.provider_mode ?? 'own_system'),
          ip_whitelist_text: String(creditRes.value.data?.ip_whitelist_text ?? ''),
          ip_whitelist_user_email: String(creditRes.value.data?.ip_whitelist_user_email ?? ''),
        });
      }

      if (usersRes.status === 'fulfilled') {
        setAdminUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
      } else {
        setAdminUsers([]);
      }

      if (ipRequestsRes.status === 'fulfilled') {
        setAdminIpWhitelistRequests(Array.isArray(ipRequestsRes.value.data) ? ipRequestsRes.value.data : []);
      } else {
        setAdminIpWhitelistRequests([]);
      }

      const hasCriticalFailure = creditRes.status === 'rejected' || usersRes.status === 'rejected';
      if (hasCriticalFailure) {
        const firstError = creditRes.status === 'rejected' ? creditRes.reason : usersRes.reason;
        setError(`Some admin sections could not load: ${getProfessionalErrorMessage(firstError, 'Please try again.')}`);
      }
    } catch (err) {
      console.error('Unexpected admin data error:', err);
      setError(`Admin data load failed: ${getProfessionalErrorMessage(err, 'Please try again.')}`);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ip-whitelist') {
      fetchUserIpWhitelistRequests();
    }
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

  const buildFallbackDlrReport = ({ providerMode, requestId, status, completedAt, failureReason, rows }) => {
    const normalizedMode = String(providerMode || validationProviderMode || 'own_system').toLowerCase();
    const resultRows = Array.isArray(rows) ? rows : [];

    if (normalizedMode === 'own_system') {
      let valid = 0;
      let invalid = 0;
      resultRows.forEach((row) => {
        const state = String(row?.provider_result_status || '').trim().toLowerCase();
        if (state === 'valid') {
          valid += 1;
        } else {
          invalid += 1;
        }
      });

      return {
        request_id: requestId || '',
        status: status || 'completed',
        completed: String(status || '').toLowerCase() === 'completed',
        delivery_time: completedAt || null,
        failure_reason: failureReason || '',
        provider_mode: 'own_system',
        provider_mode_label: 'Own System (SMTP + DNS)',
        summary: { valid, invalid, total: resultRows.length },
        results: resultRows.map((row) => ({
          email: String(row?.email || '').trim().toLowerCase(),
          status: String(row?.provider_result_status || 'Invalid').trim() || 'Invalid',
        })),
      };
    }

    const totals = { deliverable: 0, risky: 0, invalid: 0, unknown: 0 };
    resultRows.forEach((row) => {
      const classification = String(row?.classification || 'unknown').toLowerCase();
      if (classification === 'deliverable') totals.deliverable += 1;
      else if (classification === 'risky') totals.risky += 1;
      else if (classification === 'invalid') totals.invalid += 1;
      else totals.unknown += 1;
    });

    return {
      request_id: requestId || '',
      status: status || 'completed',
      completed: String(status || '').toLowerCase() === 'completed',
      delivery_time: completedAt || null,
      failure_reason: failureReason || '',
      provider_mode: 'zerobounce',
      provider_mode_label: 'ZeroBounce API',
      summary: { ...totals, total: resultRows.length },
      results: resultRows.map((row) => ({
        email: String(row?.email || '').trim().toLowerCase(),
        status: String(row?.status || '').trim(),
        status_code: String(row?.statusCode || '').trim(),
        classification: String(row?.classification || 'Unknown').trim(),
      })),
    };
  };

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
    const publicRequestId = data?.request_ids?.[0] || data?.request_id || history?.request_items?.[0]?.request_id || history?.request_id || '';
    setLatestRequestId(publicRequestId);
    const modeFromPayload = String(
      data?.provider_mode
      || historySummary?.provider_mode
      || validationProviderMode
      || 'own_system'
    ).toLowerCase();
    setValidationProviderMode(modeFromPayload);

    const payloadDlr = data?.dlr_report;
    if (payloadDlr && typeof payloadDlr === 'object') {
      setDlrReport(payloadDlr);
    } else {
      setDlrReport(buildFallbackDlrReport({
        providerMode: modeFromPayload,
        requestId: data?.request_id || history?.request_id || '',
        status: String(history?.status || data?.status || 'completed').toLowerCase(),
        completedAt: history?.completed_at || null,
        failureReason: historySummary?.failure_reason || historySummary?.error || '',
        rows: effectiveResults,
      }));
    }
  };

  const hydrateFromHistoryRow = (current = {}) => {
    const rs = current?.results_summary || {};
    const rawProgressPercent = Number(rs?.progress_percent || 0);
    const processedCount = Number(rs?.processed_count || 0);
    const totalCount = Number(rs?.total_count || current?.email_count || 0);
    const computedProgressFromCounts = totalCount > 0
      ? Math.min(100, Math.round((Math.max(0, processedCount) / Math.max(1, totalCount)) * 100))
      : 0;
    const progressPercent = Math.max(rawProgressPercent, computedProgressFromCounts);
    const startedAtRaw = String(rs?.started_at || '').trim();
    const derivedElapsedSeconds = (() => {
      if (!startedAtRaw) {
        return 0;
      }
      const startedMs = new Date(startedAtRaw).getTime();
      if (!Number.isFinite(startedMs)) {
        return 0;
      }
      return Math.max(0, Math.round((Date.now() - startedMs) / 1000));
    })();
    const elapsedSeconds = Number(rs?.elapsed_seconds || derivedElapsedSeconds || 0);
    const etaSeconds = Number(rs?.eta_seconds || 0);
    const processingState = String(current?.processing_state || rs?.processing_state || current?.status || 'pending').toLowerCase();
    const modeFromRow = String(current?.provider_mode || rs?.provider_mode || validationProviderMode || 'own_system').toLowerCase();
    const liveRows = Array.isArray(rs?.results) ? rs.results : [];
    if (liveRows.length > 0) {
      setResults(liveRows);
    }
    setSummary({
      safe_to_send_yes: Number(rs?.safe_count || 0),
      safe_to_send_no: Number(rs?.unsafe_count || 0),
    });

    if (current?.dlr_report && typeof current.dlr_report === 'object') {
      setDlrReport(current.dlr_report);
    } else {
      setDlrReport(buildFallbackDlrReport({
        providerMode: modeFromRow,
        requestId: current?.request_id || '',
        status: processingState,
        completedAt: current?.completed_at || null,
        failureReason: rs?.failure_reason || rs?.error || '',
        rows: Array.isArray(rs?.results) ? rs.results : [],
      }));
    }

    setActiveRequestMeta({
      requestId: current?.request_id || '',
      batchId: current?.batch_id || current?.request_id || '',
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
    setFileUploadReady(!stateDone);
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

  const downloadDlrCsv = () => {
    if (!dlrReport || !Array.isArray(dlrReport.results) || dlrReport.results.length === 0) {
      setError('No DLR rows available to download.');
      return;
    }

    const rows = dlrReport.results;
    const header = ['email', 'status', 'status_code', 'classification', 'valid_mailbox', 'valid_syntax'];
    const escapeCell = (value) => {
      const raw = String(value ?? '');
      if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
        return `"${raw.replace(/"/g, '""')}"`;
      }
      return raw;
    };

    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push([
        escapeCell(row?.email || ''),
        escapeCell(row?.status || row?.classification || row?.status_code || ''),
        escapeCell(row?.status_code || row?.statusCode || ''),
        escapeCell(row?.classification || ''),
        escapeCell(row?.valid_mailbox ?? row?.validMailbox ?? ''),
        escapeCell(row?.valid_syntax ?? row?.validSyntax ?? ''),
      ].join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const requestLabel = String(latestRequestId || dlrReport?.request_id || 'dlr').trim();
    link.href = url;
    link.setAttribute('download', `email-validation-dlr-${requestLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const runRequestAction = async (action) => {
    const requestId = activeRequestMeta?.batchId || activeRequestMeta?.requestId || latestRequestId;
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

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return false;
  };

  useEffect(() => {
    if (!activeRequestMeta?.requestId) {
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
    }, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeRequestMeta?.requestId]);

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

    if (mode === 'file') {
      const requestId = activeRequestMeta?.requestId || latestRequestId;
      if (!requestId || !fileUploadReady) {
        setError('Please click Proceed Upload first.');
        return;
      }
      setError('');
      setInfo('');
      await runRequestAction('start');
      return;
    }

    setError('');
    setInfo('');
    setResults([]);
    setSummary({ safe_to_send_yes: 0, safe_to_send_no: 0 });
    setDlrReport(null);
    setFileUploadReady(false);
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
    if (Number(walletBalance || 0) <= 0) {
      setError('No wallet credits available.');
      return;
    }

    setLoading(true);
    const startedAtMs = Date.now();
    try {
      let response;

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

      const isQueuedFileValidation = mode === 'file' && String(response?.status || '').toLowerCase() === '202';
      const pendingRequestId = response.data?.request_id || response.data?.batch_id || response.data?.history?.request_id || '';

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

    if (file.size > MAX_EMAIL_VALIDATION_UPLOAD_MB * 1024 * 1024) {
      setError(`File too large. Maximum allowed size is ${MAX_EMAIL_VALIDATION_UPLOAD_MB}MB.`);
      return;
    }

    setError('');
    setSourceFile(file);
    setFileUploadReady(false);
    setActiveRequestMeta(null);
    setLatestRequestId('');
    setLastFileName('');
    setDlrReport(null);
    localStorage.removeItem('emailValidationActiveRequestId');
  };

  const handleProceedUpload = async () => {
    if (!sourceFile) {
      setError('Please choose a file first.');
      return;
    }
    if (Number(walletBalance || 0) <= 0) {
      setError('No wallet credits available.');
      return;
    }

    setError('');
    setInfo('');
    setResults([]);
    setSummary({ safe_to_send_yes: 0, safe_to_send_no: 0 });
    setDlrReport(null);
    setDeliverableEmailsText('');
    setShowComposePanel(false);
    setSendSummary(null);
    setLoading(true);
    setProgressPercent(0);
    setProgressStage('uploading');
    setStatusMessage('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('source_file', sourceFile);
      formData.append('defer_start', 'true');

      const response = await API.post('email-validation/validate/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 900000,
        onUploadProgress: (progressEvent) => {
          const loaded = Number(progressEvent?.loaded || 0);
          const total = Number(progressEvent?.total || 0);
          if (total > 0) {
            const percent = Math.min(100, Math.round((loaded / total) * 100));
            setProgressPercent(percent);
            setStatusMessage(percent < 100 ? `Uploading file... ${percent}%` : 'Upload complete. Queuing file for background extraction...');
          }
        },
      });

      const requestId = String(response?.data?.request_id || response?.data?.batch_id || '');
      if (!requestId) {
        throw new Error('Upload succeeded but request ID is missing.');
      }

      setLatestRequestId(requestId);
      localStorage.setItem('emailValidationActiveRequestId', requestId);
      await loadRequestStatus(requestId);
      setFileUploadReady(true);
      setProgressStage('idle');
      setProgressPercent(100);
      setStatusMessage('File upload completed. Click Start Mail Validation.');
      setInfo('File upload completed successfully. Mail extraction and validation will run in background after Start.');
      await refreshWalletBalance(response.data?.wallet_balance);
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'File upload/extraction failed.'));
      setStatusMessage('File upload failed.');
      setFileUploadReady(false);
    } finally {
      setLoading(false);
    }
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
        ip_whitelist_text: creditSetting.ip_whitelist_text,
        ip_whitelist_user_email: creditSetting.ip_whitelist_user_email,
      });
      setValidationProviderMode(String(creditSetting.provider_mode || 'own_system').toLowerCase());
      fetchAdminData();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not save credit setting'));
    }
  };

  const submitIpWhitelistRequest = async () => {
    const requestedIp = String(ipWhitelistRequestDraft.requested_ip || '').trim();
    if (!requestedIp) {
      setError('Please enter an IP address to request whitelist access.');
      return;
    }

    setCreatingIpWhitelistRequest(true);
    setError('');
    try {
      await API.post('email-validation/ip-whitelist-requests/', {
        requested_ip: requestedIp,
        request_note: String(ipWhitelistRequestDraft.request_note || '').trim(),
      });
      setIpWhitelistRequestDraft({ requested_ip: '', request_note: '' });
      setInfo('IP whitelist request sent to admin successfully.');
      fetchUserIpWhitelistRequests();
      if (isAdmin) {
        fetchAdminData();
      }
    } catch (err) {
      const statusCode = Number(err?.response?.status || 0);
      const hasNoResponse = !err?.response;
      if (hasNoResponse) {
        setError('Connection issue detected while submitting your whitelist request. Please verify network connectivity and retry.');
      } else if (statusCode >= 500) {
        setError('Server is temporarily unable to process whitelist requests. Please try again shortly.');
      } else {
        setError(getProfessionalErrorMessage(err, 'Could not submit IP whitelist request.'));
      }
    } finally {
      setCreatingIpWhitelistRequest(false);
    }
  };

  const updateAdminIpWhitelistRequestStatus = async (requestItem, nextStatus) => {
    if (!requestItem?.id || !nextStatus || !isAdmin) {
      return;
    }

    setSavingAdminIpRequestId(requestItem.id);
    setError('');
    try {
      await API.patch(`admin/email-validation/ip-whitelist-requests/${requestItem.id}/`, {
        status: nextStatus,
      });
      await fetchAdminData();
      await fetchUserIpWhitelistRequests();
      setInfo(`IP whitelist request marked as ${nextStatus}.`);
    } catch (err) {
      const statusCode = Number(err?.response?.status || 0);
      if (statusCode === 404) {
        setError('Whitelist request endpoint is not available on server. Please restart backend and ensure latest routes are deployed.');
      } else {
        setError(getProfessionalErrorMessage(err, 'Could not update whitelist request status.'));
      }
    } finally {
      setSavingAdminIpRequestId(null);
    }
  };

  const assignSelectedUserIpWhitelist = async () => {
    if (!isAdmin || !selectedUserDetails) {
      return;
    }

    const requestedIp = String(selectedUserIpWhitelistDraft || '').trim();
    if (!requestedIp) {
      setError('Enter an IP address to whitelist for the selected user.');
      return;
    }

    setError('');
    try {
      await API.post('admin/email-validation/ip-whitelist/assign/', {
        user_id: selectedUserDetails.id,
        requested_ip: requestedIp,
        request_note: `Whitelisted from admin center for ${selectedUserDetails.email}`,
      });
      setSelectedUserIpWhitelistDraft('');
      await fetchAdminData();
      await fetchUserIpWhitelistRequests();
      setInfo(`IP ${requestedIp} whitelisted for ${selectedUserDetails.email}.`);
    } catch (err) {
      const statusCode = Number(err?.response?.status || 0);
      if (statusCode === 404) {
        setError('Direct IP whitelist endpoint is not available on server. Please restart backend and apply latest API changes.');
      } else {
        setError(getProfessionalErrorMessage(err, 'Could not whitelist IP for selected user.'));
      }
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

    const bhisha = row?.bhisha_result || {};
    const validSyntax = toBool(row?.bhisha_result?.valid_syntax ?? row?.validSyntax);
    const disposable = toBool(row?.bhisha_result?.disposable ?? row?.disposable);
    const roleBased = toBool(row?.bhisha_result?.role_based ?? row?.roleBased);
    const validInbox = Boolean(row?.validMailbox && validSyntax && !disposable && !roleBased);
    const riskFactors = String(bhisha.risk_factors || 'None Detected').trim() || 'None Detected';

    return [
      `Valid Inbox:    ${String(validInbox)}`,
      `Valid Syntax:   ${String(validSyntax)}`,
      `Risk Factors:   ${riskFactors}`,
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

  const getRowProviderMode = (row) => {
    return String(
      row?.provider_mode
      || row?.bhisha_result?.provider_mode
      || validationProviderMode
      || 'own_system'
    ).toLowerCase();
  };

  const getRowProviderLabel = (row) => {
    const explicit = String(row?.provider_mode_label || row?.bhisha_result?.provider_mode_label || '').trim();
    if (explicit) {
      return explicit;
    }
    return getRowProviderMode(row) === 'zerobounce' ? 'ZeroBounce API' : 'Own System (SMTP + DNS)';
  };

  const getOwnSystemMailStatus = (row) => {
    const bhisha = row?.bhisha_result || {};
    const validSyntax = Boolean(bhisha.valid_syntax ?? row?.validSyntax);
    const statusCode = String(row?.statusCode || row?.status_code || '').trim().toUpperCase();

    if (statusCode === 'SYNTAX_DOMAIN_VALID') return 'Valid';
    if (!validSyntax) return 'Invalid Syntax';
    if (statusCode === 'NO_MX' || statusCode === 'DOMAIN_NOT_FOUND') return 'Invalid Domain';
    if (statusCode === 'DNS_LOOKUP_FAILED' || statusCode === 'DNS_UNAVAILABLE') return 'Invalid Domain';
    if (statusCode === 'INVALID_SYNTAX_DOMAIN_TYPO') return 'Invalid Domain';

    return String(row?.provider_result_status || row?.status || 'Invalid').trim() || 'Invalid';
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

      {activeRequestMeta?.requestId && !['completed', 'failed', 'cancelled', 'stopped'].includes(String(activeRequestMeta.processingState || '').toLowerCase()) && (
        <div style={{
          marginBottom: '16px',
          border: '1px solid #bbf7d0',
          background: '#f0fdf4',
          borderRadius: '10px',
          padding: '12px',
          position: 'sticky',
          top: '10px',
          zIndex: 5,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d', marginBottom: '6px' }}>
            Active Mail Validation: {activeRequestMeta.processingState || activeRequestMeta.status}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#14532d', marginBottom: '8px' }}>
            <span><strong>Request:</strong> {activeRequestMeta.requestId}</span>
            <span><strong>Progress:</strong> {activeRequestMeta.progressPercent || 0}%</span>
            <span><strong>Processed:</strong> {activeRequestMeta.processedCount || 0}/{activeRequestMeta.totalCount || 0}</span>
            <span><strong>Elapsed:</strong> {formatDuration(activeRequestMeta.elapsedSeconds || 0)}</span>
            <span><strong>ETA:</strong> {formatDuration(activeRequestMeta.etaSeconds || 0)}</span>
          </div>
          <div style={{ height: '8px', width: '100%', background: '#dcfce7', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.max(0, Math.min(100, Number(activeRequestMeta.progressPercent || 0)))}%`,
                height: '100%',
                background: '#16a34a',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button onClick={() => setActiveTab('validate')} style={tabButtonStyle(activeTab === 'validate')}>
          <FaEnvelopeOpenText /> Validate
        </button>
        <button onClick={() => setActiveTab('api-keys')} style={tabButtonStyle(activeTab === 'api-keys')}>
          <FaKey /> API Keys
        </button>
        <button onClick={() => setActiveTab('ip-whitelist')} style={tabButtonStyle(activeTab === 'ip-whitelist')}>
          <FaKey /> IP Whitelist
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
                <div style={{ marginBottom: '8px', fontSize: '12px', color: '#334155', fontWeight: 700 }}>
                  Option 1: Upload file. Option 2: Validate uploaded file.
                </div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Upload File (.xlsv, .csv, .txt, .xls, .xlsx)</label>
                <input type="file" onChange={handleFileChange} accept=".xlsv,.csv,.txt,.xls,.xlsx" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                <small style={{ color: '#6b7280' }}>{sourceFile ? `Selected: ${sourceFile.name}` : `Maximum file size: ${MAX_EMAIL_VALIDATION_UPLOAD_MB}MB`}</small>
                <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '12px', fontWeight: 600 }}>
                  Please make sure the file contains only one column with valid email addresses. If any extra/non-email data is present, validation will stop.
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleProceedUpload}
                    disabled={loading || !sourceFile}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #1d4ed8',
                      borderRadius: '8px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      cursor: (loading || !sourceFile) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Uploading...' : 'Proceed Upload'}
                  </button>
                  <div style={{ fontSize: '12px', color: '#334155', alignSelf: 'center' }}>
                    {fileUploadReady ? 'Upload complete. You can start mail validation now.' : 'Proceed uploads the file and queues extraction in background.'}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={(loading && !activeRequestMeta?.requestId) || (mode === 'file' && !fileUploadReady)}
              style={{ marginTop: '14px', padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Validating...' : (mode === 'file' ? 'Start Mail Validation' : 'Validate Emails')}
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
                  <span><strong>Elapsed:</strong> {formatDuration(activeRequestMeta.elapsedSeconds || 0)}</span>
                  <span><strong>ETA:</strong> {formatDuration(activeRequestMeta.etaSeconds || 0)}</span>
                </div>
                {Boolean((activeRequestMeta.totalCount || 0) > 0 && (results.length || 0) < (activeRequestMeta.processedCount || 0)) && (
                  <div style={{ marginBottom: '8px', fontSize: '11px', color: '#1e3a8a' }}>
                    Showing live preview of completed validations while processing continues.
                  </div>
                )}

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

          {dlrReport && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '12px 14px', fontWeight: 800, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>DLR Report</span>
                <button
                  type="button"
                  onClick={downloadDlrCsv}
                  style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#1e293b' }}
                >
                  Download DLR CSV
                </button>
              </div>
              <div style={{ padding: '12px 14px', display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  Status: <strong>{String(dlrReport?.status || '-')}</strong>
                  {' | '}Completed: <strong>{String(Boolean(dlrReport?.completed))}</strong>
                </div>

                {String(dlrReport?.provider_mode || '').toLowerCase() === 'own_system' ? (
                  <div style={{ fontSize: '12px', color: '#0f172a', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span>Valid: <strong>{Number(dlrReport?.summary?.valid || 0)}</strong></span>
                    <span>Invalid: <strong>{Number(dlrReport?.summary?.invalid || 0)}</strong></span>
                    <span>Total: <strong>{Number(dlrReport?.summary?.total || 0)}</strong></span>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#0f172a', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span>Deliverable: <strong>{Number(dlrReport?.summary?.deliverable || 0)}</strong></span>
                    <span>Risky: <strong>{Number(dlrReport?.summary?.risky || 0)}</strong></span>
                    <span>Invalid: <strong>{Number(dlrReport?.summary?.invalid || 0)}</strong></span>
                    <span>Unknown: <strong>{Number(dlrReport?.summary?.unknown || 0)}</strong></span>
                    <span>Total: <strong>{Number(dlrReport?.summary?.total || 0)}</strong></span>
                  </div>
                )}

                {Array.isArray(dlrReport?.results) && dlrReport.results.length > 0 && (
                  <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dlrReport.results.map((row, index) => (
                          <tr key={`dlr-${row?.email || index}-${index}`}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{String(row?.email || '-')}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                              {String(row?.status || row?.classification || row?.status_code || '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
                    {getRowProviderMode(row) === 'own_system' ? (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                        <div style={{ marginBottom: '6px', fontSize: '11px', color: '#334155', fontWeight: 700 }}>
                          Provider: {getRowProviderLabel(row)}
                        </div>
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
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 700 }}>Provider</div>
                          <div
                            style={{
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#0f172a',
                              borderRadius: '999px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            {getRowProviderLabel(row)}
                          </div>
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
                            {String(row?.provider_result_status || row?.status || row?.classification || 'Result available')}
                          </div>
                        </div>
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

      {activeTab === 'ip-whitelist' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Request IP Whitelist Access</h3>
          <div style={{ color: '#4b5563', fontSize: '12px', marginBottom: '10px' }}>
            Submit your client IP address for admin approval. Approved requests are auto-added to API IP whitelist.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              value={ipWhitelistRequestDraft.requested_ip}
              onChange={(e) => setIpWhitelistRequestDraft((prev) => ({ ...prev, requested_ip: e.target.value }))}
              placeholder="Enter your public IP (e.g. 203.0.113.10)"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              value={ipWhitelistRequestDraft.request_note}
              onChange={(e) => setIpWhitelistRequestDraft((prev) => ({ ...prev, request_note: e.target.value }))}
              placeholder="Optional note for admin"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
          </div>
          <button
            type="button"
            onClick={submitIpWhitelistRequest}
            disabled={creatingIpWhitelistRequest}
            style={{ padding: '10px 12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: creatingIpWhitelistRequest ? 'not-allowed' : 'pointer', marginBottom: '12px' }}
          >
            {creatingIpWhitelistRequest ? 'Sending Request...' : 'Send IP Whitelist Request'}
          </button>

          {ipWhitelistRequestLoading ? (
            <div style={{ color: '#6b7280', fontSize: '13px' }}>Loading your IP whitelist requests...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ipWhitelistRequests.map((item) => (
                <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, color: '#1f2937' }}>{item.requested_ip}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: item.status === 'approved' ? '#166534' : item.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                      {String(item.status_label || item.status || '').toUpperCase()}
                    </div>
                  </div>
                  {item.request_note && <div style={{ marginTop: '4px', fontSize: '12px', color: '#475569' }}>Note: {item.request_note}</div>}
                  {item.admin_notes && <div style={{ marginTop: '4px', fontSize: '12px', color: '#334155' }}>Admin notes: {item.admin_notes}</div>}
                </div>
              ))}
              {ipWhitelistRequests.length === 0 && <div style={{ color: '#6b7280', fontSize: '13px' }}>No IP whitelist requests yet.</div>}
            </div>
          )}
        </div>
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
              <li>Use either `X-API-Key` / `api_key`, or call from an admin-whitelisted IP address.</li>
              <li>Use endpoint: `/api/auth/email-validation/api/validate/`</li>
              <li>Supports only one `email` per API validate call.</li>
              <li>DLR report includes mode (`API Key mode` or `IP mode`) and the requested mail id.</li>
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
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>IP whitelist (one IP per line)</label>
            <textarea
              value={creditSetting.ip_whitelist_text}
              onChange={(e) => setCreditSetting((prev) => ({ ...prev, ip_whitelist_text: e.target.value }))}
              placeholder={'203.0.113.10\n198.51.100.22'}
              rows={4}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px', resize: 'vertical' }}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>IP mode billing user email</label>
            <input
              type="email"
              value={creditSetting.ip_whitelist_user_email}
              onChange={(e) => setCreditSetting((prev) => ({ ...prev, ip_whitelist_user_email: e.target.value }))}
              placeholder="primary@example.com"
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
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>IP Whitelist Requests</h3>
            <div style={{ color: '#4b5563', fontSize: '12px', marginBottom: '10px' }}>
              Review user-submitted IPs. Approving adds IP to whitelist and sets billing user email to the request owner.
            </div>
            {adminLoading ? (
              <div>Loading IP whitelist requests...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {adminIpWhitelistRequests.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{item.requested_ip}</div>
                        <div style={{ fontSize: '12px', color: '#374151' }}>User: {item.user_email || '-'}</div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: item.status === 'approved' ? '#166534' : item.status === 'rejected' ? '#991b1b' : '#92400e' }}>
                        {String(item.status_label || item.status || '').toUpperCase()}
                      </div>
                    </div>
                    {item.request_note && <div style={{ marginTop: '4px', fontSize: '12px', color: '#475569' }}>Request note: {item.request_note}</div>}
                    {item.admin_notes && <div style={{ marginTop: '4px', fontSize: '12px', color: '#334155' }}>Admin notes: {item.admin_notes}</div>}
                    {item.status === 'pending' && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => updateAdminIpWhitelistRequestStatus(item, 'approved')}
                          disabled={savingAdminIpRequestId === item.id}
                          style={{ border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', borderRadius: '6px', padding: '6px 8px', cursor: savingAdminIpRequestId === item.id ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAdminIpWhitelistRequestStatus(item, 'rejected')}
                          disabled={savingAdminIpRequestId === item.id}
                          style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', padding: '6px 8px', cursor: savingAdminIpRequestId === item.id ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {adminIpWhitelistRequests.length === 0 && <div style={{ color: '#6b7280' }}>No IP whitelist requests found.</div>}
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

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: 700, marginBottom: '6px' }}>IP Whitelisting for Selected User</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={selectedUserIpWhitelistDraft}
                      onChange={(e) => setSelectedUserIpWhitelistDraft(e.target.value)}
                      placeholder="Enter IP to whitelist for this user"
                      style={{ width: '240px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                    <button
                      type="button"
                      onClick={assignSelectedUserIpWhitelist}
                      style={{ padding: '8px 10px', border: 'none', borderRadius: '6px', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Whitelist IP
                    </button>
                  </div>
                </div>

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









