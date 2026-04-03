import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBolt, FaCheckCircle, FaCircle, FaExclamationCircle } from 'react-icons/fa';
import API from '../api';

const OTP_LIVE_STEPS = [
  { key: 'trigger', label: 'Trigger admin SMS gateway' },
  { key: 'dispatch', label: 'Send OTP to entered number' },
  { key: 'verify', label: 'OTP received and verified' },
];

export default function FreeTrialSMS() {
  const navigate = useNavigate();

  const [recipientNumber, setRecipientNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpStatus, setOtpStatus] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [lastOtpAttempt, setLastOtpAttempt] = useState('');

  const [verifiedNumbers, setVerifiedNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [messageContent, setMessageContent] = useState('');

  const [usage, setUsage] = useState({ used_messages: 0, available_messages: 3, total_limit: 3 });

  const [sendingOtp, setSendingOtp] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [otpLiveStatus, setOtpLiveStatus] = useState({
    trigger: 'idle',
    dispatch: 'idle',
    verify: 'idle',
    detail: 'Waiting for number entry',
  });
  const [otpLiveLog, setOtpLiveLog] = useState([]);

  const freeTrialComplete = (usage.available_messages || 0) <= 0;

  const canEditMessageFields = useMemo(
    () => Boolean(selectedNumber && verifiedNumbers.includes(selectedNumber) && !freeTrialComplete),
    [selectedNumber, verifiedNumbers, freeTrialComplete]
  );

  const appendOtpLiveLog = (message) => {
    const timeLabel = new Date().toLocaleTimeString();
    setOtpLiveLog((prev) => [`${timeLabel} - ${message}`, ...prev].slice(0, 6));
  };

  const updateOtpLiveStatus = (updates) => {
    setOtpLiveStatus((prev) => ({ ...prev, ...updates }));
  };

  const getStepIcon = (value) => {
    if (value === 'done') {
      return <FaCheckCircle color="#2e7d32" size={14} />;
    }
    if (value === 'failed') {
      return <FaExclamationCircle color="#c62828" size={14} />;
    }
    return <FaCircle color="#94a3b8" size={10} />;
  };

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const cleanOtp = (otp || '').trim();
    if (!otpSent || cleanOtp.length < 6 || verifyingOtp) {
      return;
    }

    if (cleanOtp === lastOtpAttempt) {
      return;
    }

    verifyOtpAuto(cleanOtp);
  }, [otp, otpSent, verifyingOtp, lastOtpAttempt]);

  const initialize = async () => {
    setLoading(true);
    try {
      const [profileResponse, usageResponse, verifiedResponse] = await Promise.all([
        API.get('profile/'),
        API.get('sms/usage-summary/'),
        API.get('sms/free-trial/verified-numbers/'),
      ]);

      if (profileResponse.data?.is_staff) {
        navigate('/sms/send');
        return;
      }

      setUsage(usageResponse.data || { used_messages: 0, available_messages: 3, total_limit: 3 });

      const numbers = verifiedResponse.data?.verified_numbers || [];
      setVerifiedNumbers(numbers);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load free trial data');
    } finally {
      setLoading(false);
    }
  };

  const refreshUsage = async () => {
    try {
      const usageResponse = await API.get('sms/usage-summary/');
      setUsage(usageResponse.data || { used_messages: 0, available_messages: 3, total_limit: 3 });
    } catch {
      // ignore usage refresh failures
    }
  };

  const fetchVerifiedNumbers = async () => {
    try {
      const response = await API.get('sms/free-trial/verified-numbers/');
      const numbers = response.data?.verified_numbers || [];
      setVerifiedNumbers(numbers);
      if (selectedNumber && !numbers.includes(selectedNumber)) {
        setSelectedNumber('');
      }
    } catch {
      // ignore
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');

    const normalizedNumber = recipientNumber.replace(/\D/g, '');
    if (normalizedNumber.length < 10) {
      setError('Enter a valid mobile number (minimum 10 digits)');
      return;
    }

    setSendingOtp(true);
    updateOtpLiveStatus({
      trigger: 'in_progress',
      dispatch: 'idle',
      verify: 'idle',
      detail: `Triggering admin gateway for ${normalizedNumber}`,
    });
    appendOtpLiveLog('Admin gateway trigger started');

    try {
      const response = await API.post('sms/free-trial/send-otp/', {
        recipient_number: recipientNumber,
      });

      setOtpSent(true);
      setOtp('');
      setLastOtpAttempt('');
      setOtpStatus('OTP sent. Enter OTP to auto-verify.');
      updateOtpLiveStatus({
        trigger: 'done',
        dispatch: 'done',
        verify: 'idle',
        detail: `OTP dispatched to ${response.data?.recipient_number || normalizedNumber}`,
      });
      appendOtpLiveLog(`OTP dispatched (${response.data?.delivery_status || 'sent'})`);
      if (response.data?.provider_message_id) {
        appendOtpLiveLog(`Provider message id: ${response.data.provider_message_id}`);
      }
      setSuccess(response.data?.detail || 'OTP sent successfully');
    } catch (err) {
      setOtpSent(false);
      setOtpStatus('');
      updateOtpLiveStatus({
        trigger: 'failed',
        dispatch: 'failed',
        verify: 'idle',
        detail: 'OTP dispatch failed',
      });
      appendOtpLiveLog('OTP dispatch failed');
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtpAuto = async (otpValue) => {
    setVerifyingOtp(true);
    setLastOtpAttempt(otpValue);
    setOtpStatus('Validating OTP...');
    updateOtpLiveStatus({ verify: 'in_progress', detail: 'Validating OTP received by user' });
    appendOtpLiveLog('OTP validation started');
    setError('');

    try {
      const response = await API.post('sms/free-trial/verify-otp/', {
        recipient_number: recipientNumber,
        otp: otpValue,
      });

      const numbers = response.data?.verified_numbers || [];
      setVerifiedNumbers(numbers);
      setSelectedNumber(recipientNumber.replace(/\D/g, ''));
      setOtpStatus('OTP verified. Message field is now unlocked.');
      updateOtpLiveStatus({
        trigger: 'done',
        dispatch: 'done',
        verify: 'done',
        detail: `OTP verified for ${recipientNumber.replace(/\D/g, '')}`,
      });
      appendOtpLiveLog('OTP verified successfully');
      setSuccess('Number verified successfully');
      setOtp('');
      await fetchVerifiedNumbers();
    } catch (err) {
      setOtpStatus('Invalid OTP. Keep typing correct OTP.');
      updateOtpLiveStatus({ verify: 'failed', detail: 'OTP verification failed. Retry with correct OTP.' });
      appendOtpLiveLog('OTP verification failed');
      setError(err.response?.data?.detail || 'OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSendFreeTrialSMS = async () => {
    setError('');
    setSuccess('');

    if (!canEditMessageFields) {
      setError('Please verify a number with OTP first');
      return;
    }

    if (!messageContent.trim()) {
      setError('Message content is required');
      return;
    }

    setSendingSms(true);
    try {
      const response = await API.post('sms/free-trial/send/', {
        recipient_number: selectedNumber,
        message_content: messageContent,
      });
      setSuccess(response.data?.detail || 'Message sent successfully');
      setMessageContent('');
      await refreshUsage();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send free trial SMS');
      await refreshUsage();
    } finally {
      setSendingSms(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading free trial...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f9', padding: '20px' }}>
      <div style={{ width: '50vw', maxWidth: '760px', minWidth: '360px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '22px' }}>
        <button
          onClick={() => navigate('/sms/send')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', border: 'none', backgroundColor: '#f0f0f0', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}
        >
          <FaArrowLeft /> Back
        </button>

        <h3 style={{ marginTop: 0, color: '#111827' }}>Free Trial Messaging</h3>
        <p style={{ color: '#555', marginTop: '6px' }}>
          Free trial allows only single-number messaging. Limit: <strong>{usage.total_limit || 3}</strong> messages.
        </p>

        <div style={{ backgroundColor: '#f7f9fc', border: '1px solid #dfe7f2', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '13px' }}>
          Used: <strong>{usage.used_messages || 0}</strong> | Available: <strong>{usage.available_messages || 0}</strong> | Wallet: <strong>{usage.wallet_balance || 0}</strong>
        </div>

        {error && <div style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>{error}</div>}
        {success && <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #81c784', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>{success}</div>}

        {freeTrialComplete && (
          <div style={{ backgroundColor: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
            You used all free trial messages. Please upgrade to continue.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '10px' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '8px' }}>
              <input
                type="tel"
                value={recipientNumber}
                onChange={(e) => {
                  setRecipientNumber(e.target.value);
                  setOtp('');
                  setOtpStatus('');
                  setLastOtpAttempt('');
                  setSelectedNumber('');
                  setOtpLiveLog([]);
                  setOtpLiveStatus({
                    trigger: 'idle',
                    dispatch: 'idle',
                    verify: 'idle',
                    detail: 'Waiting for number entry',
                  });
                }}
                placeholder="Enter number for OTP verification"
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
              <button
                type="button"
                disabled={sendingOtp || freeTrialComplete}
                onClick={handleSendOtp}
                style={{ border: 'none', borderRadius: '6px', padding: '10px 14px', backgroundColor: sendingOtp ? '#ccc' : '#1976d2', color: '#fff', cursor: sendingOtp || freeTrialComplete ? 'not-allowed' : 'pointer' }}
              >
                {sendingOtp ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Live OTP Status</div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {OTP_LIVE_STEPS.map((step) => (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  {getStepIcon(otpLiveStatus[step.key])}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
              {otpLiveStatus.detail}
            </div>
            {otpLiveLog.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px', maxHeight: '96px', overflowY: 'auto' }}>
                {otpLiveLog.map((entry) => (
                  <div key={entry} style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter OTP (auto validates)"
          disabled={!otpSent || freeTrialComplete}
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '6px' }}
        />
        <small style={{ color: verifyingOtp ? '#1565c0' : '#666' }}>{otpStatus || 'OTP validates automatically when 6 digits are entered.'}</small>

        <div style={{ marginTop: '12px', marginBottom: '10px', fontSize: '13px', color: '#475569' }}>
          Verified target number: <strong>{selectedNumber || 'Verify the entered number to continue'}</strong>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Message Content</label>
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value.slice(0, 160))}
            disabled={!canEditMessageFields}
            placeholder="Type your free trial message"
            style={{ width: '100%', minHeight: '90px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'none', backgroundColor: canEditMessageFields ? '#fff' : '#f5f5f5' }}
          />
          <small style={{ color: '#666' }}>{messageContent.length}/160</small>
        </div>

        <button
          type="button"
          onClick={handleSendFreeTrialSMS}
          disabled={sendingSms || !canEditMessageFields || freeTrialComplete}
          style={{ width: '100%', border: 'none', borderRadius: '6px', padding: '11px 14px', backgroundColor: sendingSms || !canEditMessageFields || freeTrialComplete ? '#ccc' : '#4caf50', color: '#fff', cursor: sendingSms || !canEditMessageFields || freeTrialComplete ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {sendingSms ? 'Sending...' : 'Send SMS'}
        </button>

        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
          <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
            <FaBolt style={{ marginRight: '6px' }} /> Upgrade for bulk options
          </div>
          <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>
            Upgrade to use Upload Mobile Number File, Upload Personalized SMS Excel, and Group Messaging.
          </small>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => alert('Please contact admin to upgrade your SMS plan.')}
              style={{ border: 'none', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#ff9800', color: '#fff', cursor: 'pointer' }}
            >
              Upgrade
            </button>
            <button
              type="button"
              onClick={() => navigate('/sms/history')}
              style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
