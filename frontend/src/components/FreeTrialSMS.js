import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaLock, FaPaperPlane } from 'react-icons/fa';
import API from '../api';

export default function FreeTrialSMS() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [signupNumber, setSignupNumber] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [usage, setUsage] = useState({ used_messages: 0, available_messages: 3, total_limit: 3 });
  const [sendingSms, setSendingSms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const freeTrialComplete = (usage.available_messages || 0) <= 0;

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);
    try {
      const [profileResponse, usageResponse] = await Promise.all([
        API.get('profile/'),
        API.get('sms/usage-summary/'),
      ]);

      if (profileResponse.data?.is_staff) {
        navigate('/sms/send');
        return;
      }

      setProfile(profileResponse.data);
      setSignupNumber(profileResponse.data?.phone_number || '');
      setUsage(usageResponse.data || { used_messages: 0, available_messages: 3, total_limit: 3 });
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

  const handleSendFreeTrialSMS = async () => {
    setError('');
    setSuccess('');

    if (!signupNumber) {
      setError('Add your mobile number in signup or profile before using free trial SMS');
      return;
    }

    if (!messageContent.trim()) {
      setError('Message content is required');
      return;
    }

    setSendingSms(true);
    try {
      const response = await API.post('sms/free-trial/send/', {
        recipient_number: signupNumber,
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F5F1FF 0%, #F0EFFE 100%)', padding: '20px' }}>
      <div style={{ width: '50vw', maxWidth: '760px', minWidth: '360px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(26, 14, 78, 0.08)', border: '1px solid #EDE8FB', padding: '22px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', border: 'none', backgroundColor: '#F5F3FF', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#5B3FA8', fontWeight: 600 }}
        >
          <FaArrowLeft /> Back
        </button>

        <h3 style={{ marginTop: 0, color: '#1A0E4E' }}>Free Trial Messaging</h3>
        <p style={{ color: '#555', marginTop: '6px' }}>
          Free trial now sends messages only to the mobile number used during signup. Limit: <strong>{usage.total_limit || 3}</strong> messages.
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <div style={{ border: '1px solid #dbe5f0', borderRadius: '10px', padding: '14px', backgroundColor: '#fbfdff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1f4d8f', fontWeight: 700, marginBottom: '10px' }}>
              <FaCheckCircle /> Allowed destination
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}>Your signup mobile number</div>
            <input
              type="text"
              readOnly
              value={signupNumber || ''}
              placeholder="No mobile number found"
              style={{ width: '100%', padding: '10px', border: '1px solid #d5d9e2', borderRadius: '6px', backgroundColor: '#f3f5f9' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              Free trial users cannot change the destination number.
            </div>
          </div>

          <div style={{ border: '1px solid #efe6c8', borderRadius: '10px', padding: '14px', backgroundColor: '#fffaf0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9a6700', fontWeight: 700, marginBottom: '10px' }}>
              <FaLock /> Security rule
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              OTP verification for arbitrary recipient numbers has been removed. The free trial can only deliver to the number tied to this account.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>Message content</label>
          <textarea
            rows={5}
            value={messageContent}
            onChange={e => setMessageContent(e.target.value.slice(0, 160))}
            disabled={freeTrialComplete || !signupNumber}
            placeholder="Type your message"
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>{messageContent.length}/160</div>
        </div>

        {!signupNumber && (
          <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
            {profile?.phone_number
              ? 'Your signup number is unavailable right now. Refresh and try again.'
              : 'Your profile does not have a signup mobile number yet. Add one in your profile to use free trial messaging.'}
          </div>
        )}

        <button
          type="button"
          onClick={handleSendFreeTrialSMS}
          disabled={sendingSms || freeTrialComplete || !signupNumber}
          style={{
            width: '100%',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            backgroundColor: sendingSms || freeTrialComplete || !signupNumber ? '#cbd5e1' : '#0f766e',
            color: '#fff',
            cursor: sendingSms || freeTrialComplete || !signupNumber ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <FaPaperPlane /> {sendingSms ? 'Sending...' : 'Send Free Trial SMS'}
        </button>
      </div>
    </div>
  );
}

