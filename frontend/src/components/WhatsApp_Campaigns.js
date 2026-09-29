import React, { useEffect, useState } from 'react';
import API from '../api';

const fieldStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #bdc9c1',
  borderRadius: '5px',
  font: 'inherit',
  boxSizing: 'border-box',
};

const Campaigns = () => {
  const [campaignName, setCampaignName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [recipientsText, setRecipientsText] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    API.get('whatsapp/templates/')
      .then((response) => setTemplates((Array.isArray(response.data) ? response.data : []).filter((item) => item.approval_status === 'approved' && item.is_active)))
      .catch(() => setTemplates([]));
  }, []);

  const submitCampaign = async (event) => {
    event.preventDefault();
    setSending(true);
    setFeedback(null);
    const contacts = recipientsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const fields = line.split(',').map((field) => field.trim());
      const hasName = fields.length > 1;
      const contact = {
        contactName: hasName ? fields[0] : '',
        contactNo: hasName ? fields[1] : fields[0],
      };
      fields.slice(hasName ? 2 : 1, 15).forEach((value, index) => {
        contact[`attribute${index + 1}`] = value;
      });
      return contact;
    });

    try {
      const response = await API.post('whatsapp/campaigns/send/', { campaignName, templateId, contacts });
      const campaign = response.data?.campaign;
      setFeedback({
        type: 'success',
        text: `${response.data?.detail || 'Campaign accepted.'} ${campaign?.recipientCount ?? contacts.length} recipient(s) recorded.`,
      });
      setRecipientsText('');
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.response?.data?.detail
          || error.response?.data?.contacts
          || error.response?.data?.templateId
          || 'Could not submit the WhatsApp campaign.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '28px', background: '#fff', border: '1px solid #dce7df', borderRadius: '8px' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '26px' }}>WhatsApp Campaign</h1>
          <p style={{ margin: '8px 0 0', color: '#53645a' }}>Send an approved provider template to a list of contacts.</p>
        </header>

        {feedback && (
          <div role={feedback.type === 'error' ? 'alert' : 'status'} style={{ marginBottom: '16px', padding: '11px 13px', borderRadius: '6px', background: feedback.type === 'error' ? '#fff1f0' : '#edf8f0', color: feedback.type === 'error' ? '#a12622' : '#1b6937' }}>
            {feedback.text}
          </div>
        )}

        <form onSubmit={submitCampaign} style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Campaign name <span style={{ fontWeight: 400, color: '#66746a' }}>Optional</span>
            <input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} maxLength={150} style={fieldStyle} />
          </label>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Approved WhatsApp template
            <select required value={templateId} onChange={(event) => setTemplateId(event.target.value)} style={{ ...fieldStyle, background: '#fff' }}>
              <option value="">Select approved template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.category || 'WhatsApp'}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Recipients
            <textarea required value={recipientsText} onChange={(event) => setRecipientsText(event.target.value)} rows={10} placeholder={'919876543210\nTest User, 919876543211'} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }} />
            <span style={{ color: '#66746a', fontSize: '12px', fontWeight: 400 }}>One number per line, or `name,number,attribute1,...,attribute13`. Include the country code; add attribute values in template placeholder order.</span>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={sending} style={{ padding: '11px 18px', border: 0, borderRadius: '5px', background: sending ? '#8ba995' : '#16794a', color: '#fff', fontWeight: 700, cursor: sending ? 'wait' : 'pointer' }}>
              {sending ? 'Submitting...' : 'Send campaign'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Campaigns;