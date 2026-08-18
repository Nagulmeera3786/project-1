import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSyncAlt, FaChartLine, FaChartBar } from 'react-icons/fa';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import API from '../api';
import { getProfessionalErrorMessage } from '../errorHelpers';

function parseSafeDate(value) {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(value) {
  const date = parseSafeDate(value);
  return date ? date.toLocaleString() : '-';
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function mondayStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekKey(date) {
  return dayKey(mondayStart(date));
}

function formatLabel(key, period) {
  if (period === 'daily') {
    return key.slice(5);
  }
  if (period === 'weekly') {
    return `Wk ${key.slice(5)}`;
  }
  return key;
}

function matchesSearch(item, query, fields) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  return fields.some((field) => String(item?.[field] || '').toLowerCase().includes(normalizedQuery));
}

function inDateRange(item, startDate, endDate) {
  const createdAt = parseSafeDate(item?.created_at);
  if (!createdAt) {
    return false;
  }

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`);
    if (createdAt < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999`);
    if (createdAt > end) {
      return false;
    }
  }

  return true;
}

function buildSingleSeriesTimelineData(items, period, valueKey) {
  const counter = new Map();

  const toBucket = (d) => {
    if (period === 'daily') {
      return dayKey(d);
    }
    if (period === 'weekly') {
      return weekKey(d);
    }
    return monthKey(d);
  };

  items.forEach((item) => {
    const d = parseSafeDate(item.created_at);
    if (!d) {
      return;
    }
    const key = toBucket(d);
    if (!counter.has(key)) {
      counter.set(key, { key, [valueKey]: 0 });
    }
    counter.get(key)[valueKey] += 1;
  });

  return Array.from(counter.values())
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((row) => ({
      ...row,
      label: formatLabel(row.key, period),
    }));
}

function buildTimelineData(smsItems, emailItems, period) {
  const counter = new Map();

  const addPoint = (key, field) => {
    if (!counter.has(key)) {
      counter.set(key, { key, sms: 0, email: 0 });
    }
    counter.get(key)[field] += 1;
  };

  const toBucket = (d) => {
    if (period === 'daily') {
      return dayKey(d);
    }
    if (period === 'weekly') {
      return weekKey(d);
    }
    return monthKey(d);
  };

  smsItems.forEach((item) => {
    const d = parseSafeDate(item.created_at);
    if (d) {
      addPoint(toBucket(d), 'sms');
    }
  });

  emailItems.forEach((item) => {
    const d = parseSafeDate(item.created_at);
    if (d) {
      addPoint(toBucket(d), 'email');
    }
  });

  return Array.from(counter.values())
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((row) => ({
      ...row,
      label: formatLabel(row.key, period),
    }));
}

function downloadCsv(filename, headers, rows) {
  const escapeCell = (value) => {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const csvLines = [headers.map(escapeCell).join(',')]
    .concat(rows.map((row) => row.map(escapeCell).join(',')));

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function downloadExcelCompatible(filename, headers, rows, sheetTitle) {
  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const rowHtml = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  const workbookHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(sheetTitle)}</title>
      </head>
      <body>
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([workbookHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function flattenMailValidationRows(emailHistoryItems) {
  const rows = [];

  emailHistoryItems.forEach((item) => {
    const baseRequestId = String(item?.request_id || '').trim() || 'mail-request';
    const dlrUniqueId = String(item?.dlr_report?.dlr_unique_id || item?.dlr_unique_id || '').trim();
    const requestedEmails = Array.isArray(item?.emails_requested) ? item.emails_requested : [];
    const requestItems = Array.isArray(item?.results_summary?.request_items) ? item.results_summary.request_items : [];
    const resultRows = Array.isArray(item?.results_summary?.results) ? item.results_summary.results : [];

    const requestItemsByEmail = requestItems.reduce((acc, entry) => {
      const normalizedEmail = String(entry?.email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        return acc;
      }

      if (!acc[normalizedEmail]) {
        acc[normalizedEmail] = [];
      }
      acc[normalizedEmail].push(entry);
      return acc;
    }, {});

    const shiftItemForEmail = (email, indexHint = 0) => {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (normalizedEmail && Array.isArray(requestItemsByEmail[normalizedEmail]) && requestItemsByEmail[normalizedEmail].length > 0) {
        return requestItemsByEmail[normalizedEmail].shift();
      }
      if (Array.isArray(requestItems) && requestItems[indexHint]) {
        return requestItems[indexHint];
      }
      return null;
    };

    const sourceLabel = String(item?.source || '').trim().toLowerCase() || '-';
    const statusLabel = String(item?.status || '-').trim().toLowerCase() || '-';
    const totalMailCount = Number(item?.email_count || requestedEmails.length || resultRows.length || 0);
    const isFileValidation = Boolean(String(item?.file_name || '').trim());
    const isBulkOrFile = totalMailCount > 1 || isFileValidation;
    const validationKind = isFileValidation ? 'file' : isBulkOrFile ? 'bulk' : 'single';
    const normalizedDlr = (value) => {
      const text = String(value || '').trim();
      return text ? text.toUpperCase() : 'UNKNOWN';
    };

    if (isBulkOrFile) {
      const validCount = Number(item?.results_summary?.safe_count || 0);
      const invalidCount = Number(item?.results_summary?.unsafe_count || 0);
      rows.push({
        row_key: `${baseRequestId}-parent`,
        request_id: baseRequestId,
        dlr_unique_id: normalizedDlr(dlrUniqueId),
        created_at: item?.created_at,
        validation_timing: item?.completed_at || item?.created_at || null,
        validation_mode: sourceLabel,
        status: statusLabel,
        requested_mail: String(item?.file_name || '').trim() || `${totalMailCount} emails`,
        is_valid: null,
        row_type: 'bulk',
          validation_kind: validationKind,
        valid_count: validCount,
        invalid_count: invalidCount,
        total_count: totalMailCount,
        validation_result: `${validCount} valid, ${invalidCount} not valid`,
      });
      return;
    }

    if (resultRows.length === 0) {
      const pendingRows = requestItems.length > 0 ? requestItems : requestedEmails.map((mail) => ({ email: mail }));
      if (pendingRows.length === 0) {
        return;
      }

      pendingRows.forEach((entry, idx) => {
        const requestedMail = String(entry?.email || requestedEmails[idx] || '').trim().toLowerCase();
        const rowKey = `${baseRequestId}-${idx + 1}`;
        rows.push({
          row_key: rowKey,
          request_id: String(entry?.request_id || '').trim() || baseRequestId,
          dlr_unique_id: normalizedDlr(String(entry?.dlr_unique_id || '').trim() || dlrUniqueId),
          created_at: item?.created_at,
          validation_timing: item?.completed_at || item?.created_at || null,
          validation_mode: sourceLabel,
          status: statusLabel,
          requested_mail: requestedMail || '-',
          is_valid: null,
          row_type: 'mail',
          validation_kind: validationKind,
          valid_count: 0,
          invalid_count: 0,
          total_count: Number(item?.email_count || 0) || 0,
          validation_result: String(item?.status || '').toLowerCase() === 'completed' ? 'summary' : 'pending',
        });
      });
      return;
    }

    resultRows.forEach((result, idx) => {
      const requestedMail = String(result?.email || requestedEmails[idx] || requestedEmails[0] || '').trim().toLowerCase();
      const requestItem = shiftItemForEmail(requestedMail, idx);
      const rowKey = `${baseRequestId}-${idx + 1}`;
      const isValid = (result?.validSyntax ?? result?.valid_syntax) === true
        && (result?.validMailbox ?? result?.valid_mailbox) === true;
      rows.push({
        row_key: rowKey,
        request_id: String(result?.request_id || requestItem?.request_id || '').trim() || baseRequestId,
        dlr_unique_id: normalizedDlr(String(result?.dlr_unique_id || requestItem?.dlr_unique_id || '').trim() || dlrUniqueId),
        created_at: item?.created_at,
        validation_timing: item?.completed_at || item?.created_at || null,
        validation_mode: sourceLabel,
        status: statusLabel,
        requested_mail: requestedMail || '-',
        is_valid: isValid,
        row_type: 'mail',
        validation_kind: validationKind,
        valid_count: isValid ? 1 : 0,
        invalid_count: isValid ? 0 : 1,
        total_count: 1,
        validation_result: isValid ? 'valid' : 'not valid',
      });
    });
  });

  return rows.filter((row) => String(row?.request_id || '').trim() || String(row?.requested_mail || '').trim());
}

export default function Reports() {
  const navigate = useNavigate();
  const [smsHistory, setSmsHistory] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [smsSearch, setSmsSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [smsStatus, setSmsStatus] = useState('all');
  const [emailStatus, setEmailStatus] = useState('all');
  const [emailValidationType, setEmailValidationType] = useState('all');
  const [activeSubmenu, setActiveSubmenu] = useState('sms');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mailPage, setMailPage] = useState(1);
  const [selectedMailRequestId, setSelectedMailRequestId] = useState('');
  const [selectedMailDetails, setSelectedMailDetails] = useState(null);
  const [selectedMailDetailsLoading, setSelectedMailDetailsLoading] = useState(false);
  const [selectedMailDetailsError, setSelectedMailDetailsError] = useState('');
  const [selectedMailDetailsPage, setSelectedMailDetailsPage] = useState(1);
  const [selectedMailDetailsLastUpdated, setSelectedMailDetailsLastUpdated] = useState(null);
  const mailPageSize = 50;
  const mailDetailsPageSize = 500;

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [smsResult, emailResult] = await Promise.allSettled([
        API.get('sms/messages/', { timeout: 90000 }),
        API.get('email-validation/history/', { timeout: 90000 }),
      ]);

      const smsLoaded = smsResult.status === 'fulfilled';
      const emailLoaded = emailResult.status === 'fulfilled';

      setSmsHistory(smsLoaded && Array.isArray(smsResult.value?.data) ? smsResult.value.data : []);

      let loadedEmailHistory = emailLoaded && Array.isArray(emailResult.value?.data)
        ? emailResult.value.data
        : [];
      if (loadedEmailHistory.length > 0) {
        loadedEmailHistory = await Promise.all(loadedEmailHistory.map(async (history) => {
          const isSingleMail = Number(history?.email_count || 0) === 1 && !String(history?.file_name || '').trim();
          if (!isSingleMail) {
            return history;
          }
          try {
            const response = await API.get(`email-validation/history/${history.request_id}/results/`, {
              params: { page: 1, page_size: 1, order: 'oldest' },
              timeout: 90000,
            });
            const row = Array.isArray(response?.data?.rows) ? response.data.rows[0] : null;
            return row ? {
              ...history,
              results_summary: {
                ...(history.results_summary || {}),
                results: [{
                  email: row.email,
                  request_id: row.request_id,
                  status: row.status,
                  statusCode: row.status_code,
                  classification: row.classification,
                  validSyntax: row.valid_syntax,
                  validMailbox: row.valid_mailbox,
                }],
              },
            } : history;
          } catch {
            return history;
          }
        }));
      }
      if (emailSearch.trim() && loadedEmailHistory.length > 0) {
        loadedEmailHistory = await Promise.all(loadedEmailHistory.map(async (history) => {
          const historyId = String(history?.request_id || '').trim();
          if (!historyId) {
            return history;
          }
          try {
            const response = await API.get(`email-validation/history/${historyId}/results/`, {
              params: { page: 1, page_size: 1, order: 'oldest', q: emailSearch.trim() },
              timeout: 90000,
            });
            return { ...history, child_search_match: Number(response?.data?.total || 0) > 0 };
          } catch {
            return history;
          }
        }));
      }
      setEmailHistory(loadedEmailHistory);

      if (!smsLoaded || !emailLoaded) {
        const failures = [];
        if (!smsLoaded) {
          failures.push(`SMS reports: ${getProfessionalErrorMessage(smsResult.reason, 'Failed to load SMS reports')}`);
        }
        if (!emailLoaded) {
          failures.push(`Mail validation reports: ${getProfessionalErrorMessage(emailResult.reason, 'Failed to load mail validation reports')}`);
        }
        setError(failures.join(' | '));
      }
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Failed to load reports data'));
      setSmsHistory([]);
      setEmailHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [emailSearch]);

  const rangedSmsHistory = useMemo(
    () => smsHistory.filter((item) => inDateRange(item, startDate, endDate)),
    [smsHistory, startDate, endDate]
  );

  const rangedEmailHistory = useMemo(
    () => emailHistory.filter((item) => inDateRange(item, startDate, endDate)),
    [emailHistory, startDate, endDate]
  );

  const filteredSmsHistory = useMemo(
    () => rangedSmsHistory.filter((item) => {
      const statusMatch = smsStatus === 'all' || String(item?.status || '').toLowerCase() === smsStatus;
      return statusMatch && matchesSearch(item, smsSearch, ['message_id', 'status', 'recipient_number', 'display_sender_id']);
    }),
    [rangedSmsHistory, smsSearch, smsStatus]
  );

  const allMailResultRows = useMemo(
    () => flattenMailValidationRows(rangedEmailHistory),
    [rangedEmailHistory]
  );

  const filteredMailResultRows = useMemo(
    () => allMailResultRows.filter((row) => {
      const statusMatch = emailStatus === 'all' || String(row?.status || '').toLowerCase() === emailStatus;
      const typeMatch = emailValidationType === 'all' || row?.validation_kind === emailValidationType;
      const rowMatches = matchesSearch(row, emailSearch, ['request_id', 'dlr_unique_id', 'requested_mail', 'status']);
      return statusMatch && typeMatch && (rowMatches || row?.child_search_match === true);
    }),
    [allMailResultRows, emailSearch, emailStatus, emailValidationType]
  );

  useEffect(() => {
    setMailPage(1);
  }, [emailSearch, emailStatus, emailValidationType, startDate, endDate]);

  const totalMailPages = useMemo(() => Math.max(1, Math.ceil(filteredMailResultRows.length / mailPageSize)), [filteredMailResultRows.length]);
  const currentMailPage = Math.min(mailPage, totalMailPages);
  const pagedMailResultRows = useMemo(() => {
    const start = (currentMailPage - 1) * mailPageSize;
    return filteredMailResultRows.slice(start, start + mailPageSize);
  }, [filteredMailResultRows, currentMailPage]);

  const loadMailRequestDetails = async (requestId, page = 1) => {
    const normalizedId = String(requestId || '').trim();
    if (!normalizedId) {
      return;
    }

    setSelectedMailRequestId(normalizedId);
    setSelectedMailDetailsLoading(true);
    setSelectedMailDetailsError('');
    try {
      const response = await API.get(`email-validation/history/${normalizedId}/results/`, {
        params: {
          page,
          page_size: mailDetailsPageSize,
          order: 'latest',
        },
        timeout: 90000,
      });
      setSelectedMailDetails(response?.data || null);
      setSelectedMailDetailsPage(page);
      setSelectedMailDetailsLastUpdated(new Date().toISOString());
    } catch (err) {
      setSelectedMailDetails(null);
      setSelectedMailDetailsError(getProfessionalErrorMessage(err, 'Failed to load request details.'));
    } finally {
      setSelectedMailDetailsLoading(false);
    }
  };


  const chartData = useMemo(
    () => buildTimelineData(rangedSmsHistory, rangedEmailHistory, period),
    [rangedSmsHistory, rangedEmailHistory, period]
  );

  const smsChartData = useMemo(
    () => buildSingleSeriesTimelineData(rangedSmsHistory, period, 'sms'),
    [rangedSmsHistory, period]
  );

  const emailChartData = useMemo(
    () => buildSingleSeriesTimelineData(rangedEmailHistory, period, 'email'),
    [rangedEmailHistory, period]
  );

  const totals = useMemo(() => ({
    sms: filteredSmsHistory.length,
    email: filteredMailResultRows.length,
  }), [filteredSmsHistory.length, filteredMailResultRows.length]);

  const smsStatusOptions = useMemo(() => {
    const values = Array.from(new Set(smsHistory.map((item) => String(item?.status || '').toLowerCase()).filter(Boolean)));
    return ['all', ...values];
  }, [smsHistory]);

  const emailStatusOptions = useMemo(() => {
    const values = Array.from(new Set(emailHistory.map((item) => String(item?.status || '').toLowerCase()).filter(Boolean)));
    return ['all', ...values];
  }, [emailHistory]);

  const smsSummary = useMemo(() => {
    const counts = { total: filteredSmsHistory.length, sent: 0, delivered: 0, failed: 0, pending: 0 };
    filteredSmsHistory.forEach((item) => {
      const status = String(item?.status || '').toLowerCase();
      if (status in counts) {
        counts[status] += 1;
      }
    });
    return counts;
  }, [filteredSmsHistory]);

  const emailSummary = useMemo(() => {
    const validCount = filteredMailResultRows.reduce((count, row) => (row.is_valid === true ? count + 1 : count), 0);
    const invalidCount = filteredMailResultRows.reduce((count, row) => (row.is_valid === false ? count + 1 : count), 0);
    return {
      total: filteredMailResultRows.length,
      valid: validCount,
      invalid: invalidCount,
    };
  }, [filteredMailResultRows]);

  const exportSmsReportCsv = () => {
    downloadCsv(
      'bhisha-sms-report.csv',
      ['Request ID', 'Status', 'Recipient Number', 'Sender ID', 'Created At'],
      filteredSmsHistory.map((item) => [
        item.message_id || '',
        item.status || '',
        item.recipient_number || '',
        item.display_sender_id || '',
        formatDateTime(item.created_at),
      ])
    );
  };

  const exportSmsReportExcel = () => {
    downloadExcelCompatible(
      'bhisha-sms-report.xls',
      ['Request ID', 'Status', 'Recipient Number', 'Sender ID', 'Created At'],
      filteredSmsHistory.map((item) => [
        item.message_id || '',
        item.status || '',
        item.recipient_number || '',
        item.display_sender_id || '',
        formatDateTime(item.created_at),
      ]),
      'SMS Report'
    );
  };

  const exportMailReportCsv = () => {
    downloadCsv(
      'bhisha-mail-validation-report.csv',
      ['Request ID', 'DLR Unique ID', 'Mail/File', 'Type', 'Total', 'Valid', 'Not Valid', 'Result', 'Timing', 'Mode'],
      filteredMailResultRows.map((row) => [
        row.request_id,
        row.dlr_unique_id,
        row.requested_mail,
        row.row_type || '-',
        row.total_count ?? '-',
        row.valid_count ?? '-',
        row.invalid_count ?? '-',
        row.validation_result || (row.is_valid ? 'valid' : 'not valid'),
        formatDateTime(row.validation_timing),
        row.validation_mode,
      ])
    );
  };

  const exportMailReportExcel = () => {
    downloadExcelCompatible(
      'bhisha-mail-validation-report.xls',
      ['Request ID', 'DLR Unique ID', 'Mail/File', 'Type', 'Total', 'Valid', 'Not Valid', 'Result', 'Timing', 'Mode'],
      filteredMailResultRows.map((row) => [
        row.request_id,
        row.dlr_unique_id,
        row.requested_mail,
        row.row_type || '-',
        row.total_count ?? '-',
        row.valid_count ?? '-',
        row.invalid_count ?? '-',
        row.validation_result || (row.is_valid ? 'valid' : 'not valid'),
        formatDateTime(row.validation_timing),
        row.validation_mode,
      ]),
      'Mail Validation Report'
    );
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1320px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          background: '#eef2ff',
          color: '#1e3a8a',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 14px',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        <FaArrowLeft /> Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Reports</h2>
        <button
          onClick={loadReports}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <p style={{ color: '#4b5563', marginTop: '6px' }}>
        Separate report views for SMS and Mail Validation with filtered export.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>Filtered SMS Rows</div>
          <div style={{ color: '#0f172a', fontSize: '26px', fontWeight: 800 }}>{totals.sms}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700 }}>Filtered Mail Validation Rows</div>
          <div style={{ color: '#0f172a', fontSize: '26px', fontWeight: 800 }}>{totals.email}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {['daily', 'weekly', 'monthly'].map((item) => (
          <button
            key={item}
            onClick={() => setPeriod(item)}
            style={{
              border: period === item ? '1px solid #7C5DC7' : '1px solid #d1d5db',
              background: period === item ? '#f5f3ff' : '#fff',
              color: period === item ? '#4c3a92' : '#374151',
              borderRadius: '999px',
              padding: '7px 12px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700, marginBottom: '5px' }}>Start Date</div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700, marginBottom: '5px' }}>End Date</div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
        </div>
        <button
          onClick={() => {
            setStartDate('');
            setEndDate('');
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Clear Dates
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading reports...</div>
      ) : error ? (
        <div style={{ padding: '12px', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 800 }}>
                <FaChartBar /> Overall Usage Bar Graph ({period})
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sms" name="SMS" fill="#2563eb" />
                    <Bar dataKey="email" name="Email" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 800 }}>
                <FaChartLine /> Overall Usage Line Graph ({period})
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sms" name="SMS" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="email" name="Email" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveSubmenu('sms')}
              style={{
                border: activeSubmenu === 'sms' ? '1px solid #7C5DC7' : '1px solid #d1d5db',
                background: activeSubmenu === 'sms' ? '#f5f3ff' : '#fff',
                color: activeSubmenu === 'sms' ? '#4c3a92' : '#374151',
                borderRadius: '999px',
                padding: '8px 12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              SMS Reports
            </button>
            <button
              onClick={() => setActiveSubmenu('mail')}
              style={{
                border: activeSubmenu === 'mail' ? '1px solid #7C5DC7' : '1px solid #d1d5db',
                background: activeSubmenu === 'mail' ? '#f5f3ff' : '#fff',
                color: activeSubmenu === 'mail' ? '#4c3a92' : '#374151',
                borderRadius: '999px',
                padding: '8px 12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mail Validation Reports
            </button>
          </div>

          {activeSubmenu === 'sms' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>SMS Report</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                <select
                  value={smsStatus}
                  onChange={(e) => setSmsStatus(e.target.value)}
                  style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid #d1d5db', minWidth: '150px' }}
                >
                  {smsStatusOptions.map((option) => (
                    <option key={`sms-status-${option}`} value={option}>
                      {option === 'all' ? 'All SMS Statuses' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="search"
                  value={smsSearch}
                  onChange={(e) => setSmsSearch(e.target.value)}
                  placeholder="Search SMS by request ID, status, recipient, sender..."
                  style={{ flex: '1 1 320px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
                <button
                  onClick={exportSmsReportCsv}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Export SMS CSV
                </button>
                <button
                  onClick={exportSmsReportExcel}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Export SMS Excel
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                {[
                  ['Filtered Total', smsSummary.total],
                  ['Sent', smsSummary.sent],
                  ['Delivered', smsSummary.delivered],
                  ['Failed', smsSummary.failed],
                  ['Pending', smsSummary.pending],
                ].map(([label, value]) => (
                  <div key={`sms-summary-${label}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div style={{ width: '100%', height: 260, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', boxSizing: 'border-box' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>SMS Bar Graph</div>
                  <ResponsiveContainer>
                    <BarChart data={smsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="sms" name="SMS" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '100%', height: 260, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', boxSizing: 'border-box' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>SMS Line Graph</div>
                  <ResponsiveContainer>
                    <LineChart data={smsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sms" name="SMS" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ maxHeight: '360px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Request ID</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSmsHistory.map((item) => (
                      <tr key={item.id} style={{ borderTop: '1px solid #eef2f7' }}>
                        <td style={{ padding: '8px' }}>{item.message_id || '-'}</td>
                        <td style={{ padding: '8px' }}>{item.status || '-'}</td>
                        <td style={{ padding: '8px' }}>{formatDateTime(item.created_at)}</td>
                      </tr>
                    ))}
                    {filteredSmsHistory.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: '10px', color: '#64748b' }}>No SMS history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubmenu === 'mail' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Mail Validation Report</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                <select
                  value={emailStatus}
                  onChange={(e) => setEmailStatus(e.target.value)}
                  style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid #d1d5db', minWidth: '170px' }}
                >
                  {emailStatusOptions.map((option) => (
                    <option key={`email-status-${option}`} value={option}>
                      {option === 'all' ? 'All Mail Statuses' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={emailValidationType}
                  onChange={(e) => setEmailValidationType(e.target.value)}
                  aria-label="Mail validation type"
                  style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid #d1d5db', minWidth: '170px' }}
                >
                  <option value="all">All Validation Types</option>
                  <option value="single">Single Mails</option>
                  <option value="bulk">Bulk Mails</option>
                  <option value="file">File Mails</option>
                </select>
                <input
                  type="search"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  placeholder="Search Mail validations by request ID, DLR Unique ID, status, user, file..."
                  style={{ flex: '1 1 320px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
                <button
                  onClick={exportMailReportCsv}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Export Mail CSV
                </button>
                <button
                  onClick={exportMailReportExcel}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Export Mail Excel
                </button>
              </div>

              <div style={{ marginBottom: '10px', fontSize: '12px', color: '#475569' }}>
                Tip: click "View Details" on a request to see individual emails with valid/not valid status.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                {[
                  ['Filtered Total', emailSummary.total],
                  ['Valid', emailSummary.valid],
                  ['Not Valid', emailSummary.invalid],
                ].map(([label, value]) => (
                  <div key={`mail-summary-${label}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div style={{ width: '100%', height: 260, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', boxSizing: 'border-box' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>Mail Validation Bar Graph</div>
                  <ResponsiveContainer>
                    <BarChart data={emailChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="email" name="Email" fill="#7c3aed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '100%', height: 260, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', boxSizing: 'border-box' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>Mail Validation Line Graph</div>
                  <ResponsiveContainer>
                    <LineChart data={emailChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="email" name="Email" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ maxHeight: '420px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Request ID</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>DLR Unique ID</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Mail / File</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Valid</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Not Valid</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Result</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Timing</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Mode</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedMailResultRows.map((row) => (
                      <tr key={row.row_key || `${row.request_id}-${row.requested_mail}`} style={{ borderTop: '1px solid #eef2f7' }}>
                        <td style={{ padding: '8px' }}>{row.request_id}</td>
                        <td style={{ padding: '8px' }}>{row.dlr_unique_id}</td>
                        <td style={{ padding: '8px' }}>{row.requested_mail}</td>
                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>{row.validation_kind === 'file' ? 'File mails' : row.validation_kind === 'bulk' ? 'Bulk mails' : 'Single mail'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{row.total_count ?? '-'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{row.valid_count ?? '-'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{row.invalid_count ?? '-'}</td>
                        <td style={{ padding: '8px' }}>{row.validation_result || (row.is_valid ? 'valid' : 'not valid')}</td>
                        <td style={{ padding: '8px' }}>{formatDateTime(row.validation_timing)}</td>
                        <td style={{ padding: '8px', textTransform: 'lowercase' }}>{row.validation_mode}</td>
                        <td style={{ padding: '8px' }}>
                          {row.row_type === 'bulk' ? (
                            <button
                              type="button"
                              onClick={() => loadMailRequestDetails(row.request_id, 1)}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                            >
                              View Details
                            </button>
                          ) : (
                            <span style={{ color: '#64748b' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {pagedMailResultRows.length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ padding: '10px', color: '#64748b' }}>No mail validation records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredMailResultRows.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Showing {(currentMailPage - 1) * mailPageSize + 1} to {Math.min(currentMailPage * mailPageSize, filteredMailResultRows.length)} of {filteredMailResultRows.length} rows
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setMailPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentMailPage <= 1}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentMailPage <= 1 ? '#f8fafc' : '#fff', cursor: currentMailPage <= 1 ? 'not-allowed' : 'pointer', color: '#1f2937' }}
                    >
                      Prev
                    </button>
                    <div style={{ fontSize: '12px', color: '#1f2937', minWidth: '90px', textAlign: 'center' }}>
                      Page {currentMailPage} / {totalMailPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMailPage((prev) => Math.min(totalMailPages, prev + 1))}
                      disabled={currentMailPage >= totalMailPages}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentMailPage >= totalMailPages ? '#f8fafc' : '#fff', cursor: currentMailPage >= totalMailPages ? 'not-allowed' : 'pointer', color: '#1f2937' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {(selectedMailRequestId || selectedMailDetailsLoading || selectedMailDetailsError || selectedMailDetails) && (
                <div style={{ marginTop: '14px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>
                      Request Details: {selectedMailRequestId || '-'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMailRequestId('');
                        setSelectedMailDetails(null);
                        setSelectedMailDetailsError('');
                        setSelectedMailDetailsPage(1);
                        setSelectedMailDetailsLastUpdated(null);
                      }}
                      style={{ padding: '6px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                    >
                      Close
                    </button>
                  </div>

                  {selectedMailDetailsLoading ? (
                    <div style={{ marginTop: '10px', color: '#334155' }}>Loading request details...</div>
                  ) : selectedMailDetailsError ? (
                    <div style={{ marginTop: '10px', color: '#991b1b' }}>{selectedMailDetailsError}</div>
                  ) : selectedMailDetails && (
                    <>
                      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Status</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>{selectedMailDetails.status || '-'}</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Completed Validations</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>
                            {Number(selectedMailDetails.processed_count || 0)} / {Number(selectedMailDetails.total_count || selectedMailDetails.summary_total || 0)}
                          </div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Progress</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>{Number(selectedMailDetails.progress_percent || 0)}%</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Detail Rows</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>{Number(selectedMailDetails.total || 0)}</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Valid</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>{Number(selectedMailDetails.safe_count || 0)}</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Not Valid</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>{Number(selectedMailDetails.unsafe_count || 0)}</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Summary Total</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>{Number(selectedMailDetails.summary_total || 0)}</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Compacted</div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>{selectedMailDetails.results_compacted ? 'Yes' : 'No'}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '8px', height: '8px', width: '100%', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(0, Math.min(100, Number(selectedMailDetails.progress_percent || 0)))}%`,
                            background: '#2563eb',
                            transition: 'width 0.35s ease',
                          }}
                        />
                      </div>

                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                        {selectedMailDetailsLastUpdated ? `Last updated: ${formatDateTime(selectedMailDetailsLastUpdated)}` : ''}
                      </div>

                      {selectedMailDetails.detail_available ? (
                        <>
                          <div style={{ marginTop: '10px', maxHeight: '300px', overflow: 'auto', border: '1px solid #dbe3ef', borderRadius: '8px', background: '#fff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <th style={{ textAlign: 'left', padding: '7px' }}>Mail Request ID</th>
                                  <th style={{ textAlign: 'left', padding: '7px' }}>Email</th>
                                  <th style={{ textAlign: 'left', padding: '7px' }}>Result</th>
                                  <th style={{ textAlign: 'left', padding: '7px' }}>Status Code</th>
                                  <th style={{ textAlign: 'left', padding: '7px' }}>Classification</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(Array.isArray(selectedMailDetails.rows) ? selectedMailDetails.rows : []).map((item) => (
                                  <tr key={`detail-row-${item.id}`} style={{ borderTop: '1px solid #eef2f7' }}>
                                    <td style={{ padding: '7px' }}>{item.request_id || '-'}</td>
                                    <td style={{ padding: '7px' }}>{item.email || '-'}</td>
                                    <td style={{ padding: '7px' }}>{item.result || '-'}</td>
                                    <td style={{ padding: '7px' }}>{item.status_code || '-'}</td>
                                    <td style={{ padding: '7px' }}>{item.classification || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '12px', color: '#475569' }}>
                              Page {selectedMailDetailsPage} of {Math.max(1, Math.ceil(Number(selectedMailDetails.total || 0) / mailDetailsPageSize))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => loadMailRequestDetails(selectedMailRequestId, Math.max(1, selectedMailDetailsPage - 1))}
                                disabled={selectedMailDetailsPage <= 1}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: selectedMailDetailsPage <= 1 ? '#f1f5f9' : '#fff', cursor: selectedMailDetailsPage <= 1 ? 'not-allowed' : 'pointer' }}
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                onClick={() => loadMailRequestDetails(selectedMailRequestId, selectedMailDetailsPage + 1)}
                                disabled={selectedMailDetailsPage >= Math.max(1, Math.ceil(Number(selectedMailDetails.total || 0) / mailDetailsPageSize))}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: selectedMailDetailsPage >= Math.max(1, Math.ceil(Number(selectedMailDetails.total || 0) / mailDetailsPageSize)) ? '#f1f5f9' : '#fff', cursor: selectedMailDetailsPage >= Math.max(1, Math.ceil(Number(selectedMailDetails.total || 0) / mailDetailsPageSize)) ? 'not-allowed' : 'pointer' }}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ marginTop: '10px', color: '#334155', fontSize: '13px' }}>
                          {selectedMailDetails.message || 'Detailed rows are not available for this request.'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
