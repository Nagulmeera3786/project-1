import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { getProfessionalErrorMessage } from '../errorHelpers';
import { FaArrowLeft, FaPaperPlane, FaFileUpload, FaInfoCircle } from 'react-icons/fa';

const primaryUseCaseOptions = [
  { value: 'otp', label: 'OTP' },
  { value: 'two_factor_authentication', label: 'Two-Factor authentication' },
  { value: 'transactional_notifications', label: 'Transactional Notifications' },
  { value: 'critical_alerts', label: 'Critical alerts' },
  { value: 'customer_service', label: 'Customer service' },
  { value: 'marketing_promotions', label: 'Marketing promotions' },
];

const industryOptions = [
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'government', label: 'Government' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

const destinationCountryOptions = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Other'];

const emptyForm = {
  full_name: '',
  email: '',
  contact_number: '',
  required_sender_id: '',
  destination_country: 'India',
  primary_use_case: 'otp',
  company_name: '',
  industry_sector_type: 'other',
  company_website: '',
  message_content: '',
  company_documentation: null,
};

const statusStyles = {
  progress: { background: '#fff3e0', color: '#ef6c00' },
  completed: { background: '#e8f5e9', color: '#2e7d32' },
  rejected: { background: '#ffebee', color: '#c62828' },
};

function formatRequestStatus(status) {
  return String(status || 'progress').replace(/_/g, ' ');
}

function validateSenderIdInput(value) {
  const senderId = String(value || '').trim();
  if (!senderId) {
    return 'Required sender ID is required';
  }

  if (/^\d+$/.test(senderId)) {
    if (senderId.length < 10 || senderId.length > 15) {
      return 'Numeric sender ID length must be between 10 and 15 digits';
    }
    return '';
  }

  if (!/^[a-zA-Z0-9]+$/.test(senderId)) {
    return 'Alphanumeric sender ID must use only letters and numbers';
  }

  if (senderId.length < 3 || senderId.length > 11) {
    return 'Alphanumeric sender ID length must be between 3 and 11 characters';
  }

  return '';
}

export default function SenderIdRequestPage({ embedded = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await API.get('sms/sender-id-requests/');
      setRequests(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Failed to load your sender ID requests'));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedUseCase = useMemo(
    () => primaryUseCaseOptions.find((item) => item.value === form.primary_use_case),
    [form.primary_use_case]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const senderIdError = validateSenderIdInput(form.required_sender_id);
    if (senderIdError) {
      setError(senderIdError);
      setSubmitting(false);
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        payload.append(key, value);
      }
    });

    try {
      await API.post('sms/sender-id-requests/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Your sender ID request was submitted successfully.');
      setForm(emptyForm);
      await fetchRequests();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Unable to submit sender ID request'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={embedded ? 'dashboard-shell' : ''} style={{ padding: embedded ? '0' : '24px' }}>
      {!embedded && (
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        <section style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #0ea5e9 100%)', color: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 18px 40px rgba(15,23,42,0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FaPaperPlane />
            <span style={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '12px' }}>Sender ID Request</span>
          </div>
          <h2 style={{ margin: '0 0 8px' }}>Request a sender identity for business messaging</h2>
          <p style={{ margin: 0, maxWidth: '860px', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>
            Submit your business details, required sender ID, documentation, and use case. Admins can review the request and update its status as it progresses.
          </p>
        </section>

        <section style={{ backgroundColor: 'white', borderRadius: '18px', padding: '20px', boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
          {error && <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '10px', background: '#ffebee', color: '#c62828' }}>{error}</div>}
          {success && <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '10px', background: '#e8f5e9', color: '#2e7d32' }}>{success}</div>}

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {[
                ['full_name', 'Name', 'text'],
                ['email', 'Email', 'email'],
                ['contact_number', 'Contact number', 'tel'],
                ['company_name', 'Company name', 'text'],
                ['company_website', 'Company website', 'url'],
              ].map(([field, label, type]) => (
                <label key={field} style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{label}</span>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    required
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                  />
                </label>
              ))}

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>Required sender ID</span>
                <input
                  type="text"
                  value={form.required_sender_id}
                  onChange={(e) => updateField('required_sender_id', e.target.value)}
                  required
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                />
                <small style={{ color: '#475569' }}>
                  Alphanumeric: 3-11 characters. Numeric only: 10-15 digits.
                </small>
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>Destination country</span>
                <select value={form.destination_country} onChange={(e) => updateField('destination_country', e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  {destinationCountryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>Primary use case</span>
                <select value={form.primary_use_case} onChange={(e) => updateField('primary_use_case', e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  {primaryUseCaseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>Industry / sector type</span>
                <select value={form.industry_sector_type} onChange={(e) => updateField('industry_sector_type', e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  {industryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>Required message content</span>
                <textarea
                  value={form.message_content}
                  onChange={(e) => updateField('message_content', e.target.value)}
                  required
                  rows={5}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#111827', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><FaFileUpload /> Company documentation</span>
                <input
                  type="file"
                  onChange={(e) => updateField('company_documentation', e.target.files?.[0] || null)}
                  required
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}
                />
              </label>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaInfoCircle />
                <span>
                  Use case: {selectedUseCase?.label || '-'} | Status starts as In progress.
                </span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px 18px',
                  borderRadius: '999px',
                  border: 'none',
                  background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
                  color: 'white',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 12px 24px rgba(29,78,216,0.22)',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </form>
        </section>

        <section style={{ backgroundColor: 'white', borderRadius: '18px', padding: '20px', boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
            <h3 style={{ margin: 0 }}>Your requests</h3>
            <button type="button" onClick={fetchRequests} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Refresh</button>
          </div>

          {loading ? (
            <div style={{ color: '#64748b' }}>Loading your requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ color: '#64748b' }}>No requests submitted yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {requests.map((requestItem) => {
                const badgeStyle = statusStyles[requestItem.status] || statusStyles.progress;
                return (
                  <div key={requestItem.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <strong>{requestItem.required_sender_id}</strong>
                      <span style={{ padding: '5px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: badgeStyle.background, color: badgeStyle.color }}>
                        {formatRequestStatus(requestItem.status_label || requestItem.status)}
                      </span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '14px' }}>{requestItem.company_name} · {requestItem.destination_country} · {requestItem.primary_use_case}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>{requestItem.message_content}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}