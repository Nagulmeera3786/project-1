import React, { useState, useEffect } from "react";
import { FaBell, FaUserCircle, FaSignOutAlt, FaCog, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../App.css";

const TopRightMenu = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('profile/').then(r => setUser(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = '/';
  };

  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.username?.[0] || 'U').toUpperCase()
    : 'U';

  return (
    <div className="top-right-container">
      {/* Notification Bell */}
      <button className="top-icon-btn" title="Notifications" onClick={() => navigate('/notifications')}>
        <FaBell />
        <span className="notification-badge" />
      </button>

      {/* User Avatar + Dropdown */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer', padding: '6px 12px',
            borderRadius: '10px', transition: 'background 0.18s',
            background: showProfileMenu ? '#EDE8FB' : 'transparent',
          }}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          {/* Avatar circle */}
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #5B3FA8, #7C5DC7)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '700', fontSize: '13px',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          {/* Name + role */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#1A1A2E', lineHeight: 1.2 }}>
              {user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) : 'User'}
            </div>
            <div style={{ fontSize: '11px', color: '#6B6B8A', lineHeight: 1.2 }}>
              {user?.is_staff ? 'Administrator' : 'Member'}
            </div>
          </div>
          {/* Chevron */}
          <span style={{ fontSize: '10px', color: '#6B6B8A', marginLeft: '2px' }}>▼</span>
        </div>

        {showProfileMenu && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            backgroundColor: 'white', border: '1px solid #E8E4F8',
            borderRadius: '12px', minWidth: '200px',
            boxShadow: '0 8px 32px rgba(45,27,105,0.16)',
            zIndex: 1000, overflow: 'hidden',
          }}>
            {/* User info panel */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0EFFE', background: '#FAFAFF' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#2D1B69' }}>
                {user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) : 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#6B6B8A', marginTop: '2px' }}>{user?.email}</div>
            </div>

            <div
              style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#1A1A2E', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F2FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
            >
              <FaUser style={{ color: '#5B3FA8' }} /> View Profile
            </div>
            <div
              style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#1A1A2E', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F2FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}
            >
              <FaCog style={{ color: '#5B3FA8' }} /> Settings
            </div>
            <div style={{ borderTop: '1px solid #F0EFFE' }} />
            <div
              style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#DC2626', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFF1F1'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={handleLogout}
            >
              <FaSignOutAlt /> Log Out
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopRightMenu;
