import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
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

import RouteErrorBoundary from './components/RouteErrorBoundary';
import API from './api';
import './App.css';

const Signup = lazy(() => import('./components/Signup'));
const VerifyOtp = lazy(() => import('./components/VerifyOtp'));
const Login = lazy(() => import('./components/Login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const AdminUsers = lazy(() => import('./components/AdminUsers'));
const MainPage = lazy(() => import('./components/MainPage'));
const ApiDocsOverview = lazy(() => import('./components/ApiDocsOverview'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const PrivacyNotice = lazy(() => import('./components/PrivacyNotice'));
const TermsOfUse = lazy(() => import('./components/TermsOfUse'));
const BhishaForStartups = lazy(() => import('./components/BhishaForStartups'));
const SMSSend = lazy(() => import('./components/SMSSend'));
const FreeTrialSMS = lazy(() => import('./components/FreeTrialSMS'));
const SMSHistory = lazy(() => import('./components/SMSHistory'));
const AdminSMSDashboard = lazy(() => import('./components/AdminSMSDashboard'));
const AdminSMSCredentials = lazy(() => import('./components/AdminSMSCredentials'));
const AdminNotifications = lazy(() => import('./components/AdminNotifications'));
const UserNotifications = lazy(() => import('./components/UserNotifications'));
const EmailValidation = lazy(() => import('./components/EmailValidation'));
const Reports = lazy(() => import('./components/Reports'));
const ContactSupportPage = lazy(() => import('./dashboard/ContactSupportPage'));
const SenderIdRequestPage = lazy(() => import('./dashboard/SenderIdRequestPage'));
const DashboardLayout = lazy(() => import('./dashboard/Layout'));

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

      // Render immediately for authenticated users and resolve role flags in background.
      setLoading(false);
      setProfileLoading(true);
      try {
        const response = await API.get('profile/', { timeout: 10000 });
        if (mounted) {
          setIsAdmin(Boolean(
            response.data?.is_primary_admin ||
            response.data?.is_staff ||
            response.data?.is_superuser
          ));
          setIsSupportUser(Boolean(response.data?.can_view_support_data || response.data?.is_employee));
        }
      } catch {
        // Keep existing access flags on transient profile check failures
        // to avoid unexpected route redirects while interacting with forms.
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    checkAuth();

    const handleStorageChange = async (e) => {
      if (e.key === 'authToken' || e.key === 'access' || e.key === 'refresh') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  const isPublicRoute = !/^\/(dashboard|admin|sms|broadcast|reports|notifications|profile)/.test(window.location.pathname);

  const closeMenu = () => setOpenMenu(null);
  const toggleMenu = (menuKey) => setOpenMenu((current) => (current === menuKey ? null : menuKey));

  const wrapModule = (moduleName, element) => (
    <RouteErrorBoundary moduleName={moduleName}>
      <Suspense fallback={<div style={{ padding: '20px' }}>Loading module...</div>}>
        {element}
      </Suspense>
    </RouteErrorBoundary>
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
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
              <span className="bhisha-search-btn bhisha-search-label" aria-hidden="true">
                <FaSearch />
              </span>
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
        <Route path="/dashboard/sender-id-request" element={privateRoute('Sender ID Request', <SenderIdRequestPage />)} />

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
        <Route path="/terms-and-conditions" element={wrapModule('Terms and Conditions', <TermsAndConditions />)} />
        <Route path="/privacy-notice" element={wrapModule('Privacy Notice', <PrivacyNotice />)} />
        <Route path="/terms-of-use" element={wrapModule('Terms of Use', <TermsOfUse />)} />
        <Route path="/bhisha-for-startups" element={wrapModule('Bhisha for Startups', <BhishaForStartups />)} />
        
        <Route path="/" element={wrapModule('Home', <MainPage />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


