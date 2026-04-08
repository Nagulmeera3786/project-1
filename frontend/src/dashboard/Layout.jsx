import React from "react";
import LeftSidebar from "./LeftSidebar";
import TopRightMenu from "./TopRightMenu";
import Dashboard from "./Dashboard";
import "../App.css";

const Layout = () => {
  return (
    <div className="layout">
      <div className="layout-header">
        {/* Brand / Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '14px',
            letterSpacing: '0.5px', flexShrink: 0,
          }}>ABC</div>
          <div style={{
            fontSize: '17px', fontWeight: '700',
            color: '#2D1B69', letterSpacing: '0.3px',
          }}>
            ABC Company
          </div>
        </div>
        <TopRightMenu />
      </div>
      <div className="layout-body">
        <LeftSidebar />
        <div className="main-content">
          <Dashboard />
        </div>
      </div>
    </div>
  );
};

export default Layout;

