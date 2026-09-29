import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { getProfessionalErrorMessage } from '../errorHelpers';
import { FaArrowLeft, FaPlus, FaSave, FaTrash, FaTimes } from 'react-icons/fa';

const emptyDraft = {
  name: '',
  message_content: '',
  sender_id: '',
  sms_type: 'transactional',
  is_active: true,
};

export default function AdminSMSTemplates() {
  const [templates, setTemplates] = useState([]);
  const [senderIds, setSenderIds] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const [templateResponse, credentialResponse] = await Promise.all([
        API.get('sms/templates/'),
        API.get('sms/credentials/'),
      ]);
      setTemplates(Array.isArray(templateResponse.data) ? templateResponse.data : []);
      const fromProvider = Array.isArray(credentialResponse.data?.sender_ids) ? credentialResponse.data.sender_ids : [];
      const preferred = credentialResponse.data?.default_sender_id || '';
      setSenderIds([...new Set([...fromProvider, preferred].map((item) => String(item || '').trim()).filter(Boolean))]);
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not load SMS templates'));
    } finally {
      setLoading(false);
    }
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const editTemplate = (template) => {
    setDraft({
      name: template.name || '',
      message_content: template.message_content || '',
      sender_id: template.sender_id || '',
      sms_type: template.sms_type || 'transactional',
      is_active: Boolean(template.is_active),
    });
    setEditingId(template.id);
    setError('');
    setSuccess('');
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (editingId) {
        await API.patch(`sms/templates/${editingId}/`, draft);
        setSuccess('Template updated');
      } else {
        await API.post('sms/templates/', draft);
        setSuccess('Template created');
      }
      resetDraft();
      await loadTemplates();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not save SMS template'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (template) => {
    setError('');
    setSuccess('');
    try {
      await API.patch(`sms/templates/${template.id}/`, { is_active: !template.is_active });
      setSuccess(template.is_active ? 'Template deactivated' : 'Template activated');
      await loadTemplates();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not update template'));
    }
  };

  const reviewTemplate = async (template, approvalStatus) => {
    const reviewNote = approvalStatus === 'rejected'
      ? window.prompt(`Reason for rejecting "${template.name}"?`, '')
      : '';
    if (reviewNote === null) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await API.patch(`sms/templates/${template.id}/`, {
        approval_status: approvalStatus,
        review_note: reviewNote,
      });
      setSuccess(`Template ${approvalStatus}`);
      await loadTemplates();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not review SMS template'));
    }
  };

  const deleteTemplate = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await API.delete(`sms/templates/${template.id}/`);
      if (editingId === template.id) {
        resetDraft();
      }
      setSuccess('Template deleted');
      await loadTemplates();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Could not delete template'));
    }
  };

  return (
    <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 24px', color: '#1d2939' }}>
      <button type="button" onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '18px', padding: '8px 12px', border: '1px solid #d0d5dd', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>
        <FaArrowLeft /> Dashboard
      </button>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', lineHeight: 1.2 }}>SMS Templates</h1>
          <p style={{ margin: '6px 0 0', color: '#667085' }}>Manage the approved message content and preferred sender ID.</p>
        </div>
        <button type="button" onClick={() => { resetDraft(); setError(''); setSuccess(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 13px', border: 0, borderRadius: '6px', background: '#167d68', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          <FaPlus /> New template
        </button>
      </header>

      {error && <div role="alert" style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #fecdca', borderRadius: '6px', background: '#fef3f2', color: '#b42318' }}>{error}</div>}
      {success && <div role="status" style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #abefc6', borderRadius: '6px', background: '#ecfdf3', color: '#067647' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(300px, 0.8fr)', gap: '24px', alignItems: 'start' }}>
        <section aria-label="Saved SMS templates">
          {loading ? <p>Loading templates...</p> : templates.length === 0 ? (
            <p style={{ padding: '18px 0', color: '#667085' }}>No templates created yet.</p>
          ) : (
            <div style={{ borderTop: '1px solid #e4e7ec' }}>
              {templates.map((template) => (
                <article key={template.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '14px', padding: '15px 2px', borderBottom: '1px solid #e4e7ec' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <strong>{template.name}</strong>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', background: template.approval_status === 'approved' ? '#e7f6f1' : template.approval_status === 'rejected' ? '#fef3f2' : '#fff7e6', color: template.approval_status === 'approved' ? '#167d68' : template.approval_status === 'rejected' ? '#b42318' : '#8a5a00', fontSize: '11px' }}>{(template.approval_status || 'approved').toUpperCase()}</span>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', background: template.is_active ? '#e7f6f1' : '#f2f4f7', color: template.is_active ? '#167d68' : '#667085', fontSize: '11px' }}>{template.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#667085' }}>{template.sms_type} · Sender ID: {template.sender_id || 'Default'}</div>
                    <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px', color: '#344054' }}>{template.message_content}</p>
                    {template.review_note && <p style={{ margin: '6px 0 0', color: '#b42318', fontSize: '12px' }}>Review note: {template.review_note}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                    <button type="button" onClick={() => editTemplate(template)} style={{ padding: '6px 9px', border: '1px solid #d0d5dd', borderRadius: '5px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                    {template.approval_status === 'approved' && <button type="button" onClick={() => toggleActive(template)} style={{ padding: '6px 9px', border: '1px solid #d0d5dd', borderRadius: '5px', background: '#fff', cursor: 'pointer' }}>{template.is_active ? 'Disable' : 'Enable'}</button>}
                    {template.approval_status !== 'approved' && <>
                      <button type="button" onClick={() => reviewTemplate(template, 'approved')} style={{ padding: '6px 9px', border: '1px solid #abefc6', borderRadius: '5px', background: '#ecfdf3', color: '#067647', cursor: 'pointer' }}>Approve</button>
                      <button type="button" onClick={() => reviewTemplate(template, 'rejected')} style={{ padding: '6px 9px', border: '1px solid #fecdca', borderRadius: '5px', background: '#fef3f2', color: '#b42318', cursor: 'pointer' }}>Reject</button>
                    </>}
                    <button type="button" aria-label={`Delete ${template.name}`} title="Delete template" onClick={() => deleteTemplate(template)} style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', border: '1px solid #fecdca', borderRadius: '5px', background: '#fff', color: '#b42318', cursor: 'pointer' }}><FaTrash /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={saveTemplate} style={{ padding: '16px', border: '1px solid #e4e7ec', borderRadius: '6px', background: '#fff' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '17px' }}>{editingId ? 'Edit template' : 'Create template'}</h2>
          <label style={{ display: 'grid', gap: '5px', marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>
            Template name
            <input required maxLength={120} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} style={{ minWidth: 0, padding: '9px 10px', border: '1px solid #d0d5dd', borderRadius: '5px', fontWeight: 400 }} />
          </label>
          <label style={{ display: 'grid', gap: '5px', marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>
            Message content
            <textarea required value={draft.message_content} onChange={(event) => setDraft((current) => ({ ...current, message_content: event.target.value }))} rows={6} style={{ resize: 'vertical', padding: '9px 10px', border: '1px solid #d0d5dd', borderRadius: '5px', font: '14px/1.45 inherit' }} />
          </label>
          <label style={{ display: 'grid', gap: '5px', marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>
            Preferred sender ID
            <input list="sms-template-sender-ids" value={draft.sender_id} onChange={(event) => setDraft((current) => ({ ...current, sender_id: event.target.value }))} placeholder="Use the configured default" style={{ minWidth: 0, padding: '9px 10px', border: '1px solid #d0d5dd', borderRadius: '5px', fontWeight: 400 }} />
            <datalist id="sms-template-sender-ids">{senderIds.map((senderId) => <option key={senderId} value={senderId} />)}</datalist>
          </label>
          <label style={{ display: 'grid', gap: '5px', marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>
            SMS type
            <select value={draft.sms_type} onChange={(event) => setDraft((current) => ({ ...current, sms_type: event.target.value }))} style={{ padding: '9px 10px', border: '1px solid #d0d5dd', borderRadius: '5px', fontWeight: 400 }}>
              <option value="transactional">Transactional</option>
              <option value="promotional">Promotional</option>
              <option value="service">Service</option>
            </select>
          </label>
          {editingId && <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 14px', fontSize: '13px' }}><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.checked }))} />Available for sending</label>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {editingId && <button type="button" onClick={resetDraft} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 11px', border: '1px solid #d0d5dd', borderRadius: '5px', background: '#fff', cursor: 'pointer' }}><FaTimes /> Cancel</button>}
            <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 12px', border: 0, borderRadius: '5px', background: '#167d68', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontWeight: 600 }}><FaSave /> {saving ? 'Saving...' : 'Save template'}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
