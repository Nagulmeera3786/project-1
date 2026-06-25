import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FaWhatsapp, FaSms, FaFileAlt, FaEnvelope, FaWallet, FaCheckCircle, FaBell, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../App.css";

const COLORS = ["#0EA5E9", "#F59E0B", "#10B981"];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const [showServiceSearch, setShowServiceSearch] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const navigate = useNavigate();
  const isAdmin = Boolean(user?.is_staff);
  const isSupportUser = Boolean(user?.can_view_support_data || user?.is_employee) && !isAdmin;
  const serviceSearchTerm = serviceSearchQuery.trim().toLowerCase();

  const formatNumeric = (value) => {
    const parsed = Number(value || 0);
    if (Number.isNaN(parsed)) {
      return "0";
    }
    return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2);
  };

  const usageChartData = useMemo(() => {
    if (!user) {
      return [
        { name: "Wallet Balance", value: 0 },
        { name: "Messages Used", value: 0 },
        { name: "Messages Available", value: 0 },
      ];
    }

    return [
      { name: "Wallet Balance", value: Number(user.wallet_balance || 0) },
      { name: "Messages Used", value: Number(user.sms_used_messages || 0) },
      { name: "Messages Available", value: Number(user.sms_available_messages || 0) },
    ];
  }, [user]);

  const profileInsights = useMemo(() => {
    if (!user) {
      return [
        { key: 'Used', value: 0 },
        { key: 'Available', value: 0 },
        { key: 'Trial Number', value: 0 },
      ];
    }

    return [
      { key: 'Used', value: Number(user.sms_used_messages || 0) },
      { key: 'Available', value: Number(user.sms_available_messages || 0) },
      { key: 'Trial Number', value: Number(user.free_trial_verified_numbers_count || 0) },
    ];
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await API.get('profile/');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading dashboard...</div>;
  }

  const supportServiceCards = [
    { label: 'User Directory', desc: 'View user details, wallet balances, and activity counts.', action: () => navigate('/admin/users') },
    { label: 'Reports', desc: 'Inspect SMS and email validation histories with usage charts.', action: () => navigate('/reports') },
    { label: 'API Keys', desc: 'See which keys exist, who created them, and when they were used.', action: () => navigate('/broadcast/email-validation?tab=keys') },
    { label: 'Wallet & Credits', desc: 'Check message balance and provider credits for admin-capable accounts.', action: () => navigate('/broadcast/email-validation') },
    { label: 'Internal Notifications', desc: 'Read internal notices and history.', action: () => navigate('/admin/notifications') },
  ].filter((card) => {
    if (!serviceSearchTerm) {
      return true;
    }
    return `${card.label} ${card.desc}`.toLowerCase().includes(serviceSearchTerm);
  });

  const generalServiceCards = [
    { key: 'whatsapp', label: 'WhatsApp', desc: 'Reach customers with fast, branded WhatsApp conversations and campaign delivery.', action: () => navigate('/dashboard/contact-support') },
    { key: 'sms', label: isAdmin ? 'SMS Console' : 'Your SMS Console', desc: isAdmin ? 'Create campaigns, manage delivery, and monitor SMS performance from one place.' : 'Use your own verified number and account data to send and track your SMS.', action: () => navigate(isAdmin ? '/sms/send' : '/sms/free-trial') },
    { key: 'dlt', label: 'DLT Configuration', desc: 'Manage sender registration, templates, and delivery compliance settings.', action: () => navigate('/admin/sms/credentials') },
    { key: 'notify', label: 'Send Notifications', desc: 'Internal communication module with audience filters, preview, and dedicated history.', action: () => navigate('/admin/notifications') },
  ].filter((card) => {
    if (!serviceSearchTerm) {
      return true;
    }
    return `${card.label} ${card.desc}`.toLowerCase().includes(serviceSearchTerm);
  });

  const serviceKeywords = (() => {
    const staticKeywords = [
      'sms', 'whatsapp', 'rcs', 'email validation', 'api keys', 'history',
      'wallet', 'credits', 'notifications', 'users', 'dashboard', 'support',
      'send', 'delivery', 'dlt', 'settings', 'profile', 'reports'
    ];

    const collected = new Set(staticKeywords.map((item) => item.toLowerCase()));
    [...supportServiceCards, ...generalServiceCards].forEach((card) => {
      `${card.label} ${card.desc}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token && token.length > 1)
        .forEach((token) => collected.add(token));
    });

    return Array.from(collected).sort();
  })();

  const serviceSuggestions = serviceSearchTerm
    ? serviceKeywords.filter((keyword) => keyword.includes(serviceSearchTerm)).slice(0, 12)
    : [];

  if (isSupportUser) {
    return (
      <div className="dashboard-container dashboard-shell" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)' }}>
        <section style={{ marginBottom: '18px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #4338ca 100%)',
            color: 'white',
            borderRadius: '20px',
            padding: '26px',
            boxShadow: '0 18px 50px rgba(15,23,42,0.18)',
          }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.8 }}>Support Console</div>
            <h1 style={{ margin: '8px 0 6px', fontSize: '28px' }}>Employee workspace</h1>
            <p style={{ margin: 0, maxWidth: '860px', lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>
              View users, balances, API keys, and validation history. Editing and admin changes stay restricted to administrators.
            </p>
          </div>
        </section>

        <section className="performance-section dashboard-fade-in" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Service Finder</h3>
            <button
              type="button"
              onClick={() => setShowServiceSearch((prev) => !prev)}
              aria-label="Toggle service search"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '999px',
                border: '1px solid #cbd5e1',
                background: showServiceSearch ? '#dbeafe' : '#fff',
                color: '#1d4ed8',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
              }}
            >
              <FaSearch />
            </button>
          </div>
          {showServiceSearch && (
            <div style={{ marginTop: '12px' }}>
              <input
                type="search"
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                placeholder="Search services in the application"
                style={{ width: '100%', maxWidth: '480px', padding: '11px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
              />
              {serviceSuggestions.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {serviceSuggestions.map((item) => (
                    <button
                      key={`main-suggestion-${item}`}
                      type="button"
                      onClick={() => setServiceSearchQuery(item)}
                      style={{
                        border: '1px solid #bfdbfe',
                        borderRadius: '999px',
                        padding: '4px 10px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="metrics-section dashboard-fade-in">
          <div className="stat-cards-row" style={{ marginBottom: 0 }}>
            <div className="stat-card stat-card-1 dashboard-fade-in">
              <div className="stat-card-icon"><FaWallet /></div>
              <div className="stat-card-info">
                <div className="stat-card-label">Wallet Balance</div>
                <div className="stat-card-value">{user ? formatNumeric(user.wallet_balance) : '—'}</div>
              </div>
            </div>
            <div className="stat-card stat-card-2 dashboard-fade-in dashboard-delay-1">
              <div className="stat-card-icon"><FaEnvelope /></div>
              <div className="stat-card-info">
                <div className="stat-card-label">Messages Used</div>
                <div className="stat-card-value">{user ? formatNumeric(user.sms_used_messages) : '—'}</div>
              </div>
            </div>
            <div className="stat-card stat-card-3 dashboard-fade-in dashboard-delay-2">
              <div className="stat-card-icon"><FaCheckCircle /></div>
              <div className="stat-card-info">
                <div className="stat-card-label">Messages Available</div>
                <div className="stat-card-value">{user ? formatNumeric(user.sms_available_messages) : '—'}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-row">
          <div className="performance-section dashboard-fade-in dashboard-delay-1">
            <h3>Support Access</h3>
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {supportServiceCards.map((card) => (
                <button
                  key={card.label}
                  onClick={card.action}
                  style={{
                    textAlign: 'left',
                    border: '1px solid #dbeafe',
                    borderRadius: '16px',
                    padding: '16px',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                    cursor: 'pointer',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{card.label}</div>
                  <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.5 }}>{card.desc}</div>
                </button>
              ))}
              {serviceSearchTerm && supportServiceCards.length === 0 && (
                <div style={{ color: '#64748b' }}>No matching services found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-row" style={{ marginTop: '20px' }}>
          <div className="performance-section dashboard-fade-in dashboard-delay-2">
            <h3>Support Notes</h3>
            <div style={{ display: 'grid', gap: '10px', color: '#334155', fontSize: '14px', lineHeight: 1.7 }}>
              <div>• Employees can work with support tools directly from this workspace.</div>
              <div>• API keys are shown with creator and usage history in the key management page.</div>
              <div>• Admin-capable accounts see provider credits in the wallet panel when available.</div>
              <div>• If you need to investigate a user issue, start from the user directory, then open their validation history or SMS history.</div>
            </div>
          </div>

          <div className="performance-section dashboard-fade-in dashboard-delay-3">
            <h3>Quick Status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={profileInsights} margin={{ top: 16, right: 12, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="key" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#4338ca" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container dashboard-shell">

      <section className="performance-section dashboard-fade-in" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Service Finder</h3>
          <button
            type="button"
            onClick={() => setShowServiceSearch((prev) => !prev)}
            aria-label="Toggle service search"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              background: showServiceSearch ? '#dbeafe' : '#fff',
              color: '#1d4ed8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
            }}
          >
            <FaSearch />
          </button>
        </div>
        {showServiceSearch && (
          <div style={{ marginTop: '12px' }}>
            <input
              type="search"
              value={serviceSearchQuery}
              onChange={(e) => setServiceSearchQuery(e.target.value)}
              placeholder="Search services in the application"
              style={{ width: '100%', maxWidth: '480px', padding: '11px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
            />
            {serviceSuggestions.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {serviceSuggestions.map((item) => (
                  <button
                    key={`support-suggestion-${item}`}
                    type="button"
                    onClick={() => setServiceSearchQuery(item)}
                    style={{
                      border: '1px solid #bfdbfe',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="metrics-section dashboard-fade-in">
        <div className="stat-cards-row" style={{ marginBottom: 0 }}>
          <div className="stat-card stat-card-1 dashboard-fade-in">
            <div className="stat-card-icon"><FaWallet /></div>
            <div className="stat-card-info">
              <div className="stat-card-label">Wallet Balance</div>
              <div className="stat-card-value">{user ? formatNumeric(user.wallet_balance) : '—'}</div>
            </div>
          </div>
          <div className="stat-card stat-card-2 dashboard-fade-in dashboard-delay-1">
            <div className="stat-card-icon"><FaEnvelope /></div>
            <div className="stat-card-info">
              <div className="stat-card-label">Messages Sent</div>
              <div className="stat-card-value">{user ? formatNumeric(user.sms_used_messages) : '—'}</div>
            </div>
          </div>
          <div className="stat-card stat-card-3 dashboard-fade-in dashboard-delay-2">
            <div className="stat-card-icon"><FaCheckCircle /></div>
            <div className="stat-card-info">
              <div className="stat-card-label">Messages Available</div>
              <div className="stat-card-value">{user ? formatNumeric(user.sms_available_messages) : '—'}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-row">
        <div className="performance-section dashboard-fade-in dashboard-delay-1">
          <h3>Usage Overview</h3>
          <small style={{ color: '#64748b' }}>Click the chart to view detailed breakdown</small>

          <div style={{ cursor: 'pointer' }} onClick={() => setShowUsageDetails((prev) => !prev)}>
          <PieChart width={350} height={250}>
            <Pie
              data={usageChartData}
              cx={175}
              cy={120}
              outerRadius={90}
              dataKey="value"
              label
            >
              {usageChartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
          </div>

          {user && (
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#334155' }}>
              <div>Used: <strong>{user.sms_used_percentage || 0}%</strong></div>
              <div>Available: <strong>{user.sms_available_percentage || 0}%</strong></div>
            </div>
          )}

          {showUsageDetails && user && (
            <div style={{ marginTop: '10px', textAlign: 'left', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#0f172a' }}>
              <div><strong>Total Limit:</strong> {user.sms_total_limit || 0}</div>
              <div><strong>Messages Used:</strong> {user.sms_used_messages || 0} ({user.sms_used_percentage || 0}%)</div>
              <div><strong>Messages Available:</strong> {user.sms_available_messages || 0} ({user.sms_available_percentage || 0}%)</div>
              <div><strong>Wallet Balance:</strong> {formatNumeric(user.wallet_balance)}</div>
              {!user.is_staff && <div><strong>Free Trial Number Ready:</strong> {user.free_trial_verified_numbers_count || 0}</div>}
            </div>
          )}
        </div>

        <div className={`channels-section ${isAdmin ? 'channels-grid-admin' : ''}`}>
          {generalServiceCards.map((card) => (
            <div key={card.key} className={`channel-card ${card.key} dashboard-fade-in dashboard-delay-1`}>
              {card.key === 'whatsapp' && <FaWhatsapp className="channel-icon" />}
              {card.key === 'sms' && <FaSms className="channel-icon" />}
              {card.key === 'dlt' && <FaFileAlt className="channel-icon" />}
              {card.key === 'notify' && <FaBell className="channel-icon" />}
              <h4>{card.label}</h4>
              <p>{card.desc}</p>
              <button className="register-btn" onClick={card.action}>
                Open
              </button>
            </div>
          ))}
          {serviceSearchTerm && generalServiceCards.length === 0 && (
            <div style={{ color: '#64748b', padding: '12px 4px' }}>No matching services found.</div>
          )}
        </div>
      </div>

      <div className="dashboard-row" style={{ marginTop: '20px' }}>
        <div className="performance-section dashboard-fade-in dashboard-delay-2">
          <h3>Profile Based Usage Graph</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={profileInsights} margin={{ top: 16, right: 12, left: 0, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="performance-section dashboard-fade-in dashboard-delay-3">
          <h3>Consumption Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={usageChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {usageChartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
