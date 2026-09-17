import React, { useEffect, useRef, useState, useCallback } from 'react';
import API from '../api';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
const DEFAULT_CHECK_INTERVAL_MS = 5000;

/**
 * Renders nothing visible by default. Watches for user activity and, once the
 * admin-configured idle timeout elapses with no activity, force-logs the user
 * out and shows a pop-up asking them to sign in again.
 */
export default function IdleTimeoutGuard({ isLoggedIn, onForceLogout }) {
  const [expired, setExpired] = useState(false);
  const timeoutMsRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setExpired(false);
      return undefined;
    }

    let mounted = true;

    const loadTimeoutConfig = async () => {
      try {
        const response = await API.get('session-config/');
        const minutes = Number(response?.data?.session_timeout_minutes);
        if (mounted && Number.isFinite(minutes) && minutes > 0) {
          timeoutMsRef.current = minutes * 60 * 1000;
        } else {
          timeoutMsRef.current = 0;
        }
      } catch {
        timeoutMsRef.current = 0;
      }
    };

    loadTimeoutConfig();
    recordActivity();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });

    intervalRef.current = window.setInterval(() => {
      if (!timeoutMsRef.current) {
        return;
      }
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= timeoutMsRef.current) {
        setExpired(true);
      }
    }, DEFAULT_CHECK_INTERVAL_MS);

    return () => {
      mounted = false;
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isLoggedIn, recordActivity]);

  const handleRelogin = () => {
    setExpired(false);
    onForceLogout();
  };

  if (!expired) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '380px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#1a0e4e' }}>Session Timed Out</h3>
        <p style={{ color: '#555' }}>
          You have been logged out automatically due to inactivity. Please log in again to continue.
        </p>
        <button
          onClick={handleRelogin}
          className="btn-purple"
          style={{ padding: '10px 24px', marginTop: '10px' }}
        >
          Log In Again
        </button>
      </div>
    </div>
  );
}
