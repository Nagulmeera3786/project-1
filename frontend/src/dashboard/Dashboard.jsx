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
import { FaWhatsapp, FaSms, FaFileAlt, FaEnvelope, FaWallet, FaCheckCircle, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../App.css";

const COLORS = ["#0EA5E9", "#F59E0B", "#10B981"];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const navigate = useNavigate();
  const isAdmin = Boolean(user?.is_staff);

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

  return (
    <div className="dashboard-container dashboard-shell">

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
          <div className="channel-card whatsapp dashboard-fade-in dashboard-delay-1">
            <FaWhatsapp className="channel-icon" />
            <h4>WhatsApp</h4>
            <p>
              Reach customers with fast, branded WhatsApp conversations and campaign delivery.
            </p>
            <button className="register-btn">Explore WhatsApp</button>
          </div>

          <div className="channel-card sms dashboard-fade-in dashboard-delay-2">
            <FaSms className="channel-icon" />
            <h4>{isAdmin ? 'SMS Console' : 'Your SMS Console'}</h4>
            <p>
              {isAdmin
                ? 'Create campaigns, manage delivery, and monitor SMS performance from one place.'
                : 'Use your own verified number and account data to send and track your SMS.'}
            </p>
            <button
              className="register-btn"
              onClick={() => navigate(isAdmin ? '/sms/send' : '/sms/free-trial')}
            >
              {isAdmin ? 'Open SMS Console' : 'Open My SMS'}
            </button>
          </div>

          {isAdmin && (
            <div className="channel-card dlt dashboard-fade-in dashboard-delay-2">
              <FaFileAlt className="channel-icon" />
              <h4>DLT Configuration</h4>
              <p>Manage sender registration, templates, and delivery compliance settings.</p>
              <button
                className="register-btn"
                onClick={() => navigate('/admin/sms/credentials')}
              >
                Configure DLT
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="channel-card notify dashboard-fade-in dashboard-delay-3">
              <FaBell className="channel-icon" />
              <h4>Send Notifications</h4>
              <p>Internal communication module with audience filters, preview, and dedicated history.</p>
              <button
                className="register-btn"
                onClick={() => navigate('/admin/notifications')}
              >
                Open Notifications
              </button>
            </div>
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
