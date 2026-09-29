import React, { useEffect, useState } from 'react';
import API from '../api';

const emptyForm = { name: '', category: '', message_text: '', provider_template_id: '' };

const AdminWhatsAppTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await API.get('whatsapp/templates/');
      setTemplates(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not load WhatsApp templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const saveTemplate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (editingId) {
        await API.patch(`whatsapp/templates/${editingId}/`, form);
        setNotice('Template updated.');
      } else {
        await API.post('whatsapp/templates/', form);
        setNotice('Approved template created.');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadTemplates();
    } catch (requestError) {
      const data = requestError.response?.data;
      setError(data?.detail || data?.provider_template_id || data?.name || 'Could not save WhatsApp template.');
    } finally {
      setSaving(false);
    }
  };

  const reviewTemplate = async (template, approvalStatus) => {
    const reviewNote = approvalStatus === 'rejected'
      ? window.prompt(`Reason for rejecting "${template.name}"?`, '')
      : '';
    if (reviewNote === null) return;
    setError('');
    try {
      await API.patch(`whatsapp/templates/${template.id}/`, { approval_status: approvalStatus, review_note: reviewNote });
      setNotice(`Template ${approvalStatus}.`);
      await loadTemplates();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not review WhatsApp template.');
    }
  };

  const editTemplate = (template) => {
    setForm({
      name: template.name || '',
      category: template.category || '',
      message_text: template.message_text || '',
      provider_template_id: template.provider_template_id || '',
    });
    setEditingId(template.id);
  };

  const deleteTemplate = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    try {
      await API.delete(`whatsapp/templates/${template.id}/`);
      setNotice('Template deleted.');
      await loadTemplates();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not delete WhatsApp template.');
    }
  };

  const inputStyle = { width: '100%', minWidth: 0, padding: '10px', border: '1px solid #bdc9c1', borderRadius: '5px', font: 'inherit', boxSizing: 'border-box' };

  return (
    <main style={{ minHeight: '100vh', padding: '28px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <header style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '27px' }}>WhatsApp Template Review</h1>
          <p style={{ margin: '7px 0 0', color: '#53645a' }}>Create approved templates or review user-submitted templates before they can be selected for sending.</p>
        </header>
        {error && <div role="alert" style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '5px', background: '#fff1f0', color: '#a12622' }}>{error}</div>}
        {notice && <div role="status" style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '5px', background: '#edf8f0', color: '#1b6937' }}>{notice}</div>}

        <section style={{ marginBottom: '22px', padding: '17px', background: '#fff', border: '1px solid #dce7df', borderRadius: '7px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '18px' }}>{editingId ? 'Edit WhatsApp template' : 'Create approved template'}</h2>
          <form onSubmit={saveTemplate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '11px' }}>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>Name<input required maxLength={150} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} style={inputStyle} /></label>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>Category<input maxLength={100} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} style={inputStyle} /></label>
            <label style={{ display: 'grid', gap: '5px', fontSize: '13px', fontWeight: 600 }}>Anantya provider template ID<input required maxLength={100} value={form.provider_template_id} onChange={(event) => setForm((current) => ({ ...current, provider_template_id: event.target.value }))} style={inputStyle} /></label>
            <label style={{ display: 'grid', gridColumn: '1 / -1', gap: '5px', fontSize: '13px', fontWeight: 600 }}>Message preview<textarea value={form.message_text} onChange={(event) => setForm((current) => ({ ...current, message_text: event.target.value }))} rows={4} style={{ ...inputStyle, resize: 'vertical' }} /></label>
            <div style={{ display: 'flex', gridColumn: '1 / -1', justifyContent: 'flex-end', gap: '8px' }}>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} style={{ padding: '9px 12px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff', cursor: 'pointer' }}>Cancel</button>}
              <button type="submit" disabled={saving} style={{ padding: '9px 14px', border: 0, borderRadius: '5px', background: '#16794a', color: '#fff', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create approved template'}</button>
            </div>
          </form>
        </section>

        <section style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: '7px', overflow: 'hidden' }}>
          <div style={{ padding: '15px 17px', borderBottom: '1px solid #e6ede8' }}><h2 style={{ margin: 0, fontSize: '18px' }}>Templates and requests</h2></div>
          {loading ? <p style={{ padding: '16px' }}>Loading templates...</p> : templates.length === 0 ? <p style={{ padding: '16px', color: '#66746a' }}>No WhatsApp templates have been submitted.</p> : templates.map((template) => (
            <article key={template.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '14px', padding: '15px 17px', borderBottom: '1px solid #edf1ee' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>{template.name}</strong>
                  <span style={{ color: template.approval_status === 'approved' ? '#16794a' : template.approval_status === 'rejected' ? '#b42318' : '#8a5a00', fontSize: '11px', fontWeight: 700 }}>{template.approval_status.toUpperCase()}</span>
                  <span style={{ color: '#66746a', fontSize: '12px' }}>by {template.created_by}</span>
                </div>
                <div style={{ marginTop: '5px', color: '#53645a', fontSize: '12px' }}>{template.category || 'WhatsApp'} · Provider ID: {template.provider_template_id || 'Not set'}</div>
                {template.message_text && <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px' }}>{template.message_text}</p>}
                {template.review_note && <p style={{ margin: '6px 0 0', color: '#a12622', fontSize: '12px' }}>Review note: {template.review_note}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => editTemplate(template)} style={{ padding: '6px 9px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                {template.approval_status !== 'approved' && <>
                  <button type="button" onClick={() => reviewTemplate(template, 'approved')} style={{ padding: '6px 9px', border: '1px solid #abefc6', borderRadius: '5px', background: '#ecfdf3', color: '#067647', cursor: 'pointer' }}>Approve</button>
                  <button type="button" onClick={() => reviewTemplate(template, 'rejected')} style={{ padding: '6px 9px', border: '1px solid #fecdca', borderRadius: '5px', background: '#fef3f2', color: '#b42318', cursor: 'pointer' }}>Reject</button>
                </>}
                <button type="button" onClick={() => deleteTemplate(template)} style={{ padding: '6px 9px', border: '1px solid #fecdca', borderRadius: '5px', background: '#fff', color: '#b42318', cursor: 'pointer' }}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default AdminWhatsAppTemplates;