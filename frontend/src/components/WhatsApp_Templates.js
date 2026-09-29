import React from 'react';

const templates = [
  {
    id: 1,
    name: 'Welcome Message',
    category: 'Greeting',
    status: 'Active',
    text: 'Hi {{first_name}}, welcome to Bhisha! We are happy to help you with your WhatsApp messaging needs.',
  },
  {
    id: 2,
    name: 'Product Follow-up',
    category: 'Sales',
    status: 'Active',
    text: 'Hello {{first_name}}, we hope you are doing well. Would you like a quick demo of our product?',
  },
  {
    id: 3,
    name: 'Appointment Reminder',
    category: 'Support',
    status: 'Draft',
    text: 'Hi {{first_name}}, this is a reminder for your scheduled appointment tomorrow at 10:00 AM.',
  },
];

const Templates = () => {
  return (
    <div style={{
      padding: '32px',
      background: '#f5f7fb',
      minHeight: '100vh',
      fontFamily: 'Inter, Arial, sans-serif',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ margin: 0, color: '#10b981', fontWeight: 700, letterSpacing: '0.04em' }}></p>
            <h1 style={{ margin: '8px 0 0', fontSize: '32px', color: '#111827' }}>Templates</h1>
          </div>

          <button
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 18px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.2)',
            }}
          >
            + New Template
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
                border: '1px solid #edf2f7',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#111827', fontSize: '20px' }}>{template.name}</h3>
                <span
                  style={{
                    background: template.status === 'Active' ? '#dffdf4' : '#fef3c7',
                    color: template.status === 'Active' ? '#047857' : '#b45309',
                    borderRadius: '999px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {template.status}
                </span>
              </div>

              <div style={{ marginBottom: '12px', color: '#6b7280', fontSize: '13px' }}>
                <strong>Category:</strong> {template.category}
              </div>

              <div style={{
                background: '#f9fafb',
                borderRadius: '10px',
                padding: '14px',
                color: '#374151',
                lineHeight: 1.6,
                border: '1px solid #edf2f7',
                minHeight: '110px',
              }}>
                {template.text}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                color: '#6b7280',
                fontSize: '12px',
              }}>
            
                <button style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#2563eb',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Templates;
