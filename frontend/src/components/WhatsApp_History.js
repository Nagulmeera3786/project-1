import React, { useEffect, useRef, useState } from "react";

function History() {
  const [openSection, setOpenSection] = useState(null);

  const historyListRef = useRef(null);

  const toggleSection = (section) => {
    setOpenSection((current) =>
      current === section ? null : section
    );
  };

  // Close opened option when clicking outside the History options
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        historyListRef.current &&
        !historyListRef.current.contains(event.target)
      ) {
        setOpenSection(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .history-container {
            min-height: 100vh;
            padding: 42px;
            background:
              radial-gradient(
                circle at top left,
                rgba(59, 130, 246, 0.08),
                transparent 35%
              ),
              radial-gradient(
                circle at bottom right,
                rgba(16, 185, 129, 0.07),
                transparent 35%
              ),
              #f7f9fc;
            font-family:
              "Inter",
              "Segoe UI",
              Arial,
              Helvetica,
              sans-serif;
          }

          .history-wrapper {
            width: 100%;
            max-width: 920px;
            margin: 0 auto;
          }

          /* HEADER */

          .history-header {
            margin-bottom: 30px;
          }

          .history-header h1 {
            margin: 0;
            color: #172033;
            font-size: 31px;
            font-weight: 750;
            letter-spacing: -0.7px;
          }

          .history-header p {
            margin: 9px 0 0;
            color: #7a8497;
            font-size: 14px;
            line-height: 1.6;
          }

          /* HISTORY LIST */

          .history-list {
            display: flex;
            flex-direction: column;
            gap: 13px;
          }

          /* MAIN CARD */

          .history-option {
            position: relative;
            background: #ffffff;
            border: 1px solid #e7ebf2;
            border-radius: 16px;
            overflow: hidden;
            box-shadow:
              0 3px 10px rgba(25, 42, 70, 0.035),
              0 12px 28px rgba(25, 42, 70, 0.035);
            transition:
              transform 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .history-option:hover {
            border-color: #dce3ee;
            box-shadow:
              0 5px 14px rgba(25, 42, 70, 0.06),
              0 15px 30px rgba(25, 42, 70, 0.05);
          }

          /* BUTTON */

          .history-button {
            position: relative;
            width: 100%;
            min-height: 70px;
            padding: 0 22px;
            border: none;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            text-align: left;
            color: #202b3d;
            font-family: inherit;
            font-size: 15.5px;
            font-weight: 650;
            transition:
              background 0.2s ease,
              color 0.2s ease;
          }

          .history-button:hover {
            background: #fbfcff;
            color: #3157a5;
          }

          /* LEFT SIDE */

          .history-button-left {
            display: flex;
            align-items: center;
            gap: 15px;
            min-width: 0;
          }

          /* ICON */

          .history-icon {
            position: relative;
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef4ff;
            color: #3867c8;
            font-size: 15px;
            font-weight: 750;
            border: 1px solid #e1eaff;
            transition:
              transform 0.2s ease,
              background 0.2s ease,
              color 0.2s ease;
          }

          .history-button:hover .history-icon {
            transform: translateY(-1px);
            background: #e6efff;
            color: #2f5fc0;
          }

          /* DIFFERENT ICON COLORS */

          .message-option .history-icon {
            background: #edf4ff;
            border-color: #dce9ff;
            color: #3970d0;
          }

          .conversation-option .history-icon {
            background: #ecfbf5;
            border-color: #d7f4e8;
            color: #179568;
          }

          .campaign-option .history-icon {
            background: #fff3ec;
            border-color: #ffe5d5;
            color: #dc7338;
          }

          .template-option .history-icon {
            background: #f4efff;
            border-color: #e8ddff;
            color: #7651c9;
          }

          .media-option .history-icon {
            background: #eefafa;
            border-color: #daf2f2;
            color: #168f9a;
          }

          .call-option .history-icon {
            background: #fff0f3;
            border-color: #ffe0e7;
            color: #d14f70;
          }

          .activity-option .history-icon {
            background: #fff8e9;
            border-color: #ffedc5;
            color: #c68a18;
          }

          /* ARROW */

          .history-arrow {
            width: 30px;
            height: 30px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: #f4f6fa;
            color: #8993a5;
            font-size: 11px;
            transition:
              transform 0.25s ease,
              background 0.2s ease,
              color 0.2s ease;
          }

          .history-arrow.open {
            transform: rotate(180deg);
            background: #edf3ff;
            color: #3867c8;
          }

          .history-button:hover .history-arrow {
            background: #edf3ff;
            color: #3867c8;
          }

          /* SUB OPTIONS */

          .sub-options {
            padding: 7px 22px 18px 79px;
            background: #fbfcfe;
            border-top: 1px solid #edf0f5;
            animation: historySlideDown 0.2s ease;
          }

          @keyframes historySlideDown {
            from {
              opacity: 0;
              transform: translateY(-5px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .sub-option {
            position: relative;
            display: flex;
            align-items: center;
            min-height: 43px;
            margin-top: 5px;
            padding: 8px 15px 8px 18px;
            border-radius: 9px;
            color: #687386;
            background: transparent;
            font-size: 13.5px;
            font-weight: 500;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease,
              transform 0.2s ease,
              padding-left 0.2s ease;
          }

          .sub-option::before {
            content: "";
            position: absolute;
            left: 5px;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #aeb7c7;
            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .sub-option:hover {
            padding-left: 22px;
            background: #f0f5ff;
            color: #3867c8;
            transform: translateX(2px);
          }

          .sub-option:hover::before {
            background: #3867c8;
            transform: scale(1.25);
          }

          /* DIFFERENT SUBOPTION HOVER COLORS */

          .message-option .sub-option:hover {
            background: #f0f5ff;
            color: #3867c8;
          }

          .message-option .sub-option:hover::before {
            background: #3867c8;
          }

          .conversation-option .sub-option:hover {
            background: #effbf6;
            color: #16875f;
          }

          .conversation-option .sub-option:hover::before {
            background: #179568;
          }

          .campaign-option .sub-option:hover {
            background: #fff5ef;
            color: #c9632e;
          }

          .campaign-option .sub-option:hover::before {
            background: #dc7338;
          }

          .template-option .sub-option:hover {
            background: #f6f1ff;
            color: #6c48bc;
          }

          .template-option .sub-option:hover::before {
            background: #7651c9;
          }

          .media-option .sub-option:hover {
            background: #effafa;
            color: #15838d;
          }

          .media-option .sub-option:hover::before {
            background: #168f9a;
          }

          .call-option .sub-option:hover {
            background: #fff2f5;
            color: #c94364;
          }

          .call-option .sub-option:hover::before {
            background: #d14f70;
          }

          .activity-option .sub-option:hover {
            background: #fff9ed;
            color: #b77b0f;
          }

          .activity-option .sub-option:hover::before {
            background: #c68a18;
          }

          /* OPEN CARD INDICATOR */

          .history-option.open-card {
            border-color: #dbe5f5;
          }

          /* RESPONSIVE */

          @media (max-width: 900px) {
            .history-container {
              padding: 32px;
            }

            .history-wrapper {
              max-width: 100%;
            }
          }

          @media (max-width: 768px) {
            .history-container {
              padding: 25px 20px;
            }

            .history-header {
              margin-bottom: 24px;
            }

            .history-header h1 {
              font-size: 27px;
            }

            .history-button {
              min-height: 62px;
              padding: 0 17px;
            }

            .history-icon {
              width: 38px;
              height: 38px;
              border-radius: 10px;
            }

            .history-button-left {
              gap: 12px;
            }

            .sub-options {
              padding-left: 67px;
              padding-right: 16px;
            }
          }

          @media (max-width: 480px) {
            .history-container {
              padding: 20px 14px;
            }

            .history-header {
              margin-bottom: 20px;
            }

            .history-header h1 {
              font-size: 24px;
            }

            .history-header p {
              font-size: 13px;
            }

            .history-list {
              gap: 10px;
            }

            .history-option {
              border-radius: 13px;
            }

            .history-button {
              min-height: 58px;
              padding: 0 13px;
              font-size: 14px;
            }

            .history-button-left {
              gap: 10px;
            }

            .history-icon {
              width: 34px;
              height: 34px;
              border-radius: 9px;
              font-size: 13px;
            }

            .history-arrow {
              width: 27px;
              height: 27px;
              font-size: 10px;
            }

            .sub-options {
              padding:
                5px
                12px
                13px
                53px;
            }

            .sub-option {
              min-height: 39px;
              font-size: 12.5px;
              padding-left: 16px;
            }

            .sub-option:hover {
              padding-left: 20px;
            }
          }
        `}
      </style>

      <div className="history-container">
        <div className="history-wrapper">

          {/* HEADER */}
          <div className="history-header">
            <h1>History</h1>
            <p>
              View and manage your messaging and activity history.
            </p>
          </div>

          {/* OPTIONS */}
          <div
            className="history-list"
            ref={historyListRef}
          >

            {/* MESSAGE HISTORY */}
            <div
              className={`history-option message-option ${
                openSection === "message" ? "open-card" : ""
              }`}
            >
              <button
                className="history-button"
                onClick={() => toggleSection("message")}
              >
                <div className="history-button-left">
                  <div className="history-icon">C</div>
                  <span>Conversation History</span>
                </div>

                <span
                  className={`history-arrow ${
                    openSection === "message" ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openSection === "message" && (
                <div className="sub-options">
                  <div className="sub-option">
                    Sent Messages
                  </div>

                  <div className="sub-option">
                    Delivered Messages
                  </div>

                  <div className="sub-option">
                    Read Messages
                  </div>

                  <div className="sub-option">
                    Failed Messages
                  </div>
                </div>
              )}
            </div>

            
            {/* CAMPAIGN HISTORY */}
            <div
              className={`history-option campaign-option ${
                openSection === "campaign" ? "open-card" : ""
              }`}
            >
              <button
                className="history-button"
                onClick={() => toggleSection("campaign")}
              >
                <div className="history-button-left">
                  <div className="history-icon">C</div>
                  <span>Campaign History</span>
                </div>

                <span
                  className={`history-arrow ${
                    openSection === "campaign" ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openSection === "campaign" && (
                <div className="sub-options">
                  <div className="sub-option">
                    Completed Campaigns
                  </div>

                  <div className="sub-option">
                    Failed Campaigns
                  </div>

                  <div className="sub-option">
                    Cancelled Campaigns
                  </div>
                </div>
              )}
            </div>

            {/* TEMPLATE HISTORY */}
            <div
              className={`history-option template-option ${
                openSection === "template" ? "open-card" : ""
              }`}
            >
              <button
                className="history-button"
                onClick={() => toggleSection("template")}
              >
                <div className="history-button-left">
                  <div className="history-icon">T</div>
                  <span>Template History</span>
                </div>

                <span
                  className={`history-arrow ${
                    openSection === "template" ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openSection === "template" && (
                <div className="sub-options">
                  <div className="sub-option">
                    Sent Templates
                  </div>

                  <div className="sub-option">
                    Approved Templates
                  </div>

                  <div className="sub-option">
                    Rejected Templates
                  </div>
                </div>
              )}
            </div>

            {/* MEDIA HISTORY */}
            <div
              className={`history-option media-option ${
                openSection === "media" ? "open-card" : ""
              }`}
            >
              <button
                className="history-button"
                onClick={() => toggleSection("media")}
              >
                <div className="history-button-left">
                  <div className="history-icon">M</div>
                  <span>Media History</span>
                </div>

                <span
                  className={`history-arrow ${
                    openSection === "media" ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openSection === "media" && (
                <div className="sub-options">
                  <div className="sub-option">
                    Images
                  </div>

                  <div className="sub-option">
                    Videos
                  </div>

                  <div className="sub-option">
                    Documents
                  </div>

                  <div className="sub-option">
                    Audio
                  </div>
                </div>
              )}
            </div>

            {/* CALL HISTORY */}
            <div
              className={`history-option call-option ${
                openSection === "call" ? "open-card" : ""
              }`}
            >
              <button
                className="history-button"
                onClick={() => toggleSection("call")}
              >
                <div className="history-button-left">
                  <div className="history-icon">C</div>
                  <span>Call History</span>
                </div>

                <span
                  className={`history-arrow ${
                    openSection === "call" ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openSection === "call" && (
                <div className="sub-options">
                  <div className="sub-option">
                    Incoming Calls
                  </div>

                  <div className="sub-option">
                    Outgoing Calls
                  </div>

                  <div className="sub-option">
                    Missed Calls
                  </div>
                </div>
              )}
            </div>

            {/* ACTIVITY HISTORY */}
            <div
              className={`history-option activity-option ${
                openSection === "activity" ? "open-card" : ""
              }`}
            >
              <button
                className="history-button"
                onClick={() => toggleSection("activity")}
              >
                <div className="history-button-left">
                  <div className="history-icon">A</div>
                  <span>Activity History</span>
                </div>

                <span
                  className={`history-arrow ${
                    openSection === "activity" ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openSection === "activity" && (
                <div className="sub-options">
                  <div className="sub-option">
                    Login Activity
                  </div>

                  <div className="sub-option">
                    Message Activity
                  </div>

                  <div className="sub-option">
                    Campaign Activity
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default History;

