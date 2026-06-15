import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaArrowLeft, FaUpload, FaEnvelopeOpenText, FaListUl } from 'react-icons/fa';

export default function EmailValidation() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('single');
  const [singleEmail, setSingleEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [sourceFile, setSourceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [lastFileName, setLastFileName] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  const runValidation = async (event) => {
    event.preventDefault();
    setError('');
    setResults([]);
    setLastFileName('');

    if (mode === 'single' && !singleEmail.trim()) {
      setError('Please enter an email address.');
      return;
    }
    if (mode === 'bulk' && !bulkEmails.trim()) {
      setError('Please enter bulk emails.');
      return;
    }
    if (mode === 'file' && !sourceFile) {
      setError('Please upload a file to validate.');
      return;
    }

    setLoading(true);
    try {
      let response;

      if (mode === 'file') {
        const formData = new FormData();
        formData.append('source_file', sourceFile);
        response = await API.post('email-validation/validate/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload = {};
        if (mode === 'single') {
          payload.email = singleEmail.trim();
        } else if (mode === 'bulk') {
          payload.emails = bulkEmails.trim();
        }
        response = await API.post('email-validation/validate/', payload);
      }

      setResults(Array.isArray(response.data?.results) ? response.data.results : []);
      setLastFileName(response.data?.source_file_name || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Email validation failed.');
    } finally {
      setLoading(false);
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

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum allowed size is 10MB.');
      return;
    }

    setError('');
    setSourceFile(file);
  };

  const toggleDetails = (itemKey) => {
    setExpandedItems((current) => ({
      ...current,
      [itemKey]: !current[itemKey],
    }));
  };

  const getReportSection = (reportText, sectionName) => {
    const text = String(reportText || '');
    const marker = `${sectionName}\n`;
    const startIndex = text.indexOf(marker);
    if (startIndex < 0) {
      return '';
    }

    const remainder = text.slice(startIndex + marker.length);
    const nextSectionMatch = remainder.match(/\n\n[A-Z][^\n]+\n/);
    const sectionText = nextSectionMatch ? remainder.slice(0, nextSectionMatch.index) : remainder;
    return sectionText.trim();
  };

  const getHighlightItems = (item) => {
    const reportText = String(item.report || '');
    return [
      {
        label: 'Syntax Validation',
        value: item.validSyntax ? 'Valid' : 'Invalid',
        tone: item.validSyntax ? 'success' : 'danger',
        detail: getReportSection(reportText, 'Syntax validation'),
      },
      {
        label: 'Role Account',
        value: item.roleBased ? 'Role account' : 'Not role account',
        tone: item.roleBased ? 'warning' : 'success',
        detail: getReportSection(reportText, 'Role account validation'),
      },
      {
        label: 'Free Email Provider',
        value: getReportSection(reportText, 'Free email provider check') || 'See overview',
        tone: 'info',
        detail: getReportSection(reportText, 'Free email provider check'),
      },
      {
        label: 'DNS Records',
        value: getReportSection(reportText, 'DNS records validation') || 'See overview',
        tone: 'info',
        detail: getReportSection(reportText, 'DNS records validation'),
      },
      {
        label: 'Honeypot',
        value: getReportSection(reportText, 'Honeypot detection') || 'See overview',
        tone: 'info',
        detail: getReportSection(reportText, 'Honeypot detection'),
      },
      {
        label: 'Parked / Inactive',
        value: getReportSection(reportText, 'Parked / inactive mail exchanger detection') || 'See overview',
        tone: 'info',
        detail: getReportSection(reportText, 'Parked / inactive mail exchanger detection'),
      },
      {
        label: 'Disposable Email',
        value: item.disposable ? 'Disposable' : 'Not disposable',
        tone: item.disposable ? 'danger' : 'success',
        detail: getReportSection(reportText, 'Disposable email address (DEA) validation'),
      },
      {
        label: 'SMTP',
        value: getReportSection(reportText, 'SMTP server validation') || 'See overview',
        tone: 'info',
        detail: getReportSection(reportText, 'SMTP server validation'),
      },
      {
        label: 'Mailbox Validation',
        value: item.validMailbox ? 'Mailbox valid' : 'Mailbox invalid',
        tone: item.validMailbox ? 'success' : 'danger',
        detail: getReportSection(reportText, 'Mailbox validation'),
      },
      {
        label: 'Catch All',
        value: item.catchAll ? 'Catch-all' : 'Not catch-all',
        tone: item.catchAll ? 'warning' : 'success',
        detail: getReportSection(reportText, 'Catch-all mail exchanger validation'),
      },
    ];
  };

  const getSimpleStatus = (item) => {
    const classification = String(item.classification || '').trim().toLowerCase();
    const statusCode = String(item.statusCode || '').trim().toLowerCase();

    if (item.disposable || statusCode === 'domainiswellknowndea') {
      return { label: 'Disposable', tone: 'danger' };
    }

    if (item.risky || classification === 'risky' || classification === 'unknown') {
      return { label: 'Risky', tone: 'warning' };
    }

    if (classification === 'deliverable') {
      return { label: 'Deliverable', tone: 'success' };
    }

    if (classification === 'invalid' || classification === 'undeliverable') {
      return { label: 'Not deliverable', tone: 'danger' };
    }

    if (item.validMailbox) {
      return { label: 'Deliverable', tone: 'success' };
    }

    return { label: 'Not deliverable', tone: 'danger' };
  };

  const toneStyles = {
    success: { background: '#dcfce7', color: '#166534', borderColor: '#86efac' },
    danger: { background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' },
    warning: { background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' },
    info: { background: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' },
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1180px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
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

      <h2 style={{ color: '#111827', marginBottom: '8px' }}>Email Validation</h2>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '20px' }}>
        Validate email addresses and review the returned validation fields.
      </p>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px' }}>
          {error}
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
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Upload File (.xlsv, .csv, .txt, .xls, .xlsx)</label>
            <input type="file" onChange={handleFileChange} accept=".xlsv,.csv,.txt,.xls,.xlsx" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>{sourceFile ? `Selected: ${sourceFile.name}` : 'Maximum file size: 10MB'}</small>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: '14px', padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Validating...' : 'Validate Emails'}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          {lastFileName && (
            <div style={{ marginBottom: '10px', color: '#475569', fontSize: '13px' }}>
              Source file: <strong>{lastFileName}</strong>
            </div>
          )}

          {results.map((item, index) => (
            <div key={`${item.email}-${index}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{item.email}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.classification || 'Deliverable'} | {item.statusCode || 'Success'}</div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 800,
                    border: `1px solid ${toneStyles[getSimpleStatus(item).tone]?.borderColor || toneStyles.info.borderColor}`,
                    background: toneStyles[getSimpleStatus(item).tone]?.background || toneStyles.info.background,
                    color: toneStyles[getSimpleStatus(item).tone]?.color || toneStyles.info.color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getSimpleStatus(item).label}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {getHighlightItems(item).map((highlight) => {
                  const tone = toneStyles[highlight.tone] || toneStyles.info;
                  return (
                    <div key={highlight.label} style={{ background: tone.background, color: tone.color, border: `1px solid ${tone.borderColor}`, borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '6px' }}>{highlight.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.5 }}>{highlight.value}</div>
                      {highlight.detail && highlight.detail !== highlight.value && (
                        <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.5, opacity: 0.92 }}>{highlight.detail}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => toggleDetails(`${item.email}-${index}`)}
                style={{
                  marginBottom: '12px',
                  background: '#f8fafc',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {expandedItems[`${item.email}-${index}`] ? 'Hide Detailed Overview' : 'Detailed Overview'}
              </button>

              {expandedItems[`${item.email}-${index}`] && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.6, color: '#1f2937' }}>{item.summary}</pre>
                  <div style={{ height: '12px' }} />
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.6, color: '#1f2937' }}>{item.report}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
