import React, { useEffect, useState } from 'react';
import API from '../api';

const numberFormat = new Intl.NumberFormat();

const Analytics = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await API.get('whatsapp/reports/');
        setReport(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || 'Could not load WhatsApp reports.');
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  const summary = report?.summary || {};
  const metrics = [
    { label: 'Message submissions', value: summary.totalMessages },
    { label: 'Accepted by provider', value: summary.acceptedMessages },
    { label: 'Failed submissions', value: summary.failedMessages },
    { label: 'Campaign submissions', value: summary.totalCampaigns },
  ];

  return (
    <main style={{ minHeight: '100vh', padding: '30px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <header style={{ marginBottom: '22px' }}>
          <h1 style={{ margin: 0, fontSize: '27px' }}>WhatsApp Reports</h1>
          <p style={{ margin: '7px 0 0', color: '#53645a' }}>Submission activity and provider acceptance. Delivery and read receipts are not available from the configured API examples.</p>
        </header>

        {error && <div role="alert" style={{ marginBottom: '16px', padding: '11px 13px', borderRadius: '6px', background: '#fff1f0', color: '#a12622' }}>{error}</div>}
        {loading ? <p>Loading WhatsApp report...</p> : report && (
          <>
            <section aria-label="WhatsApp message totals" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '22px' }}>
              {metrics.map((metric) => (
                <article key={metric.label} style={{ padding: '17px', background: '#fff', border: '1px solid #dce7df', borderRadius: '7px' }}>
                  <div style={{ color: '#53645a', fontSize: '13px' }}>{metric.label}</div>
                  <strong style={{ display: 'block', marginTop: '8px', fontSize: '27px' }}>{numberFormat.format(metric.value || 0)}</strong>
                </article>
              ))}
            </section>

            <section style={{ marginBottom: '22px', background: '#fff', border: '1px solid #dce7df', borderRadius: '7px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #e6ede8' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Daily submissions · last 30 days</h2>
              </div>
              {(report.daily || []).length === 0 ? <p style={{ padding: '18px', color: '#66746a' }}>No submissions recorded in the last 30 days.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead><tr style={{ background: '#f8faf8', color: '#53645a' }}>
                      {['Date', 'Submissions', 'Provider accepted', 'Failed'].map((heading) => <th key={heading} style={{ padding: '11px 14px', borderBottom: '1px solid #e6ede8' }}>{heading}</th>)}
                    </tr></thead>
                    <tbody>{report.daily.map((day) => (
                      <tr key={day.date}>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{new Date(`${day.date}T00:00:00`).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{numberFormat.format(day.total)}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', color: '#1b6937' }}>{numberFormat.format(day.accepted)}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', color: '#a12622' }}>{numberFormat.format(day.failed)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: '7px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #e6ede8' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Campaign outcomes</h2>
              </div>
              {(report.campaigns || []).length === 0 ? <p style={{ padding: '18px', color: '#66746a' }}>No campaigns submitted yet.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead><tr style={{ background: '#f8faf8', color: '#53645a' }}>
                      {['Date', 'Campaign', 'Template ID', 'Recipients', 'Outcome'].map((heading) => <th key={heading} style={{ padding: '11px 14px', borderBottom: '1px solid #e6ede8', whiteSpace: 'nowrap' }}>{heading}</th>)}
                    </tr></thead>
                    <tbody>{report.campaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', whiteSpace: 'nowrap' }}>{new Date(campaign.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{campaign.name || `Campaign ${campaign.id}`}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{campaign.templateId}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{numberFormat.format(campaign.recipientCount)}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', color: campaign.status === 'accepted' ? '#1b6937' : '#a12622' }}>{campaign.status === 'accepted' ? 'Provider accepted' : 'Failed'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Analytics;