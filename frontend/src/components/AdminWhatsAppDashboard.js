import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaUsers,
  FaUserCheck,
  FaPaperPlane,
  FaCheckCircle,
  FaBullhorn,
  FaExclamationTriangle,
  FaChartLine,
  FaServer,
  FaUserPlus,
  FaClock,
  FaTimesCircle,
  FaCog,
  FaBell,
  FaHome,
  FaFileAlt,
  FaRobot,
} from "react-icons/fa";

const AdminWhatsAppDashboard = () => {
  const navigate = useNavigate();

  // =====================================================
  // ADMIN DASHBOARD DATA
  // =====================================================

  const [data, setData] = useState({
    totalAccounts: 0,
    connectedAccounts: 0,
    messagesSent: 0,
    messagesDelivered: 0,
    totalCustomers: 0,
    activeCampaigns: 0,

    deliveryOverview: {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    },

    accountOverview: {
      connected: 0,
      disconnected: 0,
      pending: 0,
    },

    recentActivity: [],

    weeklyMessages: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH ADMIN DASHBOARD DATA
  // =====================================================

  const fetchAdminDashboard = async () => {

    try {

      const response = await fetch(
  "http://127.0.0.1:8000/api/dashboard/"
);
      if (!response.ok) {
        throw new Error(
          "Failed to load admin dashboard"
        );
      }

      const result = await response.json();

      setData({
        totalAccounts:
          result.totalAccounts ?? 0,

        connectedAccounts:
          result.connectedAccounts ?? 0,

        messagesSent:
          result.messagesSent ?? 0,

        messagesDelivered:
          result.messagesDelivered ?? 0,

        totalCustomers:
          result.totalCustomers ?? 0,

        activeCampaigns:
          result.activeCampaigns ?? 0,

        deliveryOverview: {
          sent:
            result.deliveryOverview?.sent ?? 0,

          delivered:
            result.deliveryOverview?.delivered ?? 0,

          read:
            result.deliveryOverview?.read ?? 0,

          failed:
            result.deliveryOverview?.failed ?? 0,
        },

        accountOverview: {
          connected:
            result.accountOverview?.connected ?? 0,

          disconnected:
            result.accountOverview?.disconnected ?? 0,

          pending:
            result.accountOverview?.pending ?? 0,
        },

        recentActivity:
          result.recentActivity ?? [],

        weeklyMessages:
          result.weeklyMessages ?? [],
      });

      setError("");

    } catch (err) {

      console.error(err);

      setError(
        "Unable to connect to the admin dashboard API."
      );

    } finally {

      setLoading(false);

    }

  };

  // =====================================================
  // REAL-TIME REFRESH
  // =====================================================

  useEffect(() => {

    fetchAdminDashboard();

    const interval = setInterval(() => {
      fetchAdminDashboard();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  // =====================================================
  // NUMBER FORMAT
  // =====================================================

  const formatNumber = (number) => {

    return new Intl.NumberFormat("en-IN").format(
      Number(number || 0)
    );

  };

  // =====================================================
  // STAT CARD
  // =====================================================

  const StatCard = ({
    icon,
    title,
    value,
    background,
    color,
  }) => {

    return (

      <div className="admin-stat-card">

        <div
          className="admin-stat-icon"
          style={{
            background,
            color,
          }}
        >
          {icon}
        </div>

        <div className="admin-stat-content">

          <span>
            {title}
          </span>

          <strong>
            {formatNumber(value)}
          </strong>

          <small>
            ● Live
          </small>

        </div>

      </div>

    );

  };

  // =====================================================
  // DELIVERY OVERVIEW
  // =====================================================

  const DeliveryOverview = () => {

    const items = [

      {
        name: "Messages Sent",
        value: data.deliveryOverview.sent,
        icon: <FaPaperPlane />,
        className: "blue",
      },

      {
        name: "Delivered",
        value:
          data.deliveryOverview.delivered,
        icon: <FaCheckCircle />,
        className: "green",
      },

      {
        name: "Read",
        value: data.deliveryOverview.read,
        icon: <FaUserCheck />,
        className: "purple",
      },

      {
        name: "Failed",
        value:
          data.deliveryOverview.failed,
        icon: <FaTimesCircle />,
        className: "red",
      },

    ];

    return (

      <div className="overview-list">

        {items.map((item, index) => (

          <div
            className="overview-item"
            key={index}
          >

            <div
              className={`overview-icon ${item.className}`}
            >
              {item.icon}
            </div>

            <div>

              <span>
                {item.name}
              </span>

              <strong>
                {formatNumber(item.value)}
              </strong>

            </div>

          </div>

        ))}

      </div>

    );

  };

  // =====================================================
  // WHATSAPP ACCOUNT OVERVIEW
  // =====================================================

  const AccountOverview = () => {

    const accounts = [

      {
        name: "Connected Accounts",
        value:
          data.accountOverview.connected,
        icon: <FaCheckCircle />,
        className: "green",
      },

      {
        name: "Disconnected Accounts",
        value:
          data.accountOverview.disconnected,
        icon: <FaTimesCircle />,
        className: "red",
      },

      {
        name: "Pending Accounts",
        value:
          data.accountOverview.pending,
        icon: <FaClock />,
        className: "orange",
      },

    ];

    return (

      <div className="overview-list">

        {accounts.map((account, index) => (

          <div
            className="overview-item"
            key={index}
          >

            <div
              className={`overview-icon ${account.className}`}
            >
              {account.icon}
            </div>

            <div>

              <span>
                {account.name}
              </span>

              <strong>
                {formatNumber(account.value)}
              </strong>

            </div>

          </div>

        ))}

      </div>

    );

  };

  // =====================================================
  // RECENT ADMIN ACTIVITY
  // =====================================================

  const RecentActivity = () => {

    if (
      !data.recentActivity ||
      data.recentActivity.length === 0
    ) {

      return (

        <div className="empty">
          No recent system activity
        </div>

      );

    }

    return (

      <div>

        {data.recentActivity.map(
          (activity, index) => (

            <div
              className="activity-item"
              key={index}
            >

              <div className="activity-icon">

                {activity.type === "account" && (
                  <FaWhatsapp />
                )}

                {activity.type === "message" && (
                  <FaPaperPlane />
                )}

                {activity.type === "customer" && (
                  <FaUserPlus />
                )}

                {activity.type === "campaign" && (
                  <FaBullhorn />
                )}

                {!activity.type && (
                  <FaClock />
                )}

              </div>

              <div className="activity-content">

                <strong>
                  {activity.title ||
                    "System Activity"}
                </strong>

                <span>
                  {activity.description || ""}
                </span>

              </div>

              <small>
                {activity.time || ""}
              </small>

            </div>

          )
        )}

      </div>

    );

  };

  // =====================================================
  // WEEKLY MESSAGE CHART
  // =====================================================

  const WeeklyMessages = () => {

    if (
      !data.weeklyMessages ||
      data.weeklyMessages.length === 0
    ) {

      return (

        <div className="empty">
          No message data available
        </div>

      );

    }

    const max = Math.max(
      ...data.weeklyMessages.map(
        item => Number(item.value || 0)
      ),
      1
    );

    return (

      <div className="chart">

        {data.weeklyMessages.map(
          (item, index) => {

            const height =
              (Number(item.value || 0) /
                max) *
              180;

            return (

              <div
                className="chart-column"
                key={index}
              >

                <span className="chart-value">
                  {formatNumber(item.value)}
                </span>

                <div
                  className="chart-bar"
                  style={{
                    height:
                      `${Math.max(
                        height,
                        5
                      )}px`,
                  }}
                />

                <span className="chart-day">
                  {item.day}
                </span>

              </div>

            );

          }
        )}

      </div>

    );

  };

  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <>

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background: #f6f7fb;
        }

        .admin-dashboard {
          min-height: 100vh;
          background: #f6f7fb;
        }

        /* =========================
           SIDEBAR
        ========================= */

        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 215px;
          background: #ffffff;
          border-right: 1px solid #eeeeee;
          padding: 20px 14px;
        }

        .admin-logo {
          height: 42px;
          border-radius: 10px;
          background: #111111;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 25px;
        }

        .admin-menu {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .admin-menu button {
          border: none;
          background: transparent;
          padding: 11px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 11px;
          color: #666666;
          cursor: pointer;
          font-size: 11px;
          text-align: left;
        }

        .admin-menu button:hover,
        .admin-menu button.active {
          background: #eee9ff;
          color: #7352d9;
        }

        .admin-user {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 18px;
          padding: 10px;
          border: 1px solid #eeeeee;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .admin-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #eeeeee;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 10px;
          font-weight: bold;
        }

        .admin-user-info {
          display: flex;
          flex-direction: column;
        }

        .admin-user-info strong {
          font-size: 10px;
        }

        .admin-user-info small {
          font-size: 8px;
          color: #888888;
        }

        /* =========================
           MAIN
        ========================= */

        .admin-main {
          margin-left: 215px;
          min-height: 100vh;
        }

        .admin-header {
          height: 70px;
          background: white;
          border-bottom: 1px solid #eeeeee;
          padding: 0 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-header h1 {
          margin: 0;
          font-size: 21px;
        }

        .admin-header-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .admin-notification {
          position: relative;
        }

        .notification-count {
          position: absolute;
          right: -7px;
          top: -7px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #e44e61;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }

        /* =========================
           CONTENT
        ========================= */

        .admin-content {
          padding: 22px;
        }

        .admin-live {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .admin-live span:first-child {
          color: #0ba968;
          font-size: 10px;
          font-weight: bold;
        }

        .admin-live span:last-child {
          color: #888888;
          font-size: 9px;
        }

        /* =========================
           STAT CARDS
        ========================= */

        .admin-stats {
          display: grid;
          grid-template-columns:
            repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .admin-stat-card {
          background: white;
          border: 1px solid #eeeeee;
          border-radius: 13px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-stat-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-stat-content {
          display: flex;
          flex-direction: column;
        }

        .admin-stat-content span {
          font-size: 8px;
          color: #777777;
          margin-bottom: 3px;
        }

        .admin-stat-content strong {
          font-size: 18px;
        }

        .admin-stat-content small {
          color: #0ba968;
          font-size: 7px;
          margin-top: 3px;
        }

        /* =========================
           GRID
        ========================= */

        .admin-grid {
          display: grid;
          grid-template-columns:
            1.3fr .9fr .9fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .admin-card {
          background: white;
          border: 1px solid #eeeeee;
          border-radius: 14px;
          padding: 17px;
        }

        .admin-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .admin-card-header h2 {
          margin: 0;
          font-size: 12px;
        }

        /* =========================
           CHART
        ========================= */

        .chart {
          height: 230px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          border-bottom: 1px solid #eeeeee;
        }

        .chart-column {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
        }

        .chart-value {
          font-size: 7px;
          color: #777777;
        }

        .chart-bar {
          width: 27px;
          background: #7352d9;
          border-radius: 4px 4px 0 0;
        }

        .chart-day {
          font-size: 8px;
          color: #888888;
        }

        /* =========================
           OVERVIEW
        ========================= */

        .overview-list {
          display: flex;
          flex-direction: column;
        }

        .overview-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #f1f1f1;
        }

        .overview-item:last-child {
          border-bottom: none;
        }

        .overview-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .overview-icon.blue {
          background: #eaf1ff;
          color: #347be0;
        }

        .overview-icon.green {
          background: #e4f8ed;
          color: #0ba968;
        }

        .overview-icon.purple {
          background: #eee9ff;
          color: #7352d9;
        }

        .overview-icon.red {
          background: #ffebed;
          color: #e25563;
        }

        .overview-icon.orange {
          background: #fff2d8;
          color: #d99a0b;
        }

        .overview-item span {
          display: block;
          color: #777777;
          font-size: 8px;
          margin-bottom: 3px;
        }

        .overview-item strong {
          font-size: 15px;
        }

        /* =========================
           ACTIVITY
        ========================= */

        .activity-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 0;
          border-bottom: 1px solid #f2f2f2;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #eee9ff;
          color: #7352d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        .activity-content {
          flex: 1;
        }

        .activity-content strong {
          display: block;
          font-size: 9px;
          margin-bottom: 3px;
        }

        .activity-content span {
          display: block;
          font-size: 8px;
          color: #888888;
        }

        .activity-item small {
          font-size: 7px;
          color: #888888;
        }

        /* =========================
           ERROR
        ========================= */

        .admin-error {
          padding: 10px 14px;
          background: #fff0f0;
          color: #d84b58;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 10px;
        }

        .empty {
          padding: 35px 10px;
          text-align: center;
          color: #999999;
          font-size: 9px;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media(max-width:1200px) {

          .admin-stats {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .admin-grid {
            grid-template-columns:
              1fr 1fr;
          }

        }

        @media(max-width:800px) {

          .admin-sidebar {
            width: 65px;
          }

          .admin-menu button span,
          .admin-user-info {
            display: none;
          }

          .admin-main {
            margin-left: 65px;
          }

          .admin-grid {
            grid-template-columns: 1fr;
          }

        }

        @media(max-width:600px) {

          .admin-stats {
            grid-template-columns: 1fr;
          }

          .admin-content {
            padding: 12px;
          }

        }

      `}</style>

      <div className="admin-dashboard">

        {/* SIDEBAR */}

        <aside className="admin-sidebar">

          <div className="admin-logo">
            WhatsApp Admin
          </div>

          <div className="admin-menu">

            <button className="active">
              <FaHome />
              <span>Dashboard</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/accounts')}>
              <FaWhatsapp />
              <span>WhatsApp Accounts</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/customers')}>
              <FaUsers />
              <span>Customers</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/messages')}>
              <FaPaperPlane />
              <span>Messages</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/campaigns')}>
              <FaBullhorn />
              <span>Campaigns</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/templates')}>
              <FaFileAlt />
              <span>Templates</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/automation')}>
              <FaRobot />
              <span>Automation</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/reports')}>
              <FaChartLine />
              <span>Reports</span>
            </button>

            <button onClick={() => navigate('/admin/whatsapp/settings')}>
              <FaCog />
              <span>Settings</span>
            </button>

          </div>

          <div className="admin-user">

            <div className="admin-avatar">
              A
            </div>

            <div className="admin-user-info">

              <strong>
                Administrator
              </strong>

              <small>
                Admin
              </small>

            </div>

          </div>

        </aside>

        {/* MAIN */}

        <main className="admin-main">

          <header className="admin-header">

            <h1>
              WhatsApp Admin Dashboard
            </h1>

            <div className="admin-header-right">

              <div className="admin-notification">

                <FaBell />

                <span className="notification-count">
                  0
                </span>

              </div>

              <div className="admin-avatar">
                A
              </div>

            </div>

          </header>

          <section className="admin-content">

            <div className="admin-live">

              <span>
                ● LIVE SYSTEM
              </span>

              <span>
                Automatically updated every 5 seconds
              </span>

            </div>

            {error && (

              <div className="admin-error">
                {error}
              </div>

            )}

            {/* STATISTICS */}

            <div className="admin-stats">

              <StatCard
                icon={<FaWhatsapp />}
                title="Total WhatsApp Accounts"
                value={data.totalAccounts}
                background="#e4f8ed"
                color="#0ba968"
              />

              <StatCard
                icon={<FaCheckCircle />}
                title="Connected Accounts"
                value={data.connectedAccounts}
                background="#eaf1ff"
                color="#347be0"
              />

              <StatCard
                icon={<FaPaperPlane />}
                title="Messages Sent"
                value={data.messagesSent}
                background="#eee9ff"
                color="#7352d9"
              />

              <StatCard
                icon={<FaCheckCircle />}
                title="Messages Delivered"
                value={data.messagesDelivered}
                background="#e4f8ed"
                color="#0ba968"
              />

              <StatCard
                icon={<FaUsers />}
                title="Total Customers"
                value={data.totalCustomers}
                background="#eaf1ff"
                color="#347be0"
              />

              <StatCard
                icon={<FaBullhorn />}
                title="Active Campaigns"
                value={data.activeCampaigns}
                background="#fff2d8"
                color="#d99a0b"
              />

            </div>

            {/* CHART + ACCOUNT OVERVIEW + DELIVERY */}

            <div className="admin-grid">

              <div className="admin-card">

                <div className="admin-card-header">

                  <h2>
                    Weekly WhatsApp Activity
                  </h2>

                  <FaChartLine />

                </div>

                <WeeklyMessages />

              </div>

              <div className="admin-card">

                <div className="admin-card-header">

                  <h2>
                    WhatsApp Account Status
                  </h2>

                  <FaServer />

                </div>

                <AccountOverview />

              </div>

              <div className="admin-card">

                <div className="admin-card-header">

                  <h2>
                    Message Delivery Overview
                  </h2>

                  <FaChartLine />

                </div>

                <DeliveryOverview />

              </div>

            </div>

            {/* RECENT ACTIVITY */}

            <div className="admin-card">

              <div className="admin-card-header">

                <h2>
                  Recent System Activity
                </h2>

                <FaClock />

              </div>

              <RecentActivity />

            </div>

          </section>

        </main>

      </div>

    </>

  );

};

export default AdminWhatsAppDashboard;