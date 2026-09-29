import React, { useState } from "react";

const Settings = () => {
  const [activeSetting, setActiveSetting] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [accountData, setAccountData] = useState({
    username: "",
    email: "",
    password: "",
    mobile: "",
  });

  const [passwordEnabled, setPasswordEnabled] = useState(false);

  const [whatsappData, setWhatsappData] = useState({
    phoneNumber: "",
    businessName: "",
    phoneNumberId: "",
    accessToken: "",
  });

  const handleAccountChange = (e) => {
    setAccountData({
      ...accountData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWhatsappChange = (e) => {
    setWhatsappData({
      ...whatsappData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSettingClick = (setting) => {
    setActiveSetting(setting);
    setIsEditing(false);
  };

  const togglePassword = () => {
    setPasswordEnabled((previous) => !previous);
  };

  return (
    <>
      <div className="settings-page">
        <div className="settings-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account and WhatsApp settings</p>
          </div>
        </div>

        {!activeSetting && (
          <div className="settings-options">
            <button
              className="main-setting-option"
              onClick={() => handleSettingClick("account")}
            >
              <div className="option-left">
                <div className="option-icon account-icon">👤</div>

                <div>
                  <h3>Account Settings</h3>
                  <p>Manage your account information</p>
                </div>
              </div>

              <span className="option-arrow">›</span>
            </button>

            <button
              className="main-setting-option"
              onClick={() => handleSettingClick("whatsapp")}
            >
              <div className="option-left">
                <div className="option-icon whatsapp-icon">💬</div>

                <div>
                  <h3>WhatsApp Settings</h3>
                  <p>Manage your WhatsApp integration</p>
                </div>
              </div>

              <span className="option-arrow">›</span>
            </button>
          </div>
        )}

        {activeSetting && (
          <div className="settings-content">
            <button
              className="back-button"
              onClick={() => {
                setActiveSetting(null);
                setIsEditing(false);
              }}
            >
              ← Back to Settings
            </button>

            {activeSetting === "account" && (
              <div className="settings-card">
                <div className="card-header">
                  <div>
                    <h2>Account Settings</h2>
                    <p>Manage your account information</p>
                  </div>

                  {!isEditing && (
                    <button
                      className="edit-button"
                      onClick={() => setIsEditing(true)}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                <div className="divider"></div>

                <div className="form-row">
                  <div className="form-label">
                    <label>Username</label>
                  </div>

                  <div className="form-value">
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={accountData.username}
                        onChange={handleAccountChange}
                      />
                    ) : (
                      <div className="display-value"></div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label">
                    <label>Email</label>
                  </div>

                  <div className="form-value">
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={accountData.email}
                        onChange={handleAccountChange}
                      />
                    ) : (
                      <div className="display-value"></div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label">
                    <label>Password</label>
                  </div>

                  <div className="password-section">
                    {isEditing ? (
                      <input
                        type={passwordEnabled ? "text" : "password"}
                        name="password"
                        value={accountData.password}
                        onChange={handleAccountChange}
                      />
                    ) : (
                      <div className="display-value password-display">
                        {accountData.password
                          ? passwordEnabled
                            ? accountData.password
                            : "••••••••••••"
                          : ""}
                      </div>
                    )}

                    <div className="password-toggle">
                      <span>
                        {passwordEnabled ? "Enable" : "Disable"}
                      </span>

                      <button
                        type="button"
                        className={`toggle-button ${
                          passwordEnabled ? "enabled" : "disabled"
                        }`}
                        onClick={togglePassword}
                        aria-label={
                          passwordEnabled
                            ? "Disable password visibility"
                            : "Enable password visibility"
                        }
                      >
                        <span className="toggle-circle"></span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label">
                    <label>Registered Mobile Number</label>
                  </div>

                  <div className="form-value">
                    {isEditing ? (
                      <input
                        type="tel"
                        name="mobile"
                        value={accountData.mobile}
                        onChange={handleAccountChange}
                      />
                    ) : (
                      <div className="display-value"></div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="action-buttons">
                    <button
                      className="cancel-button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>

                    <button
                      className="save-button"
                      onClick={handleSave}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSetting === "whatsapp" && (
              <div className="settings-card">
                <div className="card-header">
                  <div>
                    <h2>WhatsApp Settings</h2>
                    <p>Manage your WhatsApp Business integration</p>
                  </div>

                  {!isEditing && (
                    <button
                      className="edit-button"
                      onClick={() => setIsEditing(true)}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                <div className="divider"></div>

                <div className="form-row">
                  <div className="form-label">
                    <label>WhatsApp Number</label>
                  </div>

                  <div className="form-value">
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={whatsappData.phoneNumber}
                        onChange={handleWhatsappChange}
                      />
                    ) : (
                      <div className="display-value"></div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label">
                    <label>Business Name</label>
                  </div>

                  <div className="form-value">
                    {isEditing ? (
                      <input
                        type="text"
                        name="businessName"
                        value={whatsappData.businessName}
                        onChange={handleWhatsappChange}
                      />
                    ) : (
                      <div className="display-value"></div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label">
                    <label>Phone Number ID</label>
                  </div>

                  <div className="form-value">
                    {isEditing ? (
                      <input
                        type="text"
                        name="phoneNumberId"
                        value={whatsappData.phoneNumberId}
                        onChange={handleWhatsappChange}
                      />
                    ) : (
                      <div className="display-value"></div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-label">
                    <label>Access Token</label>
                  </div>

                  <div className="form-value">
                    {isEditing ? (
                      <input
                        type="password"
                        name="accessToken"
                        value={whatsappData.accessToken}
                        onChange={handleWhatsappChange}
                      />
                    ) : (
                      <div className="display-value"></div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="action-buttons">
                    <button
                      className="cancel-button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>

                    <button
                      className="save-button"
                      onClick={handleSave}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .settings-page {
          min-height: 100vh;
          background: #f7f8fa;
          padding: 30px;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        }

        .settings-header {
          margin-bottom: 25px;
        }

        .settings-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }

        .settings-header p {
          margin: 7px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .settings-options {
          width: 100%;
          max-width: 850px;
          margin: 20px auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .main-setting-option {
          width: 100%;
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .main-setting-option:hover {
          border-color: #22c55e;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .option-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .option-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 22px;
        }

        .account-icon {
          background: #eff6ff;
        }

        .whatsapp-icon {
          background: #ecfdf5;
        }

        .option-left h3 {
          margin: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 600;
        }

        .option-left p {
          margin: 5px 0 0;
          color: #9ca3af;
          font-size: 13px;
        }

        .option-arrow {
          font-size: 28px;
          color: #9ca3af;
          line-height: 1;
        }

        .settings-content {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
        }

        .back-button {
          border: none;
          background: transparent;
          color: #16a34a;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 0;
          margin-bottom: 12px;
        }

        .back-button:hover {
          color: #15803d;
        }

        .settings-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
        }

        .card-header h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
        }

        .card-header p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .edit-button {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          padding: 9px 17px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: 0.2s;
        }

        .edit-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
        }

        .form-row {
          display: grid;
          grid-template-columns: 40% 60%;
          padding: 22px 28px;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
        }

        .form-label label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .form-value {
          width: 100%;
        }

        .display-value {
          width: 100%;
          min-height: 42px;
          padding: 10px 13px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          background: #f9fafb;
        }

        .password-display {
          display: flex;
          align-items: center;
        }

        .form-value input,
        .password-section input {
          width: 100%;
          height: 42px;
          padding: 10px 13px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          outline: none;
          font-size: 14px;
          color: #374151;
          background: white;
        }

        .form-value input:focus,
        .password-section input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.12);
        }

        .password-section {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .password-section input,
        .password-section .display-value {
          flex: 1;
        }

        .password-toggle {
          display: flex;
          align-items: center;
          gap: 9px;
          white-space: nowrap;
          font-size: 12px;
          color: #6b7280;
        }

        .toggle-button {
          width: 42px;
          height: 23px;
          padding: 0;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          position: relative;
          transition: background 0.25s ease;
        }

        .toggle-button.disabled {
          background: #d1d5db;
        }

        .toggle-button.enabled {
          background: #22c55e;
        }

        .toggle-circle {
          position: absolute;
          width: 17px;
          height: 17px;
          top: 3px;
          left: 3px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform 0.25s ease;
        }

        .toggle-button.enabled .toggle-circle {
          transform: translateX(19px);
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px 28px;
          background: #fafafa;
        }

        .cancel-button {
          padding: 10px 18px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 7px;
          cursor: pointer;
          color: #374151;
          font-weight: 600;
        }

        .cancel-button:hover {
          background: #f3f4f6;
        }

        .save-button {
          padding: 10px 18px;
          border: none;
          background: #16a34a;
          color: white;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
        }

        .save-button:hover {
          background: #15803d;
        }

        @media (max-width: 850px) {
          .settings-page {
            padding: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        @media (max-width: 550px) {
          .settings-page {
            padding: 12px;
          }

          .card-header {
            padding: 18px;
          }

          .form-row {
            padding: 18px;
          }

          .password-section {
            flex-direction: column;
            align-items: stretch;
          }

          .password-toggle {
            justify-content: flex-end;
          }
        }
      `}</style>
    </>
  );
};

export default Settings;

