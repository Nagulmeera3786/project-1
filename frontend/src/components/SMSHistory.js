import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaHistory, FaArrowLeft, FaRedo } from 'react-icons/fa';

export default function SMSHistory() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterTransport, setFilterTransport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await API.get('sms/messages/');
      setMessages(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load messages');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      sent: '#2196f3',
      delivered: '#4caf50',
      failed: '#f44336',
    };
    return colors[status] || '#999';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      pending: '#fff3e0',
      sent: '#e3f2fd',
      delivered: '#e8f5e9',
      failed: '#ffebee',
    };
    return colors[status] || '#f5f5f5';
  };

  const filteredMessages = messages.filter((msg) => {
    const statusMatch = filterStatus === 'all' || msg.status === filterStatus;
    const methodMatch = filterMethod === 'all' || msg.send_mode === filterMethod;
    const transportValue = (msg.transport || 'api').toLowerCase();
    const transportMatch = filterTransport === 'all' || transportValue === filterTransport;

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return statusMatch && methodMatch && transportMatch;
    }

    const searchableText = [
      msg.display_sender_id,
      msg.sender_username,
      msg.recipient_number,
      msg.recipient_username,
      msg.message_content,
      msg.message_id,
      msg.status,
      msg.send_mode,
      msg.transport,
      msg.sms_type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return statusMatch && methodMatch && transportMatch && searchableText.includes(normalizedQuery);
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '40px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          borderRadius: '8px',
        }}
      >
        <p>{error}</p>
        <button
          onClick={() => fetchMessages()}
          style={{
            marginTop: '10px',
            padding: '8px 15px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ margin: 0, color: '#111827' }}>
          <FaHistory style={{ marginRight: '10px' }} />
          SMS Message History
        </h2>
        <button
          onClick={fetchMessages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 15px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <FaRedo /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          <option value="all">All Methods</option>
          <option value="single">Single</option>
          <option value="file_numbers">File Numbers</option>
          <option value="personalized_file">Personalized File</option>
          <option value="group">Group</option>
          <option value="free_trial">Free Trial</option>
        </select>

        <select
          value={filterTransport}
          onChange={(e) => setFilterTransport(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          <option value="all">All Channels</option>
          <option value="api">API</option>
          <option value="smpp">SMPP</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by message, recipient, sender, ID..."
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            minWidth: '280px',
            flex: '1 1 280px',
          }}
        />
      </div>

      {filteredMessages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          No messages found
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  From
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  To
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  Message
                </th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                  Status
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  Method
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  Channel
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  Message ID
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  Sent Date
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  Delivery Time
                </th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                  Failure Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => (
                <tr
                  key={msg.id}
                  style={{
                    borderBottom: '1px solid #eee',
                    backgroundColor: getStatusBgColor(msg.status),
                    transition: 'background-color 0.3s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#f0f7ff')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = getStatusBgColor(
                      msg.status
                    ))
                  }
                >
                  <td style={{ padding: '15px' }}>
                    <strong>{msg.display_sender_id}</strong>
                    <br />
                    <small style={{ color: '#999' }}>
                      by {msg.sender_username}
                    </small>
                  </td>
                  <td style={{ padding: '15px' }}>
                    {msg.recipient_number || msg.recipient_username || '-'}
                  </td>
                  <td
                    style={{
                      padding: '15px',
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={msg.message_content}
                  >
                    {msg.message_content}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: getStatusColor(msg.status),
                        backgroundColor: getStatusBgColor(msg.status),
                        border: `1px solid ${getStatusColor(msg.status)}`,
                      }}
                    >
                      {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontSize: '12px', color: '#444' }}>
                    {(msg.send_mode || 'single').replace('_', ' ')}
                  </td>
                  <td style={{ padding: '15px', fontSize: '12px', color: '#444' }}>
                    {((msg.transport || 'api').toUpperCase() === 'WHATSAPP') ? 'WhatsApp' : (msg.transport || 'api').toUpperCase()}
                  </td>
                  <td style={{ padding: '15px', fontSize: '12px', color: '#666' }}>
                    {msg.message_id || '-'}
                  </td>
                  <td style={{ padding: '15px', fontSize: '12px', color: '#666' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '15px', fontSize: '12px', color: '#666' }}>
                    {msg.delivery_time ? new Date(msg.delivery_time).toLocaleString() : '-'}
                  </td>
                  <td
                    style={{
                      padding: '15px',
                      fontSize: '12px',
                      color: msg.status === 'failed' ? '#b71c1c' : '#666',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={msg.failure_reason || '-'}
                  >
                    {msg.status === 'failed' ? (msg.failure_reason || 'Unknown failure') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
        <p>
          Total: <strong>{filteredMessages.length}</strong> messages
        </p>
      </div>
    </div>
  );
}
