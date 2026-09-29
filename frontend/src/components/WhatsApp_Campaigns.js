import React, { useState } from 'react';

const Campaigns = () => {
  const [campaignType, setCampaignType] = useState('single');
  const [sendMode, setSendMode] = useState('upload');
  const [scheduleType, setScheduleType] = useState('instant');

  const formBoxStyle = {
    background: '#f7f7f7',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '18px 18px',
    marginBottom: '18px',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 700,
    fontSize: '15px',
    color: '#111827',
    marginBottom: '10px',
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid #d9dde3',
    background: '#fff',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '14px',
    color: '#111827',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      padding: '32px 20px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '18px' }}>
          <h1 style={{ margin: 0, fontSize: '36px', color: '#111827' }}>Campaigns</h1>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #ececec', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            <div style={formBoxStyle}>
              <label style={labelStyle}>Campaign Name *</label>
              <input
                type="text"
                placeholder="Enter campaign name"
                style={inputStyle}
              />
            </div>

            <div style={formBoxStyle}>
              <label style={labelStyle}>Campaign Type</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { key: 'single', label: 'Single' },
                  { key: 'bulk', label: 'Bulk' },
                  { key: 'template', label: 'Template' },
                ].map((type) => (
                  <label
                    key={type.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      border: campaignType === type.key ? '1px solid #3b82f6' : '1px solid #d9dde3',
                      borderRadius: '10px',
                      background: campaignType === type.key ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                      flex: '1 1 120px',
                      minWidth: '110px',
                    }}
                  >
                    <input
                      type="radio"
                      name="campaignType"
                      checked={campaignType === type.key}
                      onChange={() => setCampaignType(type.key)}
                      style={{ accentColor: '#3b82f6' }}
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...formBoxStyle, marginBottom: '20px' }}>
            <label style={labelStyle}>Recipients *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                { key: 'upload', label: 'Upload Excel' },
                { key: 'group', label: 'Select Group' },
                { key: 'manual', label: 'Manual Numbers' },
              ].map((mode) => (
                <label
                  key={mode.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 16px',
                    border: sendMode === mode.key ? '1px solid #3b82f6' : '1px solid #d9dde3',
                    borderRadius: '12px',
                    background: sendMode === mode.key ? '#f8fbff' : '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#1f2937',
                  }}
                >
                  <input
                    type="radio"
                    name="recipientType"
                    checked={sendMode === mode.key}
                    onChange={() => setSendMode(mode.key)}
                    style={{ accentColor: '#3b82f6' }}
                  />
                  {mode.label}
                </label>
              ))}
            </div>

            <div style={{ marginTop: '16px' }}>
              {sendMode === 'upload' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{
                      padding: '12px 18px',
                      border: '1px solid #d9dde3',
                      borderRadius: '10px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Upload File
                  </button>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Excel / CSV supported</span>
                </div>
              )}

              {sendMode === 'group' && (
                <select style={{ ...inputStyle, maxWidth: '420px' }} defaultValue="">
                  <option value="" disabled>Select group from phonebook</option>
                  <option>New Leads</option>
                  <option>Customers</option>
                  <option>Hot Leads</option>
                </select>
              )}

              {sendMode === 'manual' && (
                <textarea
                  rows={4}
                  placeholder="Enter numbers separated by commas or new lines"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '110px' }}
                />
              )}
            </div>
          </div>

          <div style={{ ...formBoxStyle, marginBottom: '20px' }}>
            <label style={labelStyle}>Message Content *</label>
            <textarea
              rows={8}
              placeholder="Enter your message"
              style={{ ...inputStyle, resize: 'vertical', minHeight: '140px' }}
            />
            <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '13px' }}>
              Character count: 0 | no. of messages: 0/10
            </div>
          </div>

          <div style={{ ...formBoxStyle, marginBottom: '20px' }}>
            <label style={labelStyle}>Template</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
              <select style={inputStyle} defaultValue="">
                <option value="" disabled>Select template</option>
                <option>Welcome Message</option>
                <option>Offer Broadcast</option>
                <option>Follow Up</option>
              </select>
              <button
                type="button"
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Use Template
              </button>
            </div>
          </div>

          <div style={{ ...formBoxStyle, marginBottom: '20px' }}>
            <label style={labelStyle}>Send Time *</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { key: 'instant', label: 'Instant' },
                { key: 'schedule', label: 'Schedule' },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: scheduleType === item.key ? '#e0f2fe' : '#fff',
                    border: scheduleType === item.key ? '1px solid #38bdf8' : '1px solid #d9dde3',
                    cursor: 'pointer',
                    minWidth: '130px',
                  }}
                >
                  <input
                    type="radio"
                    name="sendTime"
                    checked={scheduleType === item.key}
                    onChange={() => setScheduleType(item.key)}
                    style={{ accentColor: '#0ea5e9' }}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {scheduleType === 'schedule' && (
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <input type="date" style={inputStyle} />
                <input type="time" style={inputStyle} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              style={{
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(34, 197, 94, 0.25)',
              }}
            >
              Save Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
