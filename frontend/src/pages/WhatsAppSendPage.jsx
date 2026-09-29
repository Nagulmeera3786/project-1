import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaEnvelope, FaWhatsapp } from 'react-icons/fa';

const WhatsAppSendPage = () => {
  const navigate = useNavigate();
  const dashboardPath = localStorage.getItem('isAdmin') === 'true'
    ? '/admin/whatsapp/dashboard'
    : '/whatsapp/dashboard';
  const requestHref = 'mailto:info@bhisha.com?subject=Request%20for%20WhatsApp%20Business%20Account%20ID&body=Hello%2C%0A%0AI%20would%20like%20to%20request%20a%20WhatsApp%20Business%20Account%20ID%20(WABA%20ID)%20for%20my%20account.%0A%0AName%3A%0ACompany%3A%0AContact%20number%3A%0A';

  return (
    <main style={{ minHeight: '100vh', padding: '36px 20px', background: '#f4f7f5', color: '#17221c' }}>
      <section style={{ maxWidth: '820px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>WhatsApp</h1>
          <p style={{ margin: '8px 0 0', color: '#53645a' }}>Request your WhatsApp Business Account ID or open your dashboard.</p>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <a href={requestHref} style={{ display: 'flex', minHeight: '150px', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', border: '1px solid #d7e3da', borderRadius: '7px', background: '#fff', color: 'inherit', textDecoration: 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#16794a', fontSize: '18px', fontWeight: 700 }}><FaEnvelope /> Request WABA ID</span>
            <span style={{ color: '#53645a', lineHeight: 1.5 }}>Email support with a prefilled request for your WhatsApp Business Account ID.</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#16794a', fontWeight: 700 }}>Contact support <FaArrowRight /></span>
          </a>
          <button type="button" onClick={() => navigate(dashboardPath)} style={{ display: 'flex', minHeight: '150px', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px', border: '1px solid #b8d8c3', borderRadius: '7px', background: '#edf8f0', color: '#17221c', textAlign: 'left', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#16794a', fontSize: '18px', fontWeight: 700 }}><FaWhatsapp /> WhatsApp Dashboard</span>
            <span style={{ color: '#53645a', lineHeight: 1.5 }}>Open your dashboard to send a message or create a campaign.</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#16794a', fontWeight: 700 }}>Open dashboard <FaArrowRight /></span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default WhatsAppSendPage;