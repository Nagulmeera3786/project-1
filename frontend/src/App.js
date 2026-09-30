import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
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
import IdleTimeoutGuard from './components/IdleTimeoutGuard';
import API from './api';
import './App.css';

const Signup = lazy(() => import('./components/Signup'));
const VerifyOtp = lazy(() => import('./components/VerifyOtp'));
const Login = lazy(() => import('./components/Login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const AdminUsers = lazy(() => import('./components/AdminUsers'));
const AdminSecuritySettings = lazy(() => import('./components/AdminSecuritySettings'));
const MainPage = lazy(() => import('./components/MainPage'));
const ApiDocsOverview = lazy(() => import('./components/ApiDocsOverview'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const PrivacyNotice = lazy(() => import('./components/PrivacyNotice'));
const TermsOfUse = lazy(() => import('./components/TermsOfUse'));
const BhishaForStartups = lazy(() => import('./components/BhishaForStartups'));
const SMSSend = lazy(() => import('./components/SMSSend'));
const UserSMSSend = lazy(() => import('./components/UserSMSSend'));
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
const WhatsAppSendPage = lazy(() => import('./pages/WhatsAppSendPage'));
const WhatsApp = lazy(() => import('./components/WhatsApp'));
const WhatsAppDashboard = lazy(() => import('./dashboard/WhatsAppDashboard'));
const Inbox = lazy(() => import('./components/WhatsApp_Inbox'));
const TemplateLibrary = lazy(() => import('./components/TemplateLibrary'));
const WhatsAppTemplateLibrary = lazy(() => import('./components/TemplateLibrary'));
const WhatsAppCampaigns = lazy(() => import('./components/WhatsApp_Campaigns'));
const WhatsAppAnalytics = lazy(() => import('./components/WhatsApp_Analytics'));
const WhatsAppHistory = lazy(() => import('./components/WhatsApp_History'));
const WhatsAppSupport = lazy(() => import('./components/WhatsApp_Support'));
const WhatsAppSettings = lazy(() => import('./components/WhatsApp_Settings'));
const AdminWhatsAppDashboard = lazy(() => import('./components/AdminWhatsAppDashboard'));
const AdminWhatsAppAccounts = lazy(() => import('./components/Admin_WhatsApp_WhatsAppAccounts'));
const AdminWhatsAppCustomers = lazy(() => import('./components/Admin_WhatsApp_Customers'));
const AdminWhatsAppMessages = lazy(() => import('./components/Admin_WhatsApp_Messages'));
const AdminWhatsAppCampaigns = lazy(() => import('./components/Admin_WhatsApp_Campaigns'));
const AdminWhatsAppTemplates = lazy(() => import('./components/Admin_WhatsApp_Templates'));
const AdminWhatsAppAutomation = lazy(() => import('./components/Admin_WhatsApp_Automation'));
const AdminWhatsAppSettings = lazy(() => import('./components/Admin_WhatsApp_Settings'));
const AdminWhatsAppReports = lazy(() => import('./components/Admin_WhatsApp_Reports'));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(
  localStorage.getItem('isAdmin') === 'true'
);
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
        localStorage.removeItem('isAdmin');
        setLoading(false);
        return;
      }

      // Render immediately for authenticated users and resolve role flags in background.
      setLoading(false);
      setProfileLoading(true);
      try {
        const response = await API.get('profile/', { timeout: 10000 });
        if (mounted) {
          const adminAccess = Boolean(
            response.data?.is_primary_admin ||
            response.data?.is_staff ||
            response.data?.is_superuser
          );
          setIsAdmin(adminAccess);
          localStorage.setItem('isAdmin', String(adminAccess));
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

  const handleIdleForceLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('isAdmin');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsSupportUser(false);
    window.location.href = '/login';
  };

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
      {isLoggedIn && <IdleTimeoutGuard isLoggedIn={isLoggedIn} onForceLogout={handleIdleForceLogout} />}
      {isPublicRoute && (
      <div className="bhisha-header-shell" onMouseLeave={closeMenu}>
        <div className="bhisha-utility-bar">
          <div className="bhisha-utility-actions">
            <Link to="/signup" className="bhisha-utility-signup" onClick={closeMenu}>
              Sign up
            </Link>
            <Link to="/login" className="bhisha-utility-login" onClick={closeMenu}>
              Sign-in
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
        <Route path="/login" element={wrapModule('Login', isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />)} />
        <Route path="/forgot-password" element={wrapModule('Forgot Password', <ForgotPassword />)} />
        <Route path="/reset-password" element={wrapModule('Reset Password', <ResetPassword />)} />
        <Route path="/profile" element={privateRoute('Profile', <UserProfile />)} />
        <Route path="/api-docs" element={wrapModule('API Docs', <ApiDocsOverview />)} />
        <Route path="/admin/users" element={supportRoute('Support Users', <AdminUsers />)} />
        <Route path="/admin/security-settings" element={adminRoute('Account Security Settings', <AdminSecuritySettings />)} />
        <Route path="/dashboard" element={privateRoute('Dashboard', <DashboardLayout page="dashboard" />)} />
        <Route path="/dashboard/recharge" element={privateRoute('Recharge & Payments', <DashboardLayout page="recharge" />)} />
        <Route path="/dashboard/contact-support" element={privateRoute('Contact Support', <DashboardLayout page="contactSupport" />)} />
        <Route path="/dashboard/sender-id-request" element={privateRoute('Sender ID Request', <SenderIdRequestPage />)} />
        <Route path="/whatsapp/send" element={privateRoute('WhatsApp', <WhatsAppSendPage />)} />
        <Route path="/whatsapp/send-message" element={privateRoute('Send WhatsApp Message', <WhatsApp />)} />
        <Route path="/whatsapp/dashboard" element={privateRoute('WhatsApp Dashboard', <WhatsAppDashboard />)} />
        <Route path="/whatsapp/inbox" element={privateRoute('WhatsApp Inbox', <Inbox />)} />
        <Route path="/whatsapp/templates" element={privateRoute('WhatsApp Templates', <WhatsAppTemplateLibrary channel="whatsapp" />)} />
        <Route path="/whatsapp/campaigns" element={privateRoute('WhatsApp Campaigns', <WhatsAppCampaigns />)} />
        <Route path="/whatsapp/analytics" element={privateRoute('WhatsApp Analytics', <WhatsAppAnalytics />)} />
        <Route path="/whatsapp/history" element={privateRoute('WhatsApp History', <WhatsAppHistory />)} />
        <Route path="/whatsapp/support" element={privateRoute('WhatsApp Support', <WhatsAppSupport />)} />
        <Route path="/whatsapp/settings" element={privateRoute('WhatsApp Settings', <WhatsAppSettings />)} />
        <Route path="/admin/whatsapp/dashboard" element={adminRoute('Admin WhatsApp Dashboard', <AdminWhatsAppDashboard />)} />
        <Route path="/admin/whatsapp/accounts" element={adminRoute('Admin WhatsApp Accounts', <AdminWhatsAppAccounts />)} />
        <Route path="/admin/whatsapp/customers" element={adminRoute('Admin WhatsApp Customers', <AdminWhatsAppCustomers />)} />
        <Route path="/admin/whatsapp/messages" element={adminRoute('Admin WhatsApp Messages', <AdminWhatsAppMessages />)} />
        <Route path="/admin/whatsapp/campaigns" element={adminRoute('Admin WhatsApp Campaigns', <AdminWhatsAppCampaigns />)} />
        <Route path="/admin/whatsapp/templates" element={adminRoute('Admin WhatsApp Templates', <AdminWhatsAppTemplates />)} />
        <Route path="/admin/whatsapp/automation" element={adminRoute('Admin WhatsApp Automation', <AdminWhatsAppAutomation />)} />
        <Route path="/admin/whatsapp/settings" element={adminRoute('Admin WhatsApp Settings', <AdminWhatsAppSettings />)} />
        <Route path="/admin/whatsapp/reports" element={adminRoute('Admin WhatsApp Reports', <AdminWhatsAppReports />)} />

        {/* SMS Routes */}
        <Route path="/sms/send" element={privateRoute('SMS Send', <SMSSend />)} />
        <Route path="/sms/user-send" element={privateRoute('Send SMS', <UserSMSSend />)} />
        <Route path="/sms/free-trial" element={privateRoute('Free Trial SMS', <FreeTrialSMS />)} />
        <Route path="/sms/history" element={privateRoute('SMS History', <SMSHistory />)} />
        <Route path="/sms/templates" element={privateRoute('SMS Templates', <TemplateLibrary channel="sms" />)} />
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


