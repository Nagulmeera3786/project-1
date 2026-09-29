import React, { useEffect, useRef, useState } from "react";
import API from "../api";

export default function AdminWhatsAppAccounts() {
  const [openOption, setOpenOption] = useState("Account Overview");
  const [selectedPage, setSelectedPage] = useState("Account Overview");
  const workspaceRef = useRef(null);

  const options = [
    {
      name: "Account Overview",
      icon: "▣",
    },
    
    {
      name: "Business Profile",
      icon: "▤",
      subOptions: ["Business Details", "Contact Information"],
    },
    {
      name: "Users & Permissions",
      icon: "♙",
      subOptions: ["Users", "Roles & Permissions"],
    },
    {
      name: "API Configuration",
      icon: "</>",
      subOptions: ["API Settings", "Webhooks"],
    },
    {
      name: "Security",
      icon: "◇",
      subOptions: ["Access Control", "Security Settings"],
    },
    {
      name: "Account Activity",
      icon: "◷",
      subOptions: ["Activity Logs", "Login History"],
    },
  ];

  useEffect(() => {
    const workspace = workspaceRef.current;

    const handleMouseLeave = (event) => {
      if (
        workspace &&
        (!event.relatedTarget || !workspace.contains(event.relatedTarget))
      ) {
        setOpenOption(null);
        setSelectedPage(null);
      }
    };

    if (workspace) {
      workspace.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (workspace) {
        workspace.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  const handleOptionClick = (option) => {
    setSelectedPage(option.name);

    if (option.subOptions) {
      setOpenOption(
        openOption === option.name ? null : option.name
      );
    } else {
      setOpenOption(option.name);
    }
  };

  const handleSubOptionClick = (subOption, parentName) => {
    setSelectedPage(subOption);
    setOpenOption(parentName);
  };

  const renderPage = () => {
    switch (selectedPage) {
      case "Account Overview":
        return <AccountOverview />;
     
      case "Business Profile":
        return <BusinessProfileOverview />;

      case "Business Details":
        return <BusinessDetails />;

      case "Contact Information":
        return <ContactInformation />;

      case "Users & Permissions":
        return <UsersPermissionsOverview />;

      case "Users":
        return <Users />;

      case "Roles & Permissions":
        return <RolesPermissions />;

      case "API Configuration":
        return <APIConfigurationOverview />;

      case "API Settings":
        return <APISettings />;

      case "Webhooks":
        return <Webhooks />;

      case "Security":
        return <SecurityOverview />;

      case "Access Control":
        return <AccessControl />;

      case "Security Settings":
        return <SecuritySettings />;

      case "Account Activity":
        return <AccountActivityOverview />;

      case "Activity Logs":
        return <ActivityLogs />;

      case "Login History":
        return <LoginHistory />;

      default:
        return null;
    }
  };

  return (
    <div className="wa-page">
      <div className="wa-header">
        <div>
          <h1>WhatsApp Accounts</h1>
          <p>Manage WhatsApp business accounts and configurations</p>
        </div>
      </div>

      <div className="wa-accounts-layout" ref={workspaceRef}>
        <aside className="wa-sidebar">
          {options.map((option) => (
            <div key={option.name}>
              <button
                className={`wa-sidebar-item ${
                  selectedPage === option.name ||
                  openOption === option.name
                    ? "active"
                    : ""
                }`}
                onClick={() => handleOptionClick(option)}
              >
                <span className="wa-sidebar-icon">
                  {option.icon}
                </span>

                <span className="wa-sidebar-text">
                  {option.name}
                </span>

                {option.subOptions && (
                  <span className="wa-arrow">
                    {openOption === option.name ? "⌃" : "⌄"}
                  </span>
                )}
              </button>

              {option.subOptions &&
                openOption === option.name && (
                  <div className="wa-submenu">
                    {option.subOptions.map((subOption) => (
                      <button
                        key={subOption}
                        className={`wa-submenu-item ${
                          selectedPage === subOption
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleSubOptionClick(
                            subOption,
                            option.name
                          )
                        }
                      >
                        {subOption}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </aside>

        <main className="wa-content">
          {selectedPage ? (
            renderPage()
          ) : (
            <div className="wa-empty">
              <div className="wa-empty-icon">◉</div>
              <h2>Select an option</h2>
              <p>
                Select an option from the menu to view its
                details.
              </p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .wa-page {
          min-height: 100vh;
          background: #f7f9fc;
          padding: 28px;
          color: #27324a;
          font-family: Arial, sans-serif;
        }

        .wa-header {
          margin-bottom: 22px;
        }

        .wa-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #27324a;
        }

        .wa-header p {
          margin: 7px 0 0;
          color: #7a8499;
          font-size: 14px;
        }

        .wa-accounts-layout {
          display: flex;
          align-items: stretch;
          gap: 22px;
          min-height: 650px;
        }

        .wa-sidebar {
          width: 245px;
          flex-shrink: 0;
          background: #ffffff;
          border: 1px solid #e5eaf2;
          border-radius: 14px;
          padding: 12px;
          box-shadow: 0 4px 18px rgba(44, 62, 80, 0.05);
        }

        .wa-sidebar-item {
          width: 100%;
          border: none;
          background: transparent;
          min-height: 48px;
          padding: 11px 12px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 11px;
          cursor: pointer;
          color: #5e6a80;
          font-size: 14px;
          text-align: left;
          transition: 0.2s ease;
        }

        .wa-sidebar-item:hover {
          background: #f2f5ff;
          color: #6845d7;
        }

        .wa-sidebar-item.active {
          background: #eeeaff;
          color: #6845d7;
          font-weight: 600;
        }

        .wa-sidebar-icon {
          width: 22px;
          min-width: 22px;
          text-align: center;
          font-size: 17px;
          color: #6845d7;
        }

        .wa-sidebar-text {
          flex: 1;
        }

        .wa-arrow {
          font-size: 15px;
          color: #8a94a8;
        }

        .wa-submenu {
          padding: 3px 0 7px 34px;
        }

        .wa-submenu-item {
          width: 100%;
          border: none;
          background: transparent;
          padding: 9px 10px;
          border-radius: 7px;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          color: #727d91;
          transition: 0.2s ease;
        }

        .wa-submenu-item:hover {
          background: #f5f3ff;
          color: #6845d7;
        }

        .wa-submenu-item.active {
          background: #f0edff;
          color: #6845d7;
          font-weight: 600;
        }

        .wa-content {
          flex: 1;
          min-width: 0;
          background: #ffffff;
          border: 1px solid #e5eaf2;
          border-radius: 14px;
          padding: 28px;
          box-shadow: 0 4px 18px rgba(44, 62, 80, 0.05);
        }

        .wa-container h2 {
          margin: 0;
          color: #27324a;
          font-size: 22px;
        }

        .wa-container > p {
          color: #7a8499;
          font-size: 14px;
          margin: 7px 0 24px;
        }

        .wa-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .wa-stat-card {
          border: 1px solid #e6eaf1;
          border-radius: 12px;
          padding: 20px;
          background: #fbfcff;
        }

        .wa-stat-label {
          color: #7c879b;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .wa-stat-value {
          color: #27324a;
          font-size: 25px;
          font-weight: 700;
        }

        .wa-section {
          border: 1px solid #e7ebf2;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 18px;
          background: #ffffff;
        }

        .wa-section h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #35405a;
        }

        .wa-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .wa-info-box {
          background: #f8faff;
          border: 1px solid #e8edf5;
          border-radius: 10px;
          padding: 16px;
        }

        .wa-info-title {
          color: #7a8499;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .wa-info-value {
          color: #34405a;
          font-size: 14px;
          font-weight: 600;
        }

        .wa-status {
          display: inline-flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 20px;
          background: #e9f8ef;
          color: #27834a;
          font-size: 12px;
          font-weight: 600;
        }

        .wa-status.warning {
          background: #fff5df;
          color: #a76a00;
        }

        .wa-status.inactive {
          background: #f1f3f6;
          color: #737d8f;
        }

        .wa-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .wa-action-card {
          border: 1px solid #e5eaf2;
          border-radius: 12px;
          padding: 18px;
          background: #fbfcff;
        }

        .wa-action-card h4 {
          margin: 0 0 7px;
          color: #35405a;
          font-size: 15px;
        }

        .wa-action-card p {
          margin: 0 0 15px;
          color: #7a8499;
          font-size: 13px;
          line-height: 1.5;
        }

        .wa-button {
          border: none;
          border-radius: 7px;
          padding: 9px 15px;
          background: #6845d7;
          color: white;
          cursor: pointer;
          font-size: 13px;
        }

        .wa-button.secondary {
          background: #eeeaff;
          color: #6845d7;
        }

        .wa-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .wa-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #e7ebf2;
          border-radius: 10px;
          padding: 15px;
          background: #fbfcff;
        }

        .wa-list-left strong {
          display: block;
          color: #35405a;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .wa-list-left span {
          color: #8791a4;
          font-size: 12px;
        }

        .wa-form {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .wa-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .wa-form-group.full {
          grid-column: 1 / -1;
        }

        .wa-form-group label {
          font-size: 13px;
          color: #566177;
          font-weight: 600;
        }

        .wa-form-group input,
        .wa-form-group select,
        .wa-form-group textarea {
          width: 100%;
          border: 1px solid #dfe5ee;
          border-radius: 8px;
          padding: 10px 12px;
          outline: none;
          color: #3d4860;
          background: #ffffff;
          font-size: 13px;
        }

        .wa-form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .wa-form-group input:focus,
        .wa-form-group select:focus,
        .wa-form-group textarea:focus {
          border-color: #9b88e8;
          box-shadow: 0 0 0 3px #f0edff;
        }

        .wa-empty {
          min-height: 580px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .wa-empty-icon {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #eeeaff;
          color: #6845d7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          margin-bottom: 15px;
        }

        .wa-empty h2 {
          margin: 0 0 7px;
          font-size: 20px;
          color: #35405a;
        }

        .wa-empty p {
          margin: 0;
          color: #8a94a8;
          font-size: 14px;
        }

        .wa-table {
          width: 100%;
          border-collapse: collapse;
        }

        .wa-table th {
          text-align: left;
          padding: 13px;
          background: #f7f9fc;
          color: #68748a;
          font-size: 12px;
          font-weight: 600;
        }

        .wa-table td {
          padding: 14px 13px;
          border-bottom: 1px solid #edf0f5;
          color: #4c5870;
          font-size: 13px;
        }

        .wa-table tr:last-child td {
          border-bottom: none;
        }

        @media (max-width: 900px) {
          .wa-accounts-layout {
            flex-direction: column;
          }

          .wa-sidebar {
            width: 100%;
          }

          .wa-stats,
          .wa-info-grid,
          .wa-actions,
          .wa-form {
            grid-template-columns: 1fr;
          }

          .wa-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}

function PageContainer({ title, description, children }) {
  return (
    <div className="wa-container">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="wa-stat-card">
      <div className="wa-stat-label">{label}</div>
      <div className="wa-stat-value">{value}</div>
    </div>
  );
}

function ActionCard({ title, description, button }) {
  return (
    <div className="wa-action-card">
      <h4>{title}</h4>
      <p>{description}</p>
      <button className="wa-button secondary">
        {button}
      </button>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
  full = false,
}) {
  return (
    <div className={`wa-form-group ${full ? "full" : ""}`}>
      <label>{label}</label>
      {type === "textarea" ? (
        <textarea placeholder={placeholder}></textarea>
      ) : (
        <input type={type} placeholder={placeholder} />
      )}
    </div>
  );
}

function AccountOverview() {
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    API.get("whatsapp-account-overview/")
      .then((response) => {
        setAccountName(response.data.account_name);
        setAccountId(response.data.account_id);
      })
      .catch((error) => {
        console.error("Failed to load WhatsApp account overview:", error);
      });
  }, []);

  return (
    <PageContainer
      title="Account Overview"
      description="View the overall WhatsApp account information."
    >
      <div className="wa-section">
        <h3>Account Information</h3>

        <div className="wa-info-grid">
          <div className="wa-info-box">
            <div className="wa-info-title">Account Name</div>
            <div className="wa-info-value">
              {accountName}
            </div>
          </div>

          <div className="wa-info-box">
            <div className="wa-info-title">Account ID</div>
            <div className="wa-info-value">
              {accountId}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
function WhatsAppNumbersOverview() {
  return (
    <PageContainer
      title="WhatsApp Numbers"
      description="Manage all WhatsApp numbers connected to the account."
    >
      <div className="wa-stats">
        <StatCard label="Total Numbers" value="3" />
        <StatCard label="Connected" value="2" />
        <StatCard label="Pending" value="1" />
      </div>

      <div className="wa-section">
        <h3>Number Management</h3>

        <div className="wa-actions">
          <ActionCard
            title="Connected Numbers"
            description="View and manage connected WhatsApp numbers."
            button="View Numbers"
          />

          <ActionCard
            title="Add Number"
            description="Connect a new WhatsApp number."
            button="Add Number"
          />
        </div>
      </div>
    </PageContainer>
  );
}


function BusinessProfileOverview() {
  return (
    <PageContainer
      title="Business Profile"
      description="Manage business profile information."
    >
      <div className="wa-actions">
        <ActionCard
          title="Business Details"
          description="Manage business name, category and description."
          button="Manage Details"
        />

        <ActionCard
          title="Contact Information"
          description="Manage email, phone and website information."
          button="Manage Contact"
        />
      </div>
    </PageContainer>
  );
}

function BusinessDetails() {
  return (
    <PageContainer
      title="Business Details"
      description="Update the basic business profile information."
    >
      <div className="wa-section">
        <div className="wa-form">
          <FormField
            label="Business Name"
            placeholder="Enter business name"
          />

          <FormField
            label="Business Category"
            placeholder="Select category"
          />

          <FormField
            label="Business Description"
            placeholder="Enter description"
            type="textarea"
            full
          />

          <div className="wa-form-group full">
            <button className="wa-button">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function ContactInformation() {
  return (
    <PageContainer
      title="Contact Information"
      description="Manage business contact details."
    >
      <div className="wa-section">
        <div className="wa-form">
          <FormField
            label="Email"
            placeholder="info@example.com"
            type="email"
          />

          <FormField
            label="Phone"
            placeholder="+91 XXXXX XXXXX"
          />

          <FormField
            label="Website"
            placeholder="https://example.com"
            full
          />

          <div className="wa-form-group full">
            <button className="wa-button">
              Save Contact Information
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function UsersPermissionsOverview() {
  return (
    <PageContainer
      title="Users & Permissions"
      description="Manage users and their account permissions."
    >
      <div className="wa-stats">
        <StatCard label="Total Users" value="12" />
        <StatCard label="Administrators" value="3" />
        <StatCard label="Agents" value="9" />
      </div>

      <div className="wa-actions">
        <ActionCard
          title="Users"
          description="View and manage account users."
          button="View Users"
        />

        <ActionCard
          title="Roles & Permissions"
          description="Configure roles and access permissions."
          button="Manage Roles"
        />
      </div>
    </PageContainer>
  );
}

function Users() {
  return (
    <PageContainer
      title="Users"
      description="Manage users who have access to the account."
    >
      <div className="wa-section">
        <table className="wa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Admin User</td>
              <td>admin@example.com</td>
              <td>Administrator</td>
              <td>
                <span className="wa-status">Active</span>
              </td>
            </tr>

            <tr>
              <td>Sales User</td>
              <td>sales@example.com</td>
              <td>Agent</td>
              <td>
                <span className="wa-status">Active</span>
              </td>
            </tr>

            <tr>
              <td>Support User</td>
              <td>support@example.com</td>
              <td>Agent</td>
              <td>
                <span className="wa-status">Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}

function RolesPermissions() {
  return (
    <PageContainer
      title="Roles & Permissions"
      description="Configure access levels for different roles."
    >
      <div className="wa-list">
        <div className="wa-list-item">
          <div className="wa-list-left">
            <strong>Administrator</strong>
            <span>Full account access</span>
          </div>

          <button className="wa-button secondary">
            Edit
          </button>
        </div>

        <div className="wa-list-item">
          <div className="wa-list-left">
            <strong>Manager</strong>
            <span>Manage users, messages and reports</span>
          </div>

          <button className="wa-button secondary">
            Edit
          </button>
        </div>

        <div className="wa-list-item">
          <div className="wa-list-left">
            <strong>Agent</strong>
            <span>Manage assigned conversations</span>
          </div>

          <button className="wa-button secondary">
            Edit
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

function APIConfigurationOverview() {
  return (
    <PageContainer
      title="API Configuration"
      description="Manage API and webhook configuration."
    >
      <div className="wa-actions">
        <ActionCard
          title="API Settings"
          description="Manage API credentials and connection settings."
          button="Open API Settings"
        />

        <ActionCard
          title="Webhooks"
          description="Configure webhook URLs and events."
          button="Manage Webhooks"
        />
      </div>
    </PageContainer>
  );
}

function APISettings() {
  return (
    <PageContainer
      title="API Settings"
      description="Configure API access for the account."
    >
      <div className="wa-section">
        <div className="wa-form">
          <FormField
            label="API Key"
            placeholder="Enter API key"
          />

          <FormField
            label="API Version"
            placeholder="v1.0"
          />

          <FormField
            label="Base URL"
            placeholder="https://api.example.com"
            full
          />

          <div className="wa-form-group full">
            <button className="wa-button">
              Save API Settings
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function Webhooks() {
  return (
    <PageContainer
      title="Webhooks"
      description="Configure webhook endpoints and events."
    >
      <div className="wa-section">
        <div className="wa-form">
          <FormField
            label="Webhook URL"
            placeholder="https://example.com/webhook"
            full
          />

          <FormField
            label="Verify Token"
            placeholder="Enter verify token"
          />

          <FormField
            label="Webhook Status"
            placeholder="Enabled"
          />

          <div className="wa-form-group full">
            <button className="wa-button">
              Save Webhook
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function SecurityOverview() {
  return (
    <PageContainer
      title="Security"
      description="Manage account security and access controls."
    >
      <div className="wa-stats">
        <StatCard label="Access Control" value="Enabled" />
        <StatCard label="2FA" value="Enabled" />
        <StatCard label="Sessions" value="4" />
      </div>

      <div className="wa-actions">
        <ActionCard
          title="Access Control"
          description="Manage login and user access controls."
          button="Manage Access"
        />

        <ActionCard
          title="Security Settings"
          description="Configure account security settings."
          button="Open Settings"
        />
      </div>
    </PageContainer>
  );
}

function AccessControl() {
  return (
    <PageContainer
      title="Access Control"
      description="Manage account access restrictions."
    >
      <div className="wa-section">
        <div className="wa-list">
          <div className="wa-list-item">
            <div className="wa-list-left">
              <strong>Two-Factor Authentication</strong>
              <span>Additional login verification</span>
            </div>

            <span className="wa-status">Enabled</span>
          </div>

          <div className="wa-list-item">
            <div className="wa-list-left">
              <strong>IP Restrictions</strong>
              <span>Restrict access to approved IP addresses</span>
            </div>

            <span className="wa-status inactive">
              Disabled
            </span>
          </div>

          <div className="wa-list-item">
            <div className="wa-list-left">
              <strong>Session Management</strong>
              <span>Control active login sessions</span>
            </div>

            <button className="wa-button secondary">
              Manage
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function SecuritySettings() {
  return (
    <PageContainer
      title="Security Settings"
      description="Configure security preferences."
    >
      <div className="wa-section">
        <div className="wa-list">
          <div className="wa-list-item">
            <div className="wa-list-left">
              <strong>Two-Factor Authentication</strong>
              <span>Require verification during login</span>
            </div>

            <span className="wa-status">Enabled</span>
          </div>

          <div className="wa-list-item">
            <div className="wa-list-left">
              <strong>Password Expiry</strong>
              <span>Require periodic password changes</span>
            </div>

            <span className="wa-status">Enabled</span>
          </div>

          <div className="wa-list-item">
            <div className="wa-list-left">
              <strong>Login Notifications</strong>
              <span>Notify administrators about new logins</span>
            </div>

            <span className="wa-status">Enabled</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function AccountActivityOverview() {
  return (
    <PageContainer
      title="Account Activity"
      description="Review recent account activity and login history."
    >
      <div className="wa-actions">
        <ActionCard
          title="Activity Logs"
          description="Review actions performed within the account."
          button="View Activity"
        />

        <ActionCard
          title="Login History"
          description="Review recent account login activity."
          button="View Login History"
        />
      </div>
    </PageContainer>
  );
}

function ActivityLogs() {
  return (
    <PageContainer
      title="Activity Logs"
      description="Review recent actions performed in the account."
    >
      <div className="wa-section">
        <table className="wa-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Updated business profile</td>
              <td>Admin User</td>
              <td>16 Sep 2026</td>
              <td>
                <span className="wa-status">Success</span>
              </td>
            </tr>

            <tr>
              <td>Added WhatsApp number</td>
              <td>Admin User</td>
              <td>15 Sep 2026</td>
              <td>
                <span className="wa-status">Success</span>
              </td>
            </tr>

            <tr>
              <td>Updated API settings</td>
              <td>Admin User</td>
              <td>14 Sep 2026</td>
              <td>
                <span className="wa-status">Success</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}

function LoginHistory() {
  return (
    <PageContainer
      title="Login History"
      description="Review recent login activity."
    >
      <div className="wa-section">
        <table className="wa-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Admin User</td>
              <td>India</td>
              <td>16 Sep 2026</td>
              <td>
                <span className="wa-status">Successful</span>
              </td>
            </tr>

            <tr>
              <td>Sales User</td>
              <td>India</td>
              <td>16 Sep 2026</td>
              <td>
                <span className="wa-status">Successful</span>
              </td>
            </tr>

            <tr>
              <td>Support User</td>
              <td>India</td>
              <td>15 Sep 2026</td>
              <td>
                <span className="wa-status">Successful</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}