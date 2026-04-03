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

const COLORS = ["#5B3FA8", "#EF4444", "#7C5DC7"];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const navigate = useNavigate();
  const isAdmin = Boolean(user?.is_staff);

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
        { key: 'Verified Nos', value: 0 },
      ];
    }

    return [
      { key: 'Used', value: Number(user.sms_used_messages || 0) },
      { key: 'Available', value: Number(user.sms_available_messages || 0) },
      { key: 'Verified Nos', value: Number(user.free_trial_verified_numbers_count || 0) },
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
    <div className="dashboard-container">

      {/* ── Purple Stat Cards Row ─────────────────────── */}
      <div className="stat-cards-row">
        <div className="stat-card stat-card-1">
          <div className="stat-card-icon"><FaWallet /></div>
          <div className="stat-card-info">
            <div className="stat-card-label">Wallet Balance</div>
            <div className="stat-card-value">{user ? (user.wallet_balance || 0) : '—'}</div>
          </div>
        </div>
        <div className="stat-card stat-card-2">
          <div className="stat-card-icon"><FaEnvelope /></div>
          <div className="stat-card-info">
            <div className="stat-card-label">Messages Sent</div>
            <div className="stat-card-value">{user ? (user.sms_used_messages || 0) : '—'}</div>
          </div>
        </div>
        <div className="stat-card stat-card-3">
          <div className="stat-card-icon"><FaCheckCircle /></div>
          <div className="stat-card-info">
            <div className="stat-card-label">Messages Available</div>
            <div className="stat-card-value">{user ? (user.sms_available_messages || 0) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        {/* LEFT SIDE - PIE CHART */}
        <div className="performance-section">
          <h3>Usage Overview</h3>
          <small style={{ color: '#666' }}>Click chart for detailed explanation</small>

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
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#444' }}>
              <div>Used: <strong>{user.sms_used_percentage || 0}%</strong></div>
              <div>Available: <strong>{user.sms_available_percentage || 0}%</strong></div>
            </div>
          )}

          {showUsageDetails && user && (
            <div style={{ marginTop: '10px', textAlign: 'left', backgroundColor: '#F5F2FF', border: '1px solid #DDD4F8', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#2D1B69' }}>
              <div><strong>Total Limit:</strong> {user.sms_total_limit || 0}</div>
              <div><strong>Messages Used:</strong> {user.sms_used_messages || 0} ({user.sms_used_percentage || 0}%)</div>
              <div><strong>Messages Available:</strong> {user.sms_available_messages || 0} ({user.sms_available_percentage || 0}%)</div>
              <div><strong>Wallet Balance:</strong> {user.wallet_balance || 0}</div>
              {!user.is_staff && <div><strong>Free Trial Verified Numbers:</strong> {user.free_trial_verified_numbers_count || 0}</div>}
            </div>
          )}
        </div>

        {/* RIGHT SIDE - CHANNELS */}
        <div className={`channels-section ${isAdmin ? 'channels-grid-admin' : ''}`}>
          <div className="channel-card whatsapp">
            <FaWhatsapp className="channel-icon" />
            <h4>WhatsApp</h4>
            <p>
              Reach customers with fast, branded WhatsApp conversations and campaign delivery.
            </p>
            <button className="register-btn">Explore WhatsApp</button>
          </div>

          <div className="channel-card sms">
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
            <div className="channel-card dlt">
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
            <div className="channel-card notify">
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
        <div className="performance-section">
          <h3>Profile Based Usage Graph</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={profileInsights} margin={{ top: 16, right: 12, left: 0, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#5B3FA8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="performance-section">
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