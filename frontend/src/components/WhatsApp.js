import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const WhatsApp = () => {
  const [contactNo, setContactNo] = useState('');
  const [contactName, setContactName] = useState('');
  const [msgText, setMsgText] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [templateAttributes, setTemplateAttributes] = useState([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [trackingMessageId, setTrackingMessageId] = useState('');
  const navigate = useNavigate();
  const selectedTemplate = templates.find((item) => String(item.id) === templateId);
  const templateAttributeCount = selectedTemplate
    ? Math.max(0, ...Array.from(selectedTemplate.message_text.matchAll(/\{\{(\d+)\}\}/g), (match) => Number(match[1])))
    : 0;

  useEffect(() => {
    if (!trackingMessageId) return undefined;

    let cancelled = false;
    let timeoutId;
    let attempts = 0;
    const pollStatus = async () => {
      attempts += 1;
      let refreshFailed = false;
      try {
        const response = await API.get(`whatsapp/messages/${trackingMessageId}/status/`);
        if (cancelled) return;
        const deliveryStatus = response.data?.deliveryStatus || 'pending';
        const labels = {
          pending: 'pending with Anantya',
          sent: 'sent by Anantya',
          delivered: 'delivered to WhatsApp',
          seen: 'seen by the recipient',
        };
        setFeedback({ type: 'success', text: `Message ${labels[deliveryStatus] || labels.pending}.` });
        if (deliveryStatus === 'delivered' || deliveryStatus === 'seen') {
          setTrackingMessageId('');
          return;
        }
      } catch {
        refreshFailed = true;
      }

      if (cancelled) return;
      if (attempts >= 36) {
        setFeedback(refreshFailed
          ? { type: 'error', text: 'Anantya accepted the message, but its delivery status could not be refreshed.' }
          : { type: 'success', text: 'Anantya has not confirmed delivery yet. Check WhatsApp History to refresh this message status later.' });
        setTrackingMessageId('');
        return;
      }
      timeoutId = window.setTimeout(pollStatus, 5000);
    };

    timeoutId = window.setTimeout(pollStatus, 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [trackingMessageId]);

  useEffect(() => {
    API.get('whatsapp/templates/')
      .then((response) => setTemplates((Array.isArray(response.data) ? response.data : []).filter((item) => item.approval_status === 'approved' && item.is_active && item.message_text)))
      .catch(() => setTemplates([]));
  }, []);

  const submitMessage = async (event) => {
    event.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const response = await API.post('whatsapp/send/', {
        contactNo,
        contactName,
        msgText,
        ...(templateId ? { templateId } : {}),
        ...(templateId ? { attributes: templateAttributes.slice(0, templateAttributeCount) } : {}),
      });
      const sentMessage = response.data?.message;
      const initialDeliveryStatus = sentMessage?.deliveryStatus;
      const labels = {
        pending: 'pending with Anantya',
        sent: 'sent by Anantya',
        delivered: 'delivered to WhatsApp',
        seen: 'seen by the recipient',
      };
      setFeedback({
        type: 'success',
        text: `Anantya accepted the request. Message ${labels[initialDeliveryStatus] || labels.pending}.`,
      });
      if (sentMessage?.id && (sentMessage?.providerMessageId || sentMessage?.providerCampaignId) && !['delivered', 'seen'].includes(initialDeliveryStatus)) {
        setTrackingMessageId(String(sentMessage.id));
      }
      setMsgText('');
      setTemplateId('');
      setTemplateAttributes([]);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.response?.data?.detail
          || error.response?.data?.contactNo
          || error.response?.data?.msgText
          || 'Could not send the WhatsApp message.',
      });
    } finally {
      setSending(false);
    }
  };

  const openDashboard = () => {
    navigate(localStorage.getItem('isAdmin') === 'true' ? '/admin/whatsapp/dashboard' : '/whatsapp/dashboard');
  };

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '28px', background: '#fff', border: '1px solid #dce7df', borderRadius: '8px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px' }}>Send WhatsApp Message</h1>
            <p style={{ margin: '8px 0 0', color: '#53645a' }}>Free-form text requires an active customer-service window. Use an approved template to start or resume a conversation.</p>
          </div>
          <button type="button" onClick={openDashboard} style={{ padding: '9px 12px', border: '1px solid #b8c9be', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>
            WhatsApp dashboard
          </button>
        </header>

        {feedback && (
          <div role={feedback.type === 'error' ? 'alert' : 'status'} style={{ marginBottom: '16px', padding: '11px 13px', borderRadius: '6px', background: feedback.type === 'error' ? '#fff1f0' : '#edf8f0', color: feedback.type === 'error' ? '#a12622' : '#1b6937' }}>
            {feedback.text}
          </div>
        )}

        <form onSubmit={submitMessage} style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Contact number
            <input required value={contactNo} onChange={(event) => setContactNo(event.target.value)} placeholder="919876543210" autoComplete="tel" style={{ minWidth: 0, padding: '11px 12px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
          </label>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Contact name <span style={{ fontWeight: 400, color: '#66746a' }}>Optional</span>
            <input value={contactName} onChange={(event) => setContactName(event.target.value)} maxLength={150} style={{ minWidth: 0, padding: '11px 12px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
          </label>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Approved message template <span style={{ fontWeight: 400, color: '#66746a' }}>Optional</span>
            <select value={templateId} onChange={(event) => {
              const selectedId = event.target.value;
              setTemplateId(selectedId);
              const selectedTemplate = templates.find((item) => String(item.id) === selectedId);
              if (selectedTemplate) {
                setMsgText(selectedTemplate.message_text || '');
                const variableCount = Math.max(0, ...Array.from(selectedTemplate.message_text.matchAll(/\{\{(\d+)\}\}/g), (match) => Number(match[1])));
                setTemplateAttributes(Array(variableCount).fill(''));
              } else {
                setTemplateAttributes([]);
              }
            }} style={{ padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff' }}>
              <option value="">Write a message</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>
          {templateId && templateAttributeCount > 0 && (
            <fieldset style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', margin: 0, padding: '12px', border: '1px solid #dce7df', borderRadius: '6px' }}>
              <legend style={{ padding: '0 5px', fontSize: '13px', fontWeight: 600 }}>Template values</legend>
              {Array.from({ length: templateAttributeCount }, (_, index) => (
                <label key={index} style={{ display: 'grid', gap: '5px', fontSize: '13px' }}>
                  Variable {index + 1}
                  <input value={templateAttributes[index] || ''} onChange={(event) => setTemplateAttributes((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} style={{ minWidth: 0, padding: '9px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
                </label>
              ))}
            </fieldset>
          )}
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Message
            <textarea required value={msgText} onChange={(event) => setMsgText(event.target.value)} rows={6} maxLength={4096} style={{ minWidth: 0, resize: 'vertical', padding: '11px 12px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit', lineHeight: 1.5 }} />
            <span style={{ color: '#66746a', fontSize: '12px', textAlign: 'right' }}>{msgText.length}/4096</span>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={sending} style={{ padding: '11px 18px', border: 0, borderRadius: '5px', background: sending ? '#8ba995' : '#16794a', color: '#fff', fontWeight: 700, cursor: sending ? 'wait' : 'pointer' }}>
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default WhatsApp;