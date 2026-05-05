import { Link } from 'react-router-dom';

export default function MainPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B82 50%, #5B3FA8 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px', textAlign: 'center',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    }}>
      {/* Hero badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
        borderRadius: '100px', padding: '6px 18px', marginBottom: '32px',
        border: '1px solid rgba(255,255,255,0.2)',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#A78BFA', boxShadow: '0 0 8px #A78BFA',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '500' }}>
          Trusted by professionals worldwide
        </span>
      </div>

      {/* Main heading */}
      <h1 style={{
        margin: '0 0 16px', fontSize: 'clamp(32px, 6vw, 62px)',
        fontWeight: '800', color: 'white', lineHeight: 1.15,
        maxWidth: '760px',
      }}>
        Hey, you're at the <span style={{
          background: 'linear-gradient(90deg, #A78BFA, #60A5FA)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>right place</span> 👋
      </h1>

      {/* Subheading */}
      <p style={{
        margin: '0 0 48px', fontSize: 'clamp(15px, 2.5vw, 20px)',
        color: 'rgba(255,255,255,0.72)', lineHeight: 1.65,
        maxWidth: '600px', fontStyle: 'italic',
      }}>
        Join a growing community of professionals collaborating across the globe.
        Communicate smarter, reach further.
      </p>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/signup" style={{
          padding: '14px 36px', borderRadius: '12px',
          background: 'white', color: '#3D2B82',
          fontWeight: '700', fontSize: '15px', textDecoration: 'none',
          boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >Get Started — It's Free</Link>

        <Link to="/dashboard" style={{
          padding: '14px 36px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.3)',
          color: 'white', fontWeight: '600', fontSize: '15px',
          textDecoration: 'none', transition: 'transform 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >Go to Dashboard →</Link>
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        justifyContent: 'center', marginTop: '64px',
      }}>
        {['📨 Bulk SMS', '🔐 Secure Auth', '📊 Analytics', '🌍 Global Reach'].map(feat => (
          <div key={feat} style={{
            background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: '100px',
            padding: '8px 20px', color: 'rgba(255,255,255,0.85)',
            fontSize: '13px', fontWeight: '500',
          }}>{feat}</div>
        ))}
      </div>
    </div>
  );
}

