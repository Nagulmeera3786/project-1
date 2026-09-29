import React, { useEffect, useState } from 'react';
import API from '../api';

const emptyForm = { name: '', category: '', message: '', senderId: '', providerTemplateId: '' };

const TemplateLibrary = ({ channel }) => {
  const isSms = channel === 'sms';
  const apiPath = isSms ? 'sms/templates/' : 'whatsapp/templates/';
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await API.get(apiPath);
      setTemplates(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not load templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [apiPath]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = isSms
      ? {
        name: form.name,
        message_content: form.message,
        sender_id: form.senderId,
        sms_type: form.category || 'transactional',
      }
      : {
        name: form.name,
        category: form.category,
        message_text: form.message,
        provider_template_id: form.providerTemplateId,
      };
    try {
      await API.post(apiPath, payload);
      setForm(emptyForm);
      setNotice('Template request sent to an administrator for review.');
      await loadTemplates();
    } catch (requestError) {
      const data = requestError.response?.data;
      setError(data?.detail || data?.provider_template_id || data?.name || data?.message_text || data?.message_content || 'Could not submit the template request.');
    } finally {
      setSaving(false);
    }
  };

  const available = templates.filter((item) => item.approval_status === 'approved' && item.is_active);
  const requests = templates.filter((item) => item.approval_status !== 'approved' || !item.is_active);
  const palette = isSms ? { accent: '#167d68', pale: '#e7f6f1' } : { accent: '#16794a', pale: '#edf8f0' };

  return (
    <main style={{ minHeight: '100vh', padding: '30px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ marginBottom: '22px' }}>
          <h1 style={{ margin: 0, fontSize: '27px' }}>{isSms ? 'SMS Templates' : 'WhatsApp Templates'}</h1>
          <p style={{ margin: '7px 0 0', color: '#53645a' }}>Approved templates can be selected when sending. New and edited templates require administrator approval.</p>
        </header>

        {error && <div role="alert" style={{ marginBottom: '14px', padding: '11px 13px', borderRadius: '6px', background: '#fff1f0', color: '#a12622' }}>{error}</div>}
        {notice && <div role="status" style={{ marginBottom: '14px', padding: '11px 13px', borderRadius: '6px', background: palette.pale, color: palette.accent }}>{notice}</div>}

        <section style={{ marginBottom: '22px', padding: '18px', background: '#fff', border: '1px solid #dce7df', borderRadius: '7px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Request a template</h2>
          <form onSubmit={submitRequest} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
              Name
              <input required maxLength={isSms ? 120 : 150} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} style={{ padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
            </label>
            {isSms ? (
              <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
                SMS type
                <select value={form.category || 'transactional'} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} style={{ padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff' }}>
                  <option value="transactional">Transactional</option><option value="promotional">Promotional</option><option value="service">Service</option>
                </select>
              </label>
            ) : (
              <>
                <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
                  Category
                  <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} maxLength={100} style={{ padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
                  Provider template ID <span style={{ fontWeight: 400, color: '#66746a' }}>Optional</span>
                  <input value={form.providerTemplateId} onChange={(event) => setForm((current) => ({ ...current, providerTemplateId: event.target.value }))} maxLength={100} style={{ padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
                </label>
              </>
            )}
            <label style={{ display: 'grid', gap: '5px', gridColumn: '1 / -1', fontSize: '13px', fontWeight: 600 }}>
              {isSms ? 'Message content' : 'Message preview'}
              <textarea required value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows={4} style={{ minWidth: 0, resize: 'vertical', padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
            </label>
            {isSms && (
              <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
                Sender ID <span style={{ fontWeight: 400, color: '#66746a' }}>Optional</span>
                <input value={form.senderId} onChange={(event) => setForm((current) => ({ ...current, senderId: event.target.value }))} maxLength={50} style={{ padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit' }} />
              </label>
            )}
            <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ padding: '10px 15px', border: 0, borderRadius: '5px', background: palette.accent, color: '#fff', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Submitting...' : 'Submit for approval'}</button>
            </div>
          </form>
        </section>

        <section style={{ marginBottom: '22px', background: '#fff', border: '1px solid #dce7df', borderRadius: '7px', overflow: 'hidden' }}>
          <div style={{ padding: '15px 18px', borderBottom: '1px solid #e6ede8' }}><h2 style={{ margin: 0, fontSize: '18px' }}>Approved and available</h2></div>
          {loading ? <p style={{ padding: '16px' }}>Loading templates...</p> : available.length === 0 ? <p style={{ padding: '16px', color: '#66746a' }}>No approved templates are available yet.</p> : (
            <div>{available.map((template) => (
              <article key={template.id} style={{ padding: '14px 18px', borderBottom: '1px solid #edf1ee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <strong>{template.name}</strong><span style={{ color: palette.accent, fontSize: '12px', fontWeight: 700 }}>APPROVED</span>
                </div>
                <div style={{ marginTop: '5px', color: '#53645a', fontSize: '12px' }}>{isSms ? `${template.sms_type} · ${template.sender_id || 'Default sender ID'}` : `${template.category || 'WhatsApp'} · Provider ID ${template.provider_template_id}`}</div>
                <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px' }}>{isSms ? template.message_content : template.message_text}</p>
              </article>
            ))}</div>
          )}
        </section>

        <section style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: '7px', overflow: 'hidden' }}>
          <div style={{ padding: '15px 18px', borderBottom: '1px solid #e6ede8' }}><h2 style={{ margin: 0, fontSize: '18px' }}>Your requests</h2></div>
          {loading ? <p style={{ padding: '16px' }}>Loading requests...</p> : requests.length === 0 ? <p style={{ padding: '16px', color: '#66746a' }}>You have no pending or rejected requests.</p> : (
            <div>{requests.map((template) => (
              <article key={template.id} style={{ padding: '14px 18px', borderBottom: '1px solid #edf1ee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <strong>{template.name}</strong><span style={{ color: template.approval_status === 'rejected' ? '#a12622' : '#8a5a00', fontSize: '12px', fontWeight: 700 }}>{template.approval_status.toUpperCase()}</span>
                </div>
                <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px' }}>{isSms ? template.message_content : template.message_text}</p>
                {template.review_note && <p style={{ margin: '7px 0 0', color: '#a12622', fontSize: '12px' }}>Admin note: {template.review_note}</p>}
              </article>
            ))}</div>
          )}
        </section>
      </div>
    </main>
  );
};

export default TemplateLibrary;