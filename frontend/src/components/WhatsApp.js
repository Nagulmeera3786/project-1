import React from 'react';
import { useNavigate } from "react-router-dom";

const WhatsApp = ({ isAdmin }) => {
  const navigate = useNavigate();

  const sendWhatsAppMessage = async () => {
    const patientNumber = '+919876543210';
    const message = 'Your appointment is confirmed for tomorrow at 10:00 AM.';

    try {
      const response = await fetch(
        'http://localhost:5000/api/whatsapp/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: patientNumber,
            message,
          }),
        }
      );

      const result = await response.json();
      console.log('WhatsApp message sent:', result);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };

 const handleWhatsAppDashboard = () => {
  const adminStatus = localStorage.getItem("isAdmin") === "true";

  if (adminStatus) {
    navigate("/admin/whatsapp/dashboard");
  } else {
    navigate("/whatsapp/dashboard");
  }
};
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
        padding: '24px'
      }}
    >
      <div
        style={{
          textAlign: 'left',
          maxWidth: '720px',
          padding: '40px 32px',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow:
            '0 12px 32px rgba(15, 23, 42, 0.08)',
        }}
      >

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: '32px',
            marginBottom: '20px',
          }}
        >
          ✓
        </div>

        <h1
          style={{
            margin: '0 0 18px',
            fontSize: '2.35rem',
            color: '#0f172a',
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Welcome to the WhatsApp Automation &amp; Services.
        </h1>

        <p
          style={{
            margin: '0 0 22px',
            fontSize: '1.08rem',
            color: '#475569',
            lineHeight: 1.8,
          }}
        >
          <strong style={{ color: '#0f172a' }}>
            Transform customer experiences with our automated
            WhatsApp Service Module.
          </strong>
          {' '}
          This module bridges the gap between your digital
          infrastructure and your customers' preferred
          communication app. By integrating intelligent AI
          chatbots alongside comprehensive online service tools,
          the module allows you to handle inquiries, process
          transactions, and resolve support requests completely
          within WhatsApp. It eliminates traditional
          communication friction, boosts conversion rates, and
          reduces your operational costs through automated,
          real-time engagement.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '18px',
          }}
        >

          {/* FACEBOOK BUTTON - URL UNCHANGED */}
          <button
            type="button"
            onClick={() => {
              window.open(
                'https://business.facebook.com/business/loginpage/?next=https%3A%2F%2Fbusiness.facebook.com%2Fsettings%2Fsecurity',
                '_blank',
                'noopener,noreferrer'
              );
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '1.05rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow:
                '0 8px 20px rgba(22, 163, 74, 0.26)',
              flex: '1 1 320px',
            }}
          >
            Let&apos;s Start, Facebook Business Account Verification
            <span aria-hidden="true"></span>
          </button>

          {/* WHATSAPP DASHBOARD BUTTON */}
          <button
            type="button"
            onClick={handleWhatsAppDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '1.05rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow:
                '0 8px 20px rgba(22, 163, 74, 0.26)',
              flex: '1 1 220px',
            }}
          >
            WhatsApp Dashboard
            <span aria-hidden="true"></span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default WhatsApp;