import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import VerifyOtp from './components/VerifyOtp';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserProfile from './components/UserProfile';
import AdminUsers from './components/AdminUsers';
import MainPage from './components/MainPage';
import ApiDocsOverview from './components/ApiDocsOverview';

// SMS components
import SMSSend from './components/SMSSend';
import FreeTrialSMS from './components/FreeTrialSMS';
import SMSHistory from './components/SMSHistory';
import AdminSMSDashboard from './components/AdminSMSDashboard';
import AdminSMSCredentials from './components/AdminSMSCredentials';
import AdminNotifications from './components/AdminNotifications';
import UserNotifications from './components/UserNotifications';

// dashboard components imported from the integrated Main_Panel
import DashboardLayout from './dashboard/Layout';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import API from './api';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('dashboardTheme');
    document.body.classList.toggle('dark-theme', storedTheme === 'dark');

    let mounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('access');
      const loggedIn = Boolean(token);

      if (!mounted) {
        return;
      }

      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const response = await API.get('profile/');
        if (mounted) {
          setIsAdmin(Boolean(response.data?.is_primary_admin));
        }
      } catch {
        if (mounted) {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
          setLoading(false);
        }
      }
    };

    checkAuth();

    const handleStorageChange = async (e) => {
      if (e.key === 'authToken' || e.key === 'access' || e.key === 'refresh') {
        checkAuth();
      }
    };

    const handleWindowFocus = async () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  const wrapModule = (moduleName, element) => (
    <RouteErrorBoundary moduleName={moduleName}>{element}</RouteErrorBoundary>
  );

  const privateRoute = (moduleName, element) =>
    wrapModule(moduleName, isLoggedIn ? element : <Navigate to="/login" replace />);

  const adminRoute = (moduleName, element) => {
    if (!isLoggedIn) {
      return wrapModule(moduleName, <Navigate to="/login" replace />);
    }

    if (profileLoading) {
      return wrapModule(moduleName, <div style={{ padding: '20px' }}>Checking admin access...</div>);
    }

    return wrapModule(moduleName, isAdmin ? element : <Navigate to="/dashboard" replace />);
  };

  return (
    <BrowserRouter>
      {!isLoggedIn && (
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '64px',
        background: 'linear-gradient(90deg, #1A0E4E 0%, #2D1B69 60%, #3D2B82 100%)',
        boxShadow: '0 2px 16px rgba(26,14,78,0.45)',
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #7C5DC7, #5B3FA8)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '13px',
          }}>ABC</div>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '17px', letterSpacing: '0.3px' }}>ABC Company</span>
        </Link>

        {/* Nav links — top right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link to="/" style={{
            color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
            padding: '7px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Home</Link>

          {!isLoggedIn ? (
            <>
              <Link to="/signup" style={{
                color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                padding: '7px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >Sign Up</Link>
              <Link to="/login" style={{
                color: 'white', textDecoration: 'none',
                padding: '7px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                background: 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
                boxShadow: '0 2px 10px rgba(91,63,168,0.45)',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >Login</Link>
            </>
          ) : (
            <Link to="/dashboard" style={{
              color: 'white', textDecoration: 'none',
              padding: '7px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
              background: 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
              boxShadow: '0 2px 10px rgba(91,63,168,0.45)',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >Go to Dashboard</Link>
          )}
        </div>
      </nav>
      )}
      {/* Spacer for fixed navbar */}
      {!isLoggedIn && <div style={{ height: '64px' }} />}
      <Routes>
        <Route
          path="/signup"
          element={wrapModule('Signup', isLoggedIn ? <Navigate to="/dashboard" replace /> : <Signup />)}
        />
        <Route
          path="/verify-otp"
          element={wrapModule('Verify OTP', isLoggedIn ? <Navigate to="/dashboard" replace /> : <VerifyOtp />)}
        />
        <Route
          path="/login"
          element={wrapModule('Login', isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />)}
        />
        <Route path="/forgot-password" element={wrapModule('Forgot Password', <ForgotPassword />)} />
        <Route path="/reset-password" element={wrapModule('Reset Password', <ResetPassword />)} />
        <Route path="/profile" element={privateRoute('Profile', <UserProfile />)} />
        <Route path="/api-docs" element={wrapModule('API Docs', <ApiDocsOverview />)} />
        <Route path="/admin/users" element={adminRoute('Admin Users', <AdminUsers />)} />
        <Route path="/dashboard" element={privateRoute('Dashboard', <DashboardLayout page="dashboard" />)} />
        <Route path="/dashboard/recharge" element={privateRoute('Recharge & Payments', <DashboardLayout page="recharge" />)} />
        <Route path="/dashboard/contact-support" element={privateRoute('Contact Support', <DashboardLayout page="contactSupport" />)} />

        {/* SMS Routes */}
        <Route path="/sms/send" element={adminRoute('SMS Send', <SMSSend />)} />
        <Route path="/sms/free-trial" element={privateRoute('Free Trial SMS', <FreeTrialSMS />)} />
        <Route path="/sms/history" element={privateRoute('SMS History', <SMSHistory />)} />
        <Route path="/admin/sms" element={adminRoute('Admin SMS Dashboard', <AdminSMSDashboard />)} />
        <Route
          path="/admin/sms/credentials"
          element={adminRoute('Admin SMS Credentials', <AdminSMSCredentials />)}
        />
        <Route path="/admin/notifications" element={adminRoute('Admin Notifications', <AdminNotifications />)} />
        <Route path="/notifications" element={privateRoute('User Notifications', <UserNotifications />)} />
        
        <Route path="/" element={wrapModule('Home', <MainPage />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


