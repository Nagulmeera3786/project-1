import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import VerifyOtp from './components/VerifyOtp';
import EmployeeDualOTP from './components/EmployeeDualOTP';
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
import EmailValidation from './components/EmailValidation';
import Reports from './components/Reports';
import ContactSupportPage from './dashboard/ContactSupportPage';
import { FaChevronDown, FaSearch } from 'react-icons/fa';

const landingMenus = [
  {
    key: 'products',
    label: 'Products',
    items: [
      { label: 'SMS Messaging', to: '/#services' },
      { label: 'SMPP Messaging', to: '/#services' },
      { label: 'WhatsApp Messaging', to: '/#services' },
      { label: 'RCS Messaging', to: '/#services' },
      { label: 'Omni Channel Messaging', to: '/#services' },
      { label: 'Mail Validations', to: '/#services' }
    ],
  },
  {
    key: 'solutions',
    label: 'Solutions',
    items: [
      { label: 'Business Segments', to: '/#solutions' },
      { label: 'Industry Verticals', to: '/#solutions' },
      { label: 'Department Use Cases', to: '/#solutions' },
      { label: 'Current and Future Services', to: '/#solutions' },
    ],  
  },
  
  {
    key: 'partnerships',
    label: 'Partnerships',
    items: [
      { label: 'Integrations', to: '/api-docs' },
      { label: 'Reseller Program', to: '/signup' },
      { label: 'Technology Partners', to: '/signup' },
    ],
  },
  {
    key: 'developers',
    label: 'Developers',
    items: [
      { label: 'API Documentation', to: '/api-docs' },
      { label: 'Integration Guides', to: '/api-docs' },
      
    ],
  },
  {
    key: 'about us',
    label: 'About Us',
    items: [
      { label: 'About Bhisha', to: '/' },
      
    ],
  },
  {
    key: 'pricing',
    label: 'Pricing',
    items: [
      { label: 'View plans', to: '/signup' },
      { label: 'Try for free', to: '/signup' },
      { label: 'Talk to sales', to: '/contact-support' },
    ],
  },
];

// dashboard components imported from the integrated Main_Panel
import DashboardLayout from './dashboard/Layout';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import API from './api';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupportUser, setIsSupportUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

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
        setIsSupportUser(false);
        setLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const response = await API.get('profile/');
        if (mounted) {
          setIsAdmin(Boolean(
            response.data?.is_primary_admin ||
            response.data?.is_staff ||
            response.data?.is_superuser
          ));
          setIsSupportUser(Boolean(response.data?.can_view_support_data || response.data?.is_employee));
        }
      } catch {
        if (mounted) {
          setIsAdmin(false);
          setIsSupportUser(false);
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

  const isPublicRoute = !/^\/(dashboard|admin|sms|broadcast|reports|notifications|profile)/.test(window.location.pathname);

  const closeMenu = () => setOpenMenu(null);
  const toggleMenu = (menuKey) => setOpenMenu((current) => (current === menuKey ? null : menuKey));

  const wrapModule = (moduleName, element) => (
    <RouteErrorBoundary moduleName={moduleName}>{element}</RouteErrorBoundary>
  );

  const privateRoute = (moduleName, element) =>
    wrapModule(moduleName, isLoggedIn ? element : <Navigate to="/login" replace />);

  const supportRoute = (moduleName, element) => {
    if (!isLoggedIn) {
      return wrapModule(moduleName, <Navigate to="/login" replace />);
    }

    if (profileLoading) {
      return wrapModule(moduleName, <div style={{ padding: '20px' }}>Checking access...</div>);
    }

    return wrapModule(moduleName, (isAdmin || isSupportUser) ? element : <Navigate to="/dashboard" replace />);
  };

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
      {isPublicRoute && (
      <div className="bhisha-header-shell" onMouseLeave={closeMenu}>
        <div className="bhisha-utility-bar">
          <div className="bhisha-utility-actions">
            <Link to="/signup" className="bhisha-utility-signup" onClick={closeMenu}>
              Sign up
            </Link>
            <Link to="/login" className="bhisha-utility-login" onClick={closeMenu}>
              Login
            </Link>
          </div>
        </div>

        <nav className="bhisha-top-nav">
          <div className="bhisha-top-nav-inner">
            <Link to="/" className="bhisha-brand" onClick={closeMenu}>
              <img
                src="/bhisha-logo.svg"
                alt="Bhisha"
                className="bhisha-brand-logo"
              />
            </Link>

            <div className="bhisha-nav-menus">
              {landingMenus.map((menu) => (
                <div
                  key={menu.key}
                  className="bhisha-nav-item"
                  onMouseEnter={() => setOpenMenu(menu.key)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    className="bhisha-nav-trigger"
                    aria-expanded={openMenu === menu.key}
                    onClick={() => toggleMenu(menu.key)}
                  >
                    <span>{menu.label}</span>
                    <FaChevronDown />
                  </button>

                  <div className={`bhisha-dropdown ${openMenu === menu.key ? 'open' : ''}`}>
                    {menu.items.map((item) => (
                      item.to.startsWith('http') ? (
                        <a key={item.label} href={item.to} className="bhisha-dropdown-link" onClick={closeMenu}>
                          {item.label}
                        </a>
                      ) : (
                        <Link key={item.label} to={item.to} className="bhisha-dropdown-link" onClick={closeMenu}>
                          {item.label}
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bhisha-nav-actions">
              <button type="button" className="bhisha-search-btn" aria-label="Search">
                <FaSearch />
              </button>
              <Link to="/contact-support" className="bhisha-btn bhisha-btn-outline" onClick={closeMenu}>
                Contact us
              </Link>
            </div>
          </div>
        </nav>
      </div>
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
          path="/employee/verify-dual-otp"
          element={wrapModule('Employee Dual OTP', isLoggedIn ? <Navigate to="/dashboard" replace /> : <EmployeeDualOTP />)}
        />
        <Route
          path="/login"
          element={wrapModule('Login', isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />)}
        />
        <Route path="/forgot-password" element={wrapModule('Forgot Password', <ForgotPassword />)} />
        <Route path="/reset-password" element={wrapModule('Reset Password', <ResetPassword />)} />
        <Route path="/profile" element={privateRoute('Profile', <UserProfile />)} />
        <Route path="/api-docs" element={wrapModule('API Docs', <ApiDocsOverview />)} />
        <Route path="/admin/users" element={supportRoute('Support Users', <AdminUsers />)} />
        <Route path="/dashboard" element={privateRoute('Dashboard', <DashboardLayout page="dashboard" />)} />
        <Route path="/dashboard/recharge" element={privateRoute('Recharge & Payments', <DashboardLayout page="recharge" />)} />
        <Route path="/dashboard/contact-support" element={privateRoute('Contact Support', <DashboardLayout page="contactSupport" />)} />

        {/* SMS Routes */}
        <Route path="/sms/send" element={adminRoute('SMS Send', <SMSSend />)} />
        <Route path="/sms/free-trial" element={privateRoute('Free Trial SMS', <FreeTrialSMS />)} />
        <Route path="/sms/history" element={privateRoute('SMS History', <SMSHistory />)} />
        <Route path="/admin/sms" element={supportRoute('Support SMS Dashboard', <AdminSMSDashboard />)} />
        <Route
          path="/admin/sms/credentials"
          element={supportRoute('Support SMS Credentials', <AdminSMSCredentials />)}
        />
        <Route path="/admin/notifications" element={supportRoute('Support Notifications', <AdminNotifications />)} />
        <Route path="/broadcast/email-validation" element={privateRoute('Email Validation', <EmailValidation />)} />
        <Route path="/reports" element={privateRoute('Reports', <Reports />)} />
        <Route path="/notifications" element={privateRoute('User Notifications', <UserNotifications />)} />
        <Route path="/contact-support" element={wrapModule('Contact Support', <ContactSupportPage />)} />
        
        <Route path="/" element={wrapModule('Home', <MainPage />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


