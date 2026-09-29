import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaRobot,
  FaUsers,
  FaClock,
  FaInbox,
  FaAddressBook,
  FaBullhorn,
  FaFileAlt,
  FaProjectDiagram,
  FaChartLine,
  FaCog,
  FaRocket,
  FaQuestionCircle,
  FaBell,
  FaCalendarAlt,
  FaChevronDown,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaHeadset,
  FaHistory,
  FaUserCircle,
  FaBars,
} from "react-icons/fa";
import API from "../api";

const Dashboard = () => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [dashboard, setDashboard] = useState({
    totalConversations: 2506,
    automatedReplies: 1743,
    activeleads: 1128,
    activeConversations: 1128,
    responseTime: 38,
    conversationChange: 18.7,
    automatedChange: 24.5,
    leadsChange: 16.3,
    conversationsChange: 16.3,
    responseChange: 21.4,
    inboxCount: 193,
    notifications: 5,
    profileRole: "Admin",

    leadSources: {
      whatsapp: 45,
      website: 25,
      facebook: 20,
      others: 10,
    },

    conversations: [
      {
        name: "Sarah Johnson",
        initials: "SJ",
        message: "Hi, I'm interested in your product. Can you...",
        time: "10:24 AM",
        status: "New",
        avatar: "#f6c7c7",
      },
      {
        name: "Mike Brown",
        initials: "MB",
        message: "Thanks for the information! I'd like to book...",
        time: "09:58 AM",
        status: "Qualified",
        avatar: "#b9dcff",
      },
      {
        name: "Emma Wilson",
        initials: "EW",
        message: "Can you share pricing details?",
        time: "09:41 AM",
        status: "New",
        avatar: "#d7e6ff",
      },
      {
        name: "David Lee",
        initials: "DL",
        message: "Great! Let's schedule a demo.",
        time: "09:15 AM",
        status: "Demo Booked",
        avatar: "#ffd85c",
      },
      {
        name: "Sophia Martinez",
        initials: "SM",
        message: "That sounds good. Thank you!",
        time: "Yesterday",
        status: "Qualified",
        avatar: "#c9a8ef",
      },
    ],

    chart: [
      { day: "May 21", value: 470 },
      { day: "May 22", value: 690 },
      { day: "May 23", value: 750 },
      { day: "May 24", value: 930 },
      { day: "May 25", value: 700 },
      { day: "May 26", value: 800 },
      { day: "May 27", value: 860 },
    ],

    campaigns: [
      {
        name: "Website Enquiry",
        value: 842,
        icon: "↗",
      },
      {
        name: "Product Demo",
        value: 623,
        icon: "↗",
      },
      {
        name: "New Offer Campaign",
        value: 512,
        icon: "◇",
      },
    ],

    aiAgents: [
      {
        name: "Product Inquiry Team",
        value: 1250,
        icon: "🤖",
      },
      {
        name: "Booking Team",
        value: 980,
        icon: "▣",
      },
      {
        name: "Support Team",
        value: 756,
        icon: "▣",
      },
    ],
  });

  useEffect(() => {
    API.get("profile/")
      .then((response) => setCurrentUser(response.data))
      .catch(() => setCurrentUser(null));
  }, []);

  const profileName = currentUser
    ? [currentUser.first_name, currentUser.last_name]
        .filter(Boolean)
        .join(" ") || currentUser.username
    : "";

  useEffect(() => {
    const interval = setInterval(() => {
      setDashboard((previous) => ({
        ...previous,

        totalConversations:
          previous.totalConversations +
          Math.floor(Math.random() * 5),

        automatedReplies:
          previous.automatedReplies +
          Math.floor(Math.random() * 3),

        activeLeads:
          previous.activeLeads +
          Math.floor(Math.random() * 2),

        activeConversations:
          previous.activeConversations +
          Math.floor(Math.random() * 2),

        responseTime: Math.max(
          10,
          previous.responseTime +
            Math.floor(Math.random() * 5) -
            2
        ),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const StatCard = ({
    icon,
    title,
    value,
    change,
    background,
    color,
    decrease,
  }) => {
    return (
      <div className="stat-card">
        <div
          className="stat-icon"
          style={{
            background: background,
            color: color,
          }}
        >
          {icon}
        </div>

        <div className="stat-details">
          <div className="stat-title">{title}</div>

          <div className="stat-value">
            {title === "Average ReplyTime"
              ? `${value}s`
              : formatNumber(value)}
          </div>

          <div className="stat-change">
            {decrease ? <FaArrowDown /> : <FaArrowUp />}

            <span>{change}%</span>

            <small>vs previous period</small>
          </div>
        </div>
      </div>
    );
  };

  const ConversationChart = () => {
    const chartData = dashboard.chart;

    const width = 700;
    const height = 240;

    const values = chartData.map((item) => item.value);

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    const points = chartData.map((item, index) => {
      const x =
        index *
        (width / (chartData.length - 1));

      const y =
        height -
        ((item.value - minValue) /
          Math.max(maxValue - minValue, 1)) *
          175 -
        20;

      return {
        x,
        y,
        value: item.value,
      };
    });

    const pointString = points
      .map((point) => `${point.x},${point.y}`)
      .join(" ");

    return (
      <div className="chart-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart"
        >
          <defs>
            <linearGradient
              id="chartFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#7552df"
                stopOpacity="0.25"
              />

              <stop
                offset="100%"
                stopColor="#7552df"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((item) => (
            <line
              key={item}
              x1="0"
              y1={20 + item * 45}
              x2={width}
              y2={20 + item * 45}
              stroke="#eeeeee"
              strokeWidth="1"
            />
          ))}

          <polygon
            points={`0,240 ${pointString} ${width},240`}
            fill="url(#chartFill)"
          />

          <polyline
            points={pointString}
            fill="none"
            stroke="#6845d7"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#6845d7"
              stroke="#ffffff"
              strokeWidth="3"
            />
          ))}
        </svg>

        <div className="chart-labels">
          {chartData.map((item, index) => (
            <span key={index}>{item.day}</span>
          ))}
        </div>
      </div>
    );
  };

  const LeadSourceChart = () => {
    const sources = [
      {
        name: "WhatsApp",
        value: dashboard.leadSources.whatsapp,
        color: "#0bbd70",
      },
      {
        name: "Website",
        value: dashboard.leadSources.website,
        color: "#1677e8",
      },
      {
        name: "Facebook",
        value: dashboard.leadSources.facebook,
        color: "#7652df",
      },
      {
        name: "Others",
        value: dashboard.leadSources.others,
        color: "#f2ad15",
      },
    ];

    const total = sources.reduce(
      (sum, item) => sum + item.value,
      0
    );

    const radius = 48;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;

    return (
      <div className="lead-source">
        <div className="donut-wrapper">
          <svg
            viewBox="0 0 120 120"
            className="donut"
          >
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#eeeeee"
              strokeWidth="15"
            />

            {sources.map((item, index) => {
              const percentage =
                total === 0 ? 0 : item.value / total;

              const dash =
                percentage * circumference;

              const currentOffset = offset;

              offset += dash;

              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="15"
                  strokeDasharray={`${dash} ${
                    circumference - dash
                  }`}
                  strokeDashoffset={-currentOffset}
                  transform="rotate(-90 60 60)"
                />
              );
            })}
          </svg>

          <div className="donut-center">
            <strong>{total}%</strong>
            <small>Leads</small>
          </div>
        </div>

        <div className="lead-legend">
          {sources.map((item, index) => (
            <div
              className="legend-item"
              key={index}
            >
              <span
                className="legend-dot"
                style={{
                  background: item.color,
                }}
              />

              <span>{item.name}</span>

              <strong>{item.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getStatusStyle = (status) => {
    if (status === "New") {
      return {
        background: "#eee8ff",
        color: "#7350d8",
      };
    }

    if (status === "Qualified") {
      return {
        background: "#fff3cb",
        color: "#a07500",
      };
    }

    return {
      background: "#dff7e8",
      color: "#169653",
    };
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, Arial, sans-serif;
          background: #f8f9fc;
        }

        button {
          font-family: inherit;
        }

        .dashboard-page {
          min-height: 100vh;
          background: #f8f9fc;
          color: #202124;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 190px;
          background: #ffffff;
          border-right: 1px solid #eeeeee;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width 0.25s ease;
        }

        .sidebar.collapsed {
          width: 65px;
        }

        .sidebar.collapsed .nav-button {
          justify-content: center;
          padding-left: 0;
          padding-right: 0;
        }

        .sidebar.collapsed .nav-button > span {
          display: none;
        }

        .sidebar.collapsed .inbox-badge,
        .sidebar.collapsed .profile-details,
        .sidebar.collapsed .profile > svg {
          display: none;
        }

        .dashboard-page.sidebar-is-collapsed .main-content {
          margin-left: 65px;
        }

        .logo {
          width: 165px;
          height: 38px;
          object-fit: contain;
          object-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 25px;
          transition: width 0.25s ease;
        }

        .sidebar.collapsed .logo {
          width: 40px;
          object-fit: cover;
          object-position: left;
        }

        .dashboard-nav-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dashboard-nav-row .nav-button {
          flex: 1;
        }

        .sidebar-toggle {
          border: none;
          background: transparent;
          color: #555b65;
          width: 30px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .sidebar-toggle:hover {
          background: #f5f1ff;
          color: #6845d7;
        }

        .navigation {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-button {
          border: none;
          background: transparent;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px;
          border-radius: 10px;
          color: #555b65;
          font-size: 13px;
          cursor: pointer;
          text-align: left;
        }

        .nav-button:hover {
          background: #f5f1ff;
          color: #6845d7;
        }

        .nav-button.active {
          background: #f0eaff;
          color: #6845d7;
          font-weight: 600;
        }

        .inbox-badge {
          margin-left: auto;
          background: #0bbd71;
          color: white;
          padding: 3px 7px;
          border-radius: 12px;
          font-size: 9px;
        }

        .profile {
          margin-top: auto;
          border-top: 1px solid #eeeeee;
          padding: 16px 10px 4px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #555b65;
        }

        .profile-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6845d7;
          background: #f0eaff;
          border-radius: 50%;
          font-size: 22px;
          flex-shrink: 0;
        }

        .profile-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .profile-details strong {
          font-size: 12px;
          color: #202124;
        }

        .profile-details small {
          color: #888;
          font-size: 9px;
        }

        .sidebar.collapsed .profile {
          justify-content: center;
          padding-left: 0;
          padding-right: 0;
        }

        .main-content {
          margin-left: 190px;
          min-height: 100vh;
          width: calc(100% - 190px);
        }

        .header {
          height: 70px;
          background: white;
          border-bottom: 1px solid #eeeeee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 25px;
        }

        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: #202124;
        }

        .header h1 span {
          color: #6845d7;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .whats-new {
          border: 1px solid #e8e8e8;
          background: white;
          border-radius: 8px;
          padding: 8px 13px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: #555;
        }

        .header-icon {
          color: #666;
          font-size: 15px;
        }

        .notification {
          position: relative;
          color: #555;
          font-size: 16px;
        }

        .notification-number {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ee4054;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }

        .user {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e5e5e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          position: relative;
        }

        .online {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #0abb70;
          border: 2px solid white;
        }

        .content {
          padding: 20px;
        }

        .date-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 18px;
        }

        .date-button {
          border: 1px solid #e7e7e7;
          background: white;
          border-radius: 8px;
          padding: 8px 11px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #555;
          font-size: 10px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: white;
          border: 1px solid #eeeeee;
          border-radius: 15px;
          padding: 17px;
          min-height: 118px;
          display: flex;
          gap: 13px;
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .stat-details {
          min-width: 0;
        }

        .stat-title {
          color: #656565;
          font-size: 10px;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 23px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #08b874;
          font-size: 10px;
        }

        .stat-change small {
          color: #888;
          font-size: 9px;
        }

        .middle-section {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(340px, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .bottom-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .card {
          background: white;
          border: 1px solid #eeeeee;
          border-radius: 15px;
          padding: 17px;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 13px;
        }

        .card-header h2 {
          font-size: 12px;
          margin: 0;
          font-weight: 700;
        }

        .view-button {
          background: white;
          border: 1px solid #e6e6e6;
          border-radius: 7px;
          padding: 6px 10px;
          font-size: 9px;
          color: #555;
          cursor: pointer;
        }

        .view-button:hover {
          background: #f7f5ff;
          color: #6845d7;
        }

        .chart-container {
          width: 100%;
        }

        .chart {
          width: 100%;
          height: 220px;
          display: block;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          color: #777;
          font-size: 9px;
        }

        .conversation {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 0;
          border-bottom: 1px solid #f3f3f3;
        }

        .conversation:last-child {
          border-bottom: none;
        }

        .conversation-avatar {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
        }

        .conversation-info {
          flex: 1;
          min-width: 0;
        }

        .conversation-info strong {
          display: block;
          font-size: 10px;
          margin-bottom: 3px;
        }

        .conversation-info p {
          margin: 0;
          font-size: 8px;
          color: #777;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .conversation-right {
          min-width: 75px;
          text-align: right;
        }

        .conversation-right small {
          display: block;
          font-size: 8px;
          color: #777;
          margin-bottom: 4px;
        }

        .status {
          display: inline-block;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 7px;
        }

        .lead-source {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 145px;
        }

        .donut-wrapper {
          width: 145px;
          height: 145px;
          min-width: 145px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut {
          width: 145px;
          height: 145px;
        }

        .donut-center {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .donut-center strong {
          font-size: 19px;
        }

        .donut-center small {
          font-size: 8px;
          color: #888;
        }

        .lead-legend {
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          font-size: 9px;
          color: #555;
        }

        .legend-item strong {
          margin-left: auto;
        }

        .legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f3f3;
          font-size: 10px;
        }

        .list-item:last-child {
          border-bottom: none;
        }

        .list-icon {
          width: 27px;
          height: 27px;
          border-radius: 7px;
          background: #eee8ff;
          color: #7350d8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        .list-name {
          flex: 1;
        }

        .list-value {
          font-weight: 700;
        }

        @media (max-width: 1100px) {
          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .bottom-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .sidebar:not(.collapsed) {
            width: 190px;
          }

          .main-content {
            margin-left: 65px;
            width: calc(100% - 65px);
          }

          .middle-section {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        className={`dashboard-page${
          sidebarCollapsed
            ? " sidebar-is-collapsed"
            : ""
        }`}
      >
        <aside
          className={`sidebar${
            sidebarCollapsed ? " collapsed" : ""
          }`}
        >
          <img
            className="logo"
            src="/bhisha-logo.svg"
            alt="Bhisha"
          />

          <nav className="navigation">
            <div className="dashboard-nav-row">
              <button
                className="nav-button active"
                title="Dashboard"
              >
                <FaChartLine />
                <span>Dashboard</span>
              </button>

              <button
                className="sidebar-toggle"
                onClick={() =>
                  setSidebarCollapsed(
                    (collapsed) => !collapsed
                  )
                }
                aria-label={
                  sidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                }
                title={
                  sidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                }
              >
                <FaBars />
              </button>
            </div>

            <button
              className="nav-button"
              title="Inbox"
              onClick={() =>
                navigate("/whatsapp/inbox")
              }
            >
              <FaInbox />
              <span>Inbox</span>
            </button>

            <button
              className="nav-button"
              title="Templates"
              onClick={() =>
                navigate("/whatsapp/templates")
              }
            >
              <FaFileAlt />
              <span>Templates</span>
            </button>

            <button
              className="nav-button"
              title="Campaigns"
              onClick={() =>
                navigate("/whatsapp/campaigns")
              }
            >
              <FaBullhorn />
              <span>Campaigns</span>
            </button>

            <button
              className="nav-button"
              title="Analytics"
              onClick={() =>
                navigate("/whatsapp/analytics")
              }
            >
              <FaChartLine />
              <span>Analytics</span>
            </button>

            <button
              className="nav-button"
              title="History"
              onClick={() =>
                navigate("/whatsapp/history")
              }
            >
              <FaHistory />
              <span>History</span>
            </button>

            <button
              className="nav-button"
              title="Recharge"
            >
              <FaWallet />
              <span>Recharge</span>
            </button>

            <button
              className="nav-button"
              title="Support"
              onClick={() =>
                navigate("/whatsapp/support")
              }
            >
              <FaHeadset />
              <span>Support</span>
            </button>

            <button
              className="nav-button"
              title="Settings"
              onClick={() =>
                navigate("/whatsapp/settings")
              }
            >
              <FaCog />
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <header className="header">
            <h1>
              Hi
              <span>
                {profileName
                  ? `, ${profileName}`
                  : ""}
              </span>
            </h1>

            <div className="header-right">
              <button className="whats-new">
                <FaRocket />
                What's New
              </button>

              <FaQuestionCircle
                className="header-icon"
              />

              <div className="notification">
                <FaBell />

                <span className="notification-number">
                  {dashboard.notifications}
                </span>
              </div>

              <div
                className="profile-icon"
                onClick={() =>
                  navigate("/whatsapp/settings")
                }
                style={{
                  cursor: "pointer",
                }}
                title="Settings"
              >
                <FaUserCircle />
              </div>
            </div>
          </header>

          <section className="content">
            <div className="date-row">
              <button className="date-button">
                <FaCalendarAlt />
                May 20 – May 27, 2025
                <FaChevronDown />
              </button>
            </div>

            <div className="stats">
              <StatCard
                icon={<FaWhatsapp />}
                title="Customer Chats"
                value={
                  dashboard.totalConversations
                }
                change={
                  dashboard.conversationChange
                }
                background="#e2f8ed"
                color="#08b870"
              />

              <StatCard
                icon={<FaRobot />}
                title="Automated Messages"
                value={
                  dashboard.automatedReplies
                }
                change={
                  dashboard.automatedChange
                }
                background="#e5f0ff"
                color="#1677e8"
              />

              <StatCard
                icon={<FaUsers />}
                title="Open Conversations"
                value={
                  dashboard.activeConversations
                }
                change={
                  dashboard.conversationsChange
                }
                background="#eee8ff"
                color="#7652df"
              />

              <StatCard
                icon={<FaClock />}
                title="Average ReplyTime"
                value={dashboard.responseTime}
                change={dashboard.responseChange}
                decrease={true}
                background="#fff3d8"
                color="#eea90b"
              />
            </div>

            <div className="middle-section">
              <div className="card">
                <div className="card-header">
                  <h2>
                    Conversations Over Time
                  </h2>

                  <button className="view-button">
                    View Analytics
                  </button>
                </div>

                <ConversationChart />
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>
                    Recent Conversations
                  </h2>

                  <button className="view-button">
                    View Inbox
                  </button>
                </div>

                {dashboard.conversations.map(
                  (conversation, index) => (
                    <div
                      className="conversation"
                      key={index}
                    >
                      <div
                        className="conversation-avatar"
                        style={{
                          background:
                            conversation.avatar,
                        }}
                      >
                        {conversation.initials}
                      </div>

                      <div className="conversation-info">
                        <strong>
                          {conversation.name}
                        </strong>

                        <p>
                          {conversation.message}
                        </p>
                      </div>

                      <div className="conversation-right">
                        <small>
                          {conversation.time}
                        </small>

                        <span
                          className="status"
                          style={getStatusStyle(
                            conversation.status
                          )}
                        >
                          {conversation.status}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bottom-section">
              <div className="card">
                <div className="card-header">
                  <h2>Top Campaigns</h2>

                  <button className="view-button">
                    View All
                  </button>
                </div>

                {dashboard.campaigns.map(
                  (campaign, index) => (
                    <div
                      className="list-item"
                      key={index}
                    >
                      <div className="list-icon">
                        {campaign.icon}
                      </div>

                      <span className="list-name">
                        {campaign.name}
                      </span>

                      <strong className="list-value">
                        {formatNumber(
                          campaign.value
                        )}
                      </strong>
                    </div>
                  )
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>
                    Active Team Departments
                  </h2>

                  <button className="view-button">
                    View All
                  </button>
                </div>

                {dashboard.aiAgents.map(
                  (agent, index) => (
                    <div
                      className="list-item"
                      key={index}
                    >
                      <div
                        className="list-icon"
                        style={{
                          background: "#e4f8ef",
                        }}
                      >
                        {agent.icon}
                      </div>

                      <span className="list-name">
                        {agent.name}
                      </span>

                      <strong className="list-value">
                        {formatNumber(
                          agent.value
                        )}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Dashboard;