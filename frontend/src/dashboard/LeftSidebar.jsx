import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaBroadcastTower,
  FaCommentDots,
  FaRobot,
  FaChartBar,
  FaUsers,
  FaFileAlt,
  FaExchangeAlt,
  FaEnvelope,
  FaCog,
  FaKey,
  FaHistory,
  FaWhatsapp,
  FaPhoneAlt,
} from "react-icons/fa";
import API from "../api";
import "../App.css";

const LeftSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBroadcastSubmenu, setShowBroadcastSubmenu] = useState(false);
  const [showPeopleSubmenu, setShowPeopleSubmenu] = useState(false);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeSidebarData = async () => {
      try {
        const [profileResponse, groupsResponse] = await Promise.all([
          API.get('profile/'),
          API.get('sms/groups/'),
        ]);
        setIsAdmin(Boolean(profileResponse.data?.is_staff));
        setGroups(groupsResponse.data || []);
      } catch (err) {
        setIsAdmin(false);
        setGroups([]);
      }
    };
    initializeSidebarData();
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const adminBaseMenuItems = [
    { icon: <FaHome />, label: "Home", path: '/dashboard', action: () => navigate('/dashboard') },
    { icon: <FaBook />, label: "Guide", path: null, action: null },
    { icon: <FaBroadcastTower />, label: "Channels", path: null, action: null },
    { icon: <FaBroadcastTower />, label: "Broadcast", path: null, action: () => setShowBroadcastSubmenu((prev) => !prev) },
    { icon: <FaCommentDots />, label: "Moments", path: null, action: null },
    { icon: <FaCommentDots />, label: "Conversations", path: null, action: null },
    { icon: <FaRobot />, label: "Chatbots", path: null, action: null },
    { icon: <FaChartBar />, label: "Analyze", path: null, action: null },
    { icon: <FaUsers />, label: "People", path: null, action: () => setShowPeopleSubmenu((prev) => !prev) },
    { icon: <FaFileAlt />, label: "Content", path: null, action: null },
    { icon: <FaExchangeAlt />, label: "Exchange", path: null, action: null },
  ];

  const userBaseMenuItems = [
    { icon: <FaHome />, label: "Home", path: '/dashboard', action: () => navigate('/dashboard') },
    { icon: <FaBook />, label: "Guide", path: null, action: null },
    { icon: <FaBroadcastTower />, label: "Broadcast", path: null, action: () => setShowBroadcastSubmenu((prev) => !prev) },
    { icon: <FaUsers />, label: "People", path: null, action: () => setShowPeopleSubmenu((prev) => !prev) },
  ];

  const baseMenuItems = isAdmin ? adminBaseMenuItems : userBaseMenuItems;

  const broadcastSubMenuItems = [
    { icon: <FaEnvelope />, label: 'Send SMS', action: () => navigate('/sms/send') },
    { icon: <FaWhatsapp />, label: 'Send WhatsApp', action: null },
    { icon: <FaCommentDots />, label: 'Send RCS', action: null },
    { icon: <FaPhoneAlt />, label: 'Send Voice', action: null },
    { icon: <FaEnvelope />, label: 'Omni Channel', action: () => navigate('/sms/send') },
  ];

  const smsMenuItems = [
    {
      icon: <FaEnvelope />,
      label: isAdmin ? 'Send SMS' : 'My SMS',
      path: isAdmin ? '/sms/send' : '/sms/free-trial',
      action: () => navigate(isAdmin ? '/sms/send' : '/sms/free-trial'),
    },
    { icon: <FaHistory />, label: 'SMS History', path: '/sms/history', action: () => navigate('/sms/history') },
  ];

  const adminSMSMenuItems = [
    { icon: <FaCog />, label: "SMS Management", path: '/admin/sms', action: () => navigate('/admin/sms') },
    { icon: <FaKey />, label: "SMS Credentials", path: '/admin/sms/credentials', action: () => navigate('/admin/sms/credentials') },
    { icon: <FaFileAlt />, label: "DLT Config", path: '/admin/sms/credentials', action: () => navigate('/admin/sms/credentials') },
  ];

  const renderItem = (item, key, extraStyle = {}) => {
    const active = item.path && isActive(item.path);
    return (
      <div
        key={key}
        className={`menu-item${active ? ' active' : ''}`}
        onClick={item.action}
        title={!isOpen ? item.label : undefined}
        style={{
          cursor: item.action ? 'pointer' : 'default',
          opacity: item.action ? 1 : 0.5,
          ...extraStyle,
        }}
      >
        <span className="icon">{item.icon}</span>
        {isOpen && <span className="label">{item.label}</span>}
      </div>
    );
  };

  return (
    <div className={`sidebar ${isOpen ? "expanded" : "collapsed"}`}>
      {/* Top: Logo + Toggle */}
      <div className="sidebar-top">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden',
        }}>
          {/* Logo mark */}
          <div style={{
            width: '32px', height: '32px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7C5DC7, #A78BFA)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '11px', letterSpacing: '0.5px',
          }}>
            ABC
          </div>
          {isOpen && (
            <div className="company-name">ABC Company</div>
          )}
        </div>
        <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)} title={isOpen ? 'Collapse' : 'Expand'}>
          {isOpen ? "<<" : ">"}
        </button>
      </div>

      <div className="menu">
        {/* Base Menu Items */}
        {baseMenuItems.map((item, index) => (
          <React.Fragment key={`base-${index}`}>
            {renderItem(item, `base-item-${index}`)}

            {isOpen && item.label === 'Broadcast' && showBroadcastSubmenu && (
              <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
                {broadcastSubMenuItems.map((subItem, subIndex) => (
                  <div
                    key={`broadcast-sub-${subIndex}`}
                    className="menu-item"
                    onClick={subItem.action}
                    style={{
                      padding: '8px 10px', fontSize: '13px',
                      cursor: subItem.action ? 'pointer' : 'default',
                      opacity: subItem.action ? 1 : 0.5,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px', margin: '1px 0',
                    }}
                  >
                    <span className="icon">{subItem.icon}</span>
                    <span className="label">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}

            {isOpen && item.label === 'People' && showPeopleSubmenu && (
              <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
                {(groups || []).length === 0 ? (
                  <div style={{ padding: '6px 10px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>No groups yet</div>
                ) : (
                  groups.map((group) => (
                    <div
                      key={`people-group-${group.id}`}
                      className="menu-item"
                      onClick={() => navigate('/sms/send')}
                      style={{
                        padding: '8px 10px', fontSize: '12px', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.05)', borderRadius: '6px', margin: '1px 0',
                      }}
                      title={`${group.member_count || 0} members`}
                    >
                      <span className="icon"><FaUsers /></span>
                      <span className="label">{group.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Divider */}
        <div style={{ margin: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.12)' }} />

        {/* SMS Items */}
        {smsMenuItems.map((item, index) => renderItem(item, `sms-${index}`))}

        {/* Admin SMS Items */}
        {isAdmin && (
          <>
            <div style={{ margin: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.12)' }} />
            {adminSMSMenuItems.map((item, index) => renderItem(item, `admin-sms-${index}`, {
              background: isActive(item.path) ? 'rgba(167,139,250,0.20)' : 'rgba(255,255,255,0.06)',
              borderRadius: '6px', margin: '1px 6px',
            }))}
          </>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;


