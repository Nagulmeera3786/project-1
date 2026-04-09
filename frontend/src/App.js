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
        <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
          <Link to="/" style={{ marginRight: 10 }}>Home</Link>
          <Link to="/signup" style={{ marginRight: 10 }}>Sign up</Link>
          <Link to="/login" style={{ marginRight: 10 }}>Login</Link>
        </nav>
      )}
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
        <Route path="/admin/users" element={adminRoute('Admin Users', <AdminUsers />)} />
        <Route path="/dashboard" element={privateRoute('Dashboard', <DashboardLayout />)} />
        
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


