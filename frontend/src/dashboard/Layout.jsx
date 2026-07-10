import React from "react";
import LeftSidebar from "./LeftSidebar";
import TopRightMenu from "./TopRightMenu";
import Dashboard from "./Dashboard";
import RechargePaymentsPage from "./RechargePaymentsPage";
import ContactSupportPage from "./ContactSupportPage";
import "../App.css";

const Layout = ({ page = "dashboard" }) => {
  const pageMap = {
    dashboard: <Dashboard />,
    recharge: <RechargePaymentsPage />,
    contactSupport: <ContactSupportPage />,
  };

  return (
    <div className="layout">
      <div className="layout-header">
        {/* Brand / Logo area — LEFT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} title="Bhisha">
          <img
            src="/bhisha-logo.svg"
            alt="Bhisha"
            style={{ width: '150px', height: 'auto', display: 'block' }}
          />
        </div>
        {/* TOP RIGHT MENU — RIGHT (Notifications, API Docs, Profile) */}
        <TopRightMenu />
      </div>
      <div className="layout-body">
        <LeftSidebar />
        <div className="main-content">
          {pageMap[page] || <Dashboard />}
        </div>
      </div>
    </div>
  );
};

export default Layout;

