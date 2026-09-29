import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { getProfessionalErrorMessage } from '../errorHelpers';
import { calculateSmsMeta } from '../smsLength';

const MAX_SMS_SEGMENTS = 10;
const inputStyle = {
  width: '100%',
  minWidth: 0,
  padding: '10px 11px',
  border: '1px solid #bdc9c1',
  borderRadius: '5px',
  background: '#fff',
  font: 'inherit',
  boxSizing: 'border-box',
};

export default function UserSMSSend() {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [recipientNumber, setRecipientNumber] = useState('');
  const [senderId, setSenderId] = useState('');
  const [transport, setTransport] = useState('api');
  const [smppProfile, setSmppProfile] = useState('standard');
  const [destinationCountry, setDestinationCountry] = useState('OTHER');
  const [templateId, setTemplateId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const smsMeta = calculateSmsMeta(messageContent, MAX_SMS_SEGMENTS);
  const selectedTemplate = templates.find((item) => String(item.id) === templateId);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const [optionsResponse, templatesResponse, profileResponse] = await Promise.all([
          API.get('sms/user-send-options/'),
          API.get('sms/templates/'),
          API.get('profile/'),
        ]);
        const nextOptions = optionsResponse.data || {};
        setOptions(nextOptions);
        setSenderId(nextOptions.default_sender_id || nextOptions.sender_ids?.[0] || '');
        setRecipientNumber(profileResponse.data?.phone_number || '');
        setTemplates((Array.isArray(templatesResponse.data) ? templatesResponse.data : []).filter((item) => (
          item.approval_status === 'approved' && item.is_active
        )));
        if (!nextOptions.transports?.length) {
          setError('SMS sending is not configured. Ask an administrator to configure a provider and sender ID.');
        } else if (!nextOptions.transports.includes('api')) {
          setTransport(nextOptions.transports[0]);
        }
      } catch (requestError) {
        setError(getProfessionalErrorMessage(requestError, 'Could not load SMS sending options.'));
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const handleTemplateChange = (nextTemplateId) => {
    setTemplateId(nextTemplateId);
    const nextTemplate = templates.find((item) => String(item.id) === nextTemplateId);
    if (nextTemplate) {
      setMessageContent(nextTemplate.message_content || '');
      if (nextTemplate.sender_id && options?.sender_ids?.includes(nextTemplate.sender_id)) {
        setSenderId(nextTemplate.sender_id);
      }
    }
  };

  const sendSms = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!smsMeta.isWithinLimit) {
      setError(`Message exceeds ${MAX_SMS_SEGMENTS} SMS segments.`);
      return;
    }
    setSending(true);
    try {
      const response = await API.post('sms/user-send/', {
        transport,
        smpp_profile: smppProfile,
        display_sender_id: senderId,
        recipient_number: recipientNumber,
        message_content: messageContent,
        sms_type: selectedTemplate?.sms_type || 'transactional',
        destination_country: destinationCountry,
        ...(templateId ? { template_id: Number(templateId) } : {}),
      });
      setSuccess(`SMS sent using ${transport.toUpperCase()} via ${senderId}. Remaining wallet balance: ${response.data?.remaining_sms_credits ?? 'updated'}.`);
      setOptions((current) => current ? { ...current, wallet_balance: response.data?.remaining_sms_credits ?? current.wallet_balance } : current);
      setTemplateId('');
      setMessageContent('');
    } catch (requestError) {
      setError(getProfessionalErrorMessage(requestError, 'SMS could not be sent.'));
      try {
        const refreshed = await API.get('sms/user-send-options/');
        setOptions(refreshed.data || null);
      } catch {
        // Preserve the original send error if balance refresh is unavailable.
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return <main style={{ padding: '24px' }}>Loading SMS sending options...</main>;

  return (
    <main style={{ minHeight: '100vh', padding: '30px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '27px' }}>Send SMS</h1>
            <p style={{ margin: '7px 0 0', color: '#53645a' }}>Messages use administrator-configured provider credentials and sender IDs.</p>
          </div>
          <button type="button" onClick={() => navigate('/sms/templates')} style={{ padding: '9px 12px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff', cursor: 'pointer' }}>Request templates</button>
        </header>

        <div style={{ marginBottom: '14px', padding: '13px 15px', border: '1px solid #dce7df', borderRadius: '6px', background: '#fff', color: '#53645a' }}>
          Wallet balance <strong style={{ color: '#17221c' }}>{options?.wallet_balance ?? '0.0000'}</strong>
          <span style={{ marginLeft: '16px' }}>Cost per SMS <strong style={{ color: '#17221c' }}>{options?.cost_per_message ?? '1'}</strong></span>
        </div>

        {error && <div role="alert" style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '5px', background: '#fff1f0', color: '#a12622' }}>{error}</div>}
        {success && <div role="status" style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '5px', background: '#edf8f0', color: '#1b6937' }}>{success}</div>}

        <form onSubmit={sendSms} style={{ display: 'grid', gap: '14px', padding: '18px', border: '1px solid #dce7df', borderRadius: '7px', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
              Transport
              <select value={transport} onChange={(event) => setTransport(event.target.value)} style={inputStyle}>
                {(options?.transports || []).map((item) => <option key={item} value={item}>{item === 'api' ? 'SMS API' : 'SMPP'}</option>)}
              </select>
            </label>
            {transport === 'smpp' && <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
              SMPP profile
              <select value={smppProfile} onChange={(event) => setSmppProfile(event.target.value)} style={inputStyle}>
                <option value="standard">Standard</option><option value="dlt">DLT</option>
              </select>
            </label>}
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
              Sender ID
              <select required value={senderId} onChange={(event) => setSenderId(event.target.value)} style={inputStyle}>
                <option value="">Select sender ID</option>
                {(options?.sender_ids || []).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
              Destination country
              <select value={destinationCountry} onChange={(event) => setDestinationCountry(event.target.value)} style={inputStyle}>
                <option value="OTHER">Other</option><option value="IN">India (DLT)</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
              Recipient number
              <input required value={recipientNumber} onChange={(event) => setRecipientNumber(event.target.value)} placeholder="Country code + number" autoComplete="tel" style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
              Approved template <span style={{ color: '#66746a', fontWeight: 400 }}>Optional</span>
              <select value={templateId} onChange={(event) => handleTemplateChange(event.target.value)} style={inputStyle}>
                <option value="">Write a message</option>
                {templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
            Message
            <textarea required value={messageContent} readOnly={Boolean(templateId)} onChange={(event) => setMessageContent(event.target.value)} rows={6} maxLength={5000} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, background: templateId ? '#f5f7f5' : '#fff' }} />
            <span style={{ color: smsMeta.isWithinLimit ? '#66746a' : '#a12622', fontSize: '12px', textAlign: 'right' }}>{smsMeta.encoding} · {smsMeta.segments}/{MAX_SMS_SEGMENTS} segments</span>
          </label>
          {!options?.transports?.length && <p style={{ margin: 0, color: '#8a5a00' }}>No SMS provider transport is configured. Contact an administrator.</p>}
          {options?.transports?.length > 0 && (options?.sender_ids || []).length === 0 && <p style={{ margin: 0, color: '#8a5a00' }}>No sender IDs are configured. Contact an administrator.</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={sending || !options?.transports?.length || !(options?.sender_ids || []).length || !smsMeta.isWithinLimit} style={{ padding: '10px 16px', border: 0, borderRadius: '5px', background: sending ? '#8ba995' : '#167d68', color: '#fff', fontWeight: 700, cursor: sending ? 'wait' : 'pointer' }}>{sending ? 'Sending...' : 'Send SMS'}</button>
          </div>
        </form>
      </div>
    </main>
  );
}