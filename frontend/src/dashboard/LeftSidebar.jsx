import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaBroadcastTower,
  FaUsers,
  FaFileAlt,
  FaEnvelope,
  FaCog,
  FaKey,
  FaWhatsapp,
  FaPhoneAlt,
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,

} from "react-icons/fa";
import API from "../api";
import "../App.css";

const LeftSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupportUser, setIsSupportUser] = useState(false);
  const [showBroadcastSubmenu, setShowBroadcastSubmenu] = useState(false);
  const [showPeopleSubmenu, setShowPeopleSubmenu] = useState(false);
  const [showUtilitiesSubmenu, setShowUtilitiesSubmenu] = useState(false);
  const [sidebarNotice, setSidebarNotice] = useState('');
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
        setIsSupportUser(Boolean(profileResponse.data?.can_view_support_data || profileResponse.data?.is_employee) && !Boolean(profileResponse.data?.is_staff));
        setGroups(groupsResponse.data || []);
      } catch (err) {
        setIsAdmin(false);
        setIsSupportUser(false);
        setGroups([]);
      }
    };
    initializeSidebarData();
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const showRechargeNotice = () => {
    setSidebarNotice('please contact you supporter/admin for recharging your account');
  };

  const adminBaseMenuItems = [
    { icon: <FaHome />, label: "Home", path: '/dashboard', action: () => navigate('/dashboard') },
    { icon: <FaBroadcastTower />, label: "Broadcast", path: null, action: () => setShowBroadcastSubmenu((prev) => !prev) },
    { icon: <FaUsers />, label: "People", path: null, action: () => setShowPeopleSubmenu((prev) => !prev) },
    { icon: <FaChartLine />, label: "Reports", path: '/reports', action: () => navigate('/reports') },
    { icon: <FaMoneyBillWave />, label: "Utilities", path: null, action: () => setShowUtilitiesSubmenu((prev) => !prev) },
    { icon: <FaPhoneAlt />, label: "Contact Support", path: '/dashboard/contact-support', action: () => navigate('/dashboard/contact-support') },
  ];

  const userBaseMenuItems = [
    { icon: <FaHome />, label: "Home", path: '/dashboard', action: () => navigate('/dashboard') },
    { icon: <FaBook />, label: 'API Documentation', path: '/api-docs', action: () => navigate('/api-docs') },
    { icon: <FaBook />, label: "Guide", path: null, action: null },
    { icon: <FaBroadcastTower />, label: "Broadcast", path: null, action: () => setShowBroadcastSubmenu((prev) => !prev) },
    { icon: <FaUsers />, label: "People", path: null, action: () => setShowPeopleSubmenu((prev) => !prev) },
    { icon: <FaChartLine />, label: 'Reports', path: '/reports', action: () => navigate('/reports') },
    { icon: <FaMoneyBillWave />, label: "Utilities", path: null, action: () => setShowUtilitiesSubmenu((prev) => !prev) },
    { icon: <FaPhoneAlt />, label: "Contact Support", path: '/dashboard/contact-support', action: () => navigate('/dashboard/contact-support') },
  ];

  const supportBaseMenuItems = [
    { icon: <FaHome />, label: "Support Home", path: '/dashboard', action: () => navigate('/dashboard') },
    { icon: <FaUsers />, label: "Users", path: '/admin/users', action: () => navigate('/admin/users') },
    { icon: <FaChartLine />, label: "Reports", path: '/reports', action: () => navigate('/reports') },
    { icon: <FaWallet />, label: "Wallet & Credits", path: '/broadcast/email-validation', action: () => navigate('/broadcast/email-validation') },
    { icon: <FaPhoneAlt />, label: "Notifications", path: '/admin/notifications', action: () => navigate('/admin/notifications') },
  ];

  const baseMenuItems = isAdmin ? adminBaseMenuItems : (isSupportUser ? supportBaseMenuItems : userBaseMenuItems);
  const sendSmsRoute = isAdmin ? '/sms/send' : (isSupportUser ? '/sms/history' : '/sms/free-trial');

  const broadcastSubMenuItems = [
    { icon: <FaEnvelope />, label: 'Send SMS', action: () => navigate(sendSmsRoute) },
    { icon: <FaEnvelope />, label: 'Email Validation', action: () => navigate('/broadcast/email-validation') },
    { icon: <FaWhatsapp />, label: 'Send WhatsApp', action: null },
    { icon: <FaBroadcastTower />, label: 'Send RCS', action: null },
    { icon: <FaPhoneAlt />, label: 'Send Voice', action: null },
    { icon: <FaEnvelope />, label: 'Omni Channel', action: () => navigate('/sms/send') },
  ];

  const smsMenuItems = [
    {
      icon: <FaEnvelope />,
      label: isAdmin ? 'Send SMS' : (isSupportUser ? 'Read SMS' : 'My SMS'),
      path: isAdmin ? '/sms/send' : (isSupportUser ? '/sms/history' : '/sms/free-trial'),
      action: () => navigate(isAdmin ? '/sms/send' : (isSupportUser ? '/sms/history' : '/sms/free-trial')),
    },
  ];

  const utilitiesSubMenuItems = [
    { icon: <FaWallet />, label: 'Recharge Account', path: null, action: showRechargeNotice },
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
        aria-label={item.label}
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
          display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden',
        }}>
          {isOpen && (
            <div className="company-name">Bhisha</div>
          )}
        </div>
        <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)} title={isOpen ? 'Collapse' : 'Expand'}>
          <span className="toggle-glyph" aria-hidden="true">
            
            <span className="toggle-glyph-lines">
              <span />
              <span />
              <span />
            </span>
          </span>
        </button>
      </div>

      <div className="menu">
        {isOpen && sidebarNotice && (
          <div style={{ margin: '8px 10px 10px', padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.12)', color: '#f8fafc', fontSize: '12px', lineHeight: 1.5 }}>
            {sidebarNotice}
          </div>
        )}

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

            {isOpen && item.label === 'Utilities' && showUtilitiesSubmenu && (
              <div style={{ marginLeft: '12px', marginBottom: '4px' }}>
                {utilitiesSubMenuItems.map((subItem, subIndex) => {
                  const activeSubItem = Boolean(
                    subItem.path
                    && location.pathname === '/dashboard/recharge'
                    && subItem.path.includes('?')
                    && location.search.includes(subItem.path.split('?')[1])
                  );
                  return (
                    <div
                      key={`utilities-sub-${subIndex}`}
                      className={`menu-item${activeSubItem ? ' active' : ''}`}
                      onClick={subItem.action}
                      style={{
                        padding: '8px 10px', fontSize: '13px',
                        cursor: 'pointer',
                        opacity: 1,
                        background: activeSubItem ? 'rgba(167,139,250,0.20)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '6px', margin: '1px 0',
                      }}
                    >
                      <span className="icon">{subItem.icon}</span>
                      <span className="label">{subItem.label}</span>
                    </div>
                  );
                })}
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


