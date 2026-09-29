import React, { useEffect, useState } from 'react';
import API from '../api';

const statusLabel = (status, deliveryStatus) => {
  if (status !== 'accepted') return 'Failed';
  return {
    pending: 'Pending at provider',
    sent: 'Sent by Anantya',
    delivered: 'Delivered',
    seen: 'Seen',
    failed: 'Failed at provider',
  }[deliveryStatus] || 'Accepted by provider';
};

const History = () => {
  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [mode, setMode] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshingMessageId, setRefreshingMessageId] = useState(null);
  const [refreshingCampaignId, setRefreshingCampaignId] = useState(null);
  const [campaignDelivery, setCampaignDelivery] = useState({});

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const [historyResponse, reportResponse] = await Promise.all([
          API.get('whatsapp/history/', { params: { page_size: 100 } }),
          API.get('whatsapp/reports/'),
        ]);
        setMessages(historyResponse.data?.results || []);
        setCampaigns(reportResponse.data?.campaigns || []);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || 'Could not load WhatsApp history.');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filteredMessages = messages.filter((item) => (
    (mode === 'all' || item.mode === mode)
    && (status === 'all' || item.status === status || item.deliveryStatus === status)
  ));

  const refreshMessageStatus = async (message) => {
    setRefreshingMessageId(message.id);
    setError('');
    try {
      const response = await API.get(`whatsapp/messages/${message.id}/status/`);
      setMessages((current) => current.map((item) => (
        item.id === message.id
          ? { ...item, deliveryStatus: response.data?.deliveryStatus || item.deliveryStatus, providerStatusCode: response.data?.providerStatusCode ?? item.providerStatusCode }
          : item
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not refresh message status.');
    } finally {
      setRefreshingMessageId(null);
    }
  };

  const refreshCampaignStatus = async (campaign) => {
    setRefreshingCampaignId(campaign.id);
    setError('');
    try {
      const response = await API.get(`whatsapp/campaigns/${campaign.id}/status/`);
      setCampaignDelivery((current) => ({ ...current, [campaign.id]: response.data?.deliveryCounts || {} }));
      const refreshedRows = response.data?.messages || [];
      setMessages((current) => current.map((message) => {
        const refreshed = refreshedRows.find((item) => item.id === message.id);
        return refreshed
          ? { ...message, deliveryStatus: refreshed.deliveryStatus, error: refreshed.error || message.error }
          : message;
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not refresh campaign status.');
    } finally {
      setRefreshingCampaignId(null);
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '30px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <header style={{ marginBottom: '22px' }}>
          <h1 style={{ margin: 0, fontSize: '27px' }}>WhatsApp History</h1>
          <p style={{ margin: '7px 0 0', color: '#53645a' }}>Submissions recorded by this project. “Provider accepted” does not confirm delivery or read status.</p>
        </header>

        {error && <div role="alert" style={{ marginBottom: '16px', padding: '11px 13px', borderRadius: '6px', background: '#fff1f0', color: '#a12622' }}>{error}</div>}

        <section style={{ marginBottom: '26px', background: '#fff', border: '1px solid #dce7df', borderRadius: '7px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '16px 18px', borderBottom: '1px solid #e6ede8' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Message history</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                Mode
                <select aria-label="Filter by message mode" value={mode} onChange={(event) => setMode(event.target.value)} style={{ padding: '7px 9px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff' }}>
                  <option value="all">All</option>
                  <option value="text">Text</option>
                  <option value="campaign">Campaign</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                Status
                <select aria-label="Filter by message status" value={status} onChange={(event) => setStatus(event.target.value)} style={{ padding: '7px 9px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff' }}>
                  <option value="all">All</option>
                  <option value="accepted">Accepted</option>
                  <option value="failed">Failed</option>
                </select>
              </label>
            </div>
          </div>
          {loading ? <p style={{ padding: '18px' }}>Loading message history...</p> : filteredMessages.length === 0 ? (
            <p style={{ padding: '18px', color: '#66746a' }}>No WhatsApp messages match these filters.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead><tr style={{ background: '#f8faf8', color: '#53645a' }}>
                  {['Date', 'Type', 'Recipient', 'Content', 'Status', ''].map((heading, index) => <th key={`${heading}-${index}`} style={{ padding: '11px 14px', borderBottom: '1px solid #e6ede8', whiteSpace: 'nowrap' }}>{heading}</th>)}
                </tr></thead>
                <tbody>
                  {filteredMessages.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', whiteSpace: 'nowrap' }}>{new Date(item.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{item.mode === 'campaign' ? `Campaign${item.campaignName ? `: ${item.campaignName}` : ''}` : 'Text'}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', whiteSpace: 'nowrap' }}>{item.contactName ? `${item.contactName} · ` : ''}{item.contactNo}</td>
                      <td style={{ maxWidth: '380px', padding: '12px 14px', borderBottom: '1px solid #edf1ee', overflowWrap: 'anywhere' }}>{item.msgText || `Template ${item.templateId}`}{item.error && <div style={{ marginTop: '4px', color: '#a12622' }}>{item.error}</div>}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', whiteSpace: 'nowrap', color: item.status === 'failed' || item.deliveryStatus === 'failed' ? '#a12622' : '#1b6937' }}>{statusLabel(item.status, item.deliveryStatus)}</td>
                      <td style={{ padding: '8px 14px', borderBottom: '1px solid #edf1ee' }}>
                        {item.status === 'accepted' && !['delivered', 'seen', 'failed'].includes(item.deliveryStatus) && (
                          <button type="button" onClick={() => refreshMessageStatus(item)} disabled={refreshingMessageId === item.id} style={{ padding: '6px 9px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff', cursor: refreshingMessageId === item.id ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                            {refreshingMessageId === item.id ? 'Checking...' : 'Refresh status'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {messages.length === 100 && <p style={{ margin: 0, padding: '10px 14px', color: '#66746a', fontSize: '12px' }}>Showing the latest 100 records.</p>}
        </section>

        <section style={{ background: '#fff', border: '1px solid #dce7df', borderRadius: '7px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #e6ede8' }}><h2 style={{ margin: 0, fontSize: '18px' }}>Campaign history</h2></div>
          {loading ? <p style={{ padding: '18px' }}>Loading campaigns...</p> : campaigns.length === 0 ? (
            <p style={{ padding: '18px', color: '#66746a' }}>No WhatsApp campaigns have been submitted.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead><tr style={{ background: '#f8faf8', color: '#53645a' }}>
                  {['Date', 'Campaign', 'Template', 'Recipients', 'Status', 'Delivery totals'].map((heading) => <th key={heading} style={{ padding: '11px 14px', borderBottom: '1px solid #e6ede8', whiteSpace: 'nowrap' }}>{heading}</th>)}
                </tr></thead>
                <tbody>{campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', whiteSpace: 'nowrap' }}>{new Date(campaign.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{campaign.name || `Campaign ${campaign.id}`}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{campaign.templateId}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee' }}>{campaign.recipientCount}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf1ee', color: campaign.status === 'accepted' ? '#1b6937' : '#a12622' }}>{statusLabel(campaign.status)}</td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid #edf1ee' }}>
                      {campaignDelivery[campaign.id] && <div style={{ marginBottom: '5px', color: '#53645a', whiteSpace: 'nowrap' }}>
                        Sent {campaignDelivery[campaign.id].sent || 0} · Delivered {campaignDelivery[campaign.id].delivered || 0} · Seen {campaignDelivery[campaign.id].seen || 0} · Failed {campaignDelivery[campaign.id].failed || 0}
                      </div>}
                      {campaign.status === 'accepted' && <button type="button" onClick={() => refreshCampaignStatus(campaign)} disabled={refreshingCampaignId === campaign.id} style={{ padding: '6px 9px', border: '1px solid #bdc9c1', borderRadius: '5px', background: '#fff', cursor: refreshingCampaignId === campaign.id ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                        {refreshingCampaignId === campaign.id ? 'Checking...' : 'Refresh status'}
                      </button>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default History;