import React, { useMemo, useState } from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaEnvelope,
  FaKey,
  FaPaperPlane,
  FaSearch,
  FaUserCheck,
  FaUserPlus,
  FaBell,
  FaTimesCircle,
  FaUsers,
  FaArrowLeft,
} from "react-icons/fa";

const menu = {
  Workflows: ["Active", "Inactive"],
  Triggers: ["Message Received", "Keyword Trigger"],
  Actions: ["Send Message", "Assign / Notify"],
};

const automationData = {
  Active: [
    {
      title: "Welcome Customer",
      description:
        "Automatically welcome new customers when they start a conversation.",
      status: "Active",
      icon: <FaUserPlus />,
      color: "#6c63ff",
    },
    {
      title: "Support Auto Reply",
      description:
        "Automatically reply to customers when they request support.",
      status: "Active",
      icon: <FaUsers />,
      color: "#22a06b",
    },
    {
      title: "Lead Follow-up",
      description:
        "Send an automatic follow-up message to potential leads.",
      status: "Active",
      icon: <FaUserCheck />,
      color: "#f59e0b",
    },
  ],

  Inactive: [
    {
      title: "Festival Promotion",
      description:
        "Send promotional messages to customers during festivals.",
      status: "Inactive",
      icon: <FaBell />,
      color: "#ef4444",
    },
    {
      title: "Customer Reminder",
      description:
        "Send reminders to customers who have not responded.",
      status: "Inactive",
      icon: <FaClock />,
      color: "#8b5cf6",
    },
  ],

  "Message Received": [
    {
      title: "Customer Welcome",
      description:
        "Trigger an automated welcome message when a new customer sends a message.",
      status: "Active",
      icon: <FaEnvelope />,
      color: "#22a06b",
    },
    {
      title: "Support Response",
      description:
        "Automatically respond when a customer sends a support-related message.",
      status: "Active",
      icon: <FaUsers />,
      color: "#6c63ff",
    },
  ],

  "Keyword Trigger": [
    {
      title: "Pricing Query",
      description:
        "Start automation when a customer asks about pricing.",
      status: "Active",
      icon: <FaKey />,
      color: "#f59e0b",
    },
    {
      title: "Demo Request",
      description:
        "Start automation when a customer requests a product demo.",
      status: "Active",
      icon: <FaBolt />,
      color: "#6c63ff",
    },
    {
      title: "Support Request",
      description:
        "Start automation when a customer uses a support keyword.",
      status: "Active",
      icon: <FaUsers />,
      color: "#22a06b",
    },
  ],

  "Send Message": [
    {
      title: "Welcome Message",
      description:
        "Send a predefined welcome message automatically.",
      status: "Active",
      icon: <FaPaperPlane />,
      color: "#6c63ff",
    },
    {
      title: "Follow-up Message",
      description:
        "Send a follow-up message after a specific period.",
      status: "Active",
      icon: <FaClock />,
      color: "#f59e0b",
    },
    {
      title: "Support Response",
      description:
        "Send an automated support response to customers.",
      status: "Active",
      icon: <FaEnvelope />,
      color: "#22a06b",
    },
  ],

  "Assign / Notify": [
    {
      title: "Assign to Sales",
      description:
        "Automatically assign a customer conversation to the sales team.",
      status: "Active",
      icon: <FaUserCheck />,
      color: "#6c63ff",
    },
    {
      title: "Notify Support",
      description:
        "Notify the support team when a customer needs assistance.",
      status: "Active",
      icon: <FaBell />,
      color: "#f59e0b",
    },
    {
      title: "Assign to Manager",
      description:
        "Assign important conversations to a manager.",
      status: "Active",
      icon: <FaUsers />,
      color: "#22a06b",
    },
  ],
};

export default function Automation() {
  const [openOption, setOpenOption] = useState("");
  const [activeOption, setActiveOption] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAutomation, setSelectedAutomation] = useState(null);

  const handleMainOption = (option) => {
    if (openOption === option) {
      setOpenOption("");
    } else {
      setOpenOption(option);
    }

    setActiveOption("");
    setSearch("");
    setSelectedAutomation(null);
  };

  const handleSubOption = (option) => {
    setActiveOption(option);
    setSearch("");
    setSelectedAutomation(null);
  };

  const handleViewDetails = (item) => {
    setSelectedAutomation(item);
  };

  const handleBack = () => {
    setSelectedAutomation(null);
  };

  const closeEverything = () => {
    setOpenOption("");
    setActiveOption("");
    setSearch("");
    setSelectedAutomation(null);
  };

  const currentData = useMemo(() => {
    if (!activeOption) {
      return [];
    }

    const data = automationData[activeOption] || [];

    return data.filter((item) => {
      const searchText = search.toLowerCase();

      return (
        item.title.toLowerCase().includes(searchText) ||
        item.description.toLowerCase().includes(searchText) ||
        item.status.toLowerCase().includes(searchText)
      );
    });
  }, [activeOption, search]);

  return (
    <div
      className="automation-page"
      onClick={closeEverything}
    >
      <div className="automation-container">

        <div className="automation-header">
          <div>
            <h1>Automations</h1>
            <p>
              Manage workflows, triggers and actions for customer
              conversations.
            </p>
          </div>
        </div>

        <div className="automation-layout">

          <aside
            className="automation-sidebar"
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setOpenOption("")}
          >
            <div className="sidebar-title">
              Automation
            </div>

            {Object.keys(menu).map((option) => (
              <div
                className="menu-section"
                key={option}
              >
                <button
                  className={`main-menu-button ${
                    openOption === option ? "main-active" : ""
                  }`}
                  onClick={() => handleMainOption(option)}
                >
                  <span>{option}</span>

                  <FaChevronDown
                    className={
                      openOption === option
                        ? "rotate-icon"
                        : ""
                    }
                  />
                </button>

                {openOption === option && (
                  <div className="sub-options">
                    {menu[option].map((subOption) => (
                      <button
                        key={subOption}
                        className={`sub-option ${
                          activeOption === subOption
                            ? "sub-active"
                            : ""
                        }`}
                        onClick={() =>
                          handleSubOption(subOption)
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

          {activeOption && (
            <main
              className="automation-content"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedAutomation ? (
                <div className="automation-details">

                  <button
                    className="back-button"
                    onClick={handleBack}
                  >
                    <FaArrowLeft />
                    Back
                  </button>

                  <div className="details-card">

                    <div
                      className="details-icon"
                      style={{
                        backgroundColor:
                          selectedAutomation.color + "18",
                        color: selectedAutomation.color,
                      }}
                    >
                      {selectedAutomation.icon}
                    </div>

                    <div className="details-main">

                      <div className="details-title-row">
                        <h2>
                          {selectedAutomation.title}
                        </h2>

                        <span
                          className={`status ${
                            selectedAutomation.status ===
                            "Active"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {selectedAutomation.status ===
                          "Active" ? (
                            <FaCheckCircle />
                          ) : (
                            <FaTimesCircle />
                          )}

                          {selectedAutomation.status}
                        </span>
                      </div>

                      <p className="details-description">
                        {selectedAutomation.description}
                      </p>

                      <div className="details-info">

                        <div>
                          <span>Automation Type</span>
                          <strong>{activeOption}</strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong>
                            {selectedAutomation.status}
                          </strong>
                        </div>

                        <div>
                          <span>Action</span>
                          <strong>
                            Automated Customer Handling
                          </strong>
                        </div>

                      </div>

                      <div className="details-message">
                        <h3>How it works</h3>

                        <p>
                          This automation works based on the
                          selected {activeOption.toLowerCase()}.
                          When the configured condition is
                          satisfied, the corresponding
                          automated action can be performed.
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="content-header">

                    <div>
                      <h2>{activeOption}</h2>

                      <p>
                        Manage automations under{" "}
                        {activeOption}.
                      </p>
                    </div>

                    <div
                      className="search-box"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <FaSearch />

                      <input
                        type="text"
                        placeholder="Search automation..."
                        value={search}
                        onChange={(e) =>
                          setSearch(e.target.value)
                        }
                      />
                    </div>

                  </div>

                  {currentData.length > 0 ? (
                    <div className="automation-grid">

                      {currentData.map((item, index) => (
                        <div
                          className="automation-card"
                          key={`${item.title}-${index}`}
                        >

                          <div className="card-top">

                            <div
                              className="automation-icon"
                              style={{
                                backgroundColor:
                                  item.color + "18",
                                color: item.color,
                              }}
                            >
                              {item.icon}
                            </div>

                            <span
                              className={`status ${
                                item.status === "Active"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {item.status === "Active" ? (
                                <FaCheckCircle />
                              ) : (
                                <FaTimesCircle />
                              )}

                              {item.status}
                            </span>

                          </div>

                          <h3>{item.title}</h3>

                          <p>{item.description}</p>

                          <button
                            className="view-details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(item);
                            }}
                          >
                            View Details
                          </button>

                        </div>
                      ))}

                    </div>
                  ) : (
                    <div className="empty-state">

                      <div className="empty-icon">
                        <FaSearch />
                      </div>

                      <h3>No automations found</h3>

                      <p>
                        No automation matches your search.
                      </p>

                    </div>
                  )}
                </>
              )}
            </main>
          )}

        </div>
      </div>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .automation-page {
            min-height: 100vh;
            width: 100%;
            background: #f7f8fc;
            padding: 28px;
            font-family: Arial, Helvetica, sans-serif;
            color: #25253a;
          }

          .automation-container {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
          }

          .automation-header {
            background: #ffffff;
            border: 1px solid #e8e8f0;
            border-radius: 16px;
            padding: 24px 28px;
            margin-bottom: 20px;
            box-shadow: 0 4px 16px rgba(50, 50, 93, 0.04);
          }

          .automation-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: #292943;
          }

          .automation-header p {
            margin: 8px 0 0;
            color: #77778c;
            font-size: 14px;
          }

          .automation-layout {
            display: flex;
            align-items: flex-start;
            gap: 20px;
          }

          .automation-sidebar {
            width: 220px;
            flex-shrink: 0;
            background: #ffffff;
            border: 1px solid #e8e8f0;
            border-radius: 16px;
            padding: 14px;
            box-shadow: 0 4px 16px rgba(50, 50, 93, 0.04);
          }

          .sidebar-title {
            padding: 8px 12px 14px;
            font-size: 13px;
            font-weight: 700;
            color: #9292a6;
            text-transform: uppercase;
            letter-spacing: 0.6px;
          }

          .menu-section {
            margin-bottom: 7px;
          }

          .main-menu-button {
            width: 100%;
            border: none;
            background: transparent;
            color: #55556c;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 13px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: 0.2s ease;
          }

          .main-menu-button:hover {
            background: #f5f2ff;
            color: #6845d7;
          }

          .main-active {
            background: #f0ebff;
            color: #6845d7;
          }

          .main-menu-button svg {
            font-size: 11px;
            transition: transform 0.2s ease;
          }

          .rotate-icon {
            transform: rotate(180deg);
          }

          .sub-options {
            padding: 5px 0 5px 10px;
          }

          .sub-option {
            width: 100%;
            text-align: left;
            border: none;
            background: transparent;
            color: #77778b;
            padding: 10px 13px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            margin-bottom: 2px;
            transition: 0.2s ease;
          }

          .sub-option:hover {
            background: #f8f6ff;
            color: #6845d7;
          }

          .sub-active {
            background: #eee9ff;
            color: #6845d7;
            font-weight: 600;
          }

          .automation-content {
            flex: 1;
            min-width: 0;
            background: #ffffff;
            border: 1px solid #e8e8f0;
            border-radius: 16px;
            padding: 24px;
            min-height: 500px;
            box-shadow: 0 4px 16px rgba(50, 50, 93, 0.04);
          }

          .content-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
          }

          .content-header h2 {
            margin: 0;
            color: #292943;
            font-size: 22px;
          }

          .content-header p {
            margin: 6px 0 0;
            color: #85859a;
            font-size: 13px;
          }

          .search-box {
            width: 250px;
            height: 42px;
            border: 1px solid #dedee9;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 13px;
            background: #ffffff;
          }

          .search-box svg {
            color: #9696a8;
            font-size: 14px;
          }

          .search-box input {
            border: none;
            outline: none;
            width: 100%;
            font-size: 13px;
            color: #333344;
            background: transparent;
          }

          .search-box input::placeholder {
            color: #aaaabc;
          }

          .automation-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
          }

          .automation-card {
            border: 1px solid #e8e8f0;
            border-radius: 14px;
            padding: 20px;
            background: #ffffff;
            transition: 0.2s ease;
          }

          .automation-card:hover {
            transform: translateY(-2px);
            border-color: #d9d0ff;
            box-shadow: 0 8px 22px rgba(80, 60, 140, 0.08);
          }

          .card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
          }

          .automation-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }

          .status {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            font-weight: 600;
            padding: 6px 9px;
            border-radius: 20px;
          }

          .status-active {
            color: #168257;
            background: #e9f8f0;
          }

          .status-inactive {
            color: #d34b4b;
            background: #fff0f0;
          }

          .automation-card h3 {
            margin: 0 0 9px;
            font-size: 16px;
            color: #303047;
          }

          .automation-card p {
            margin: 0;
            color: #808095;
            font-size: 13px;
            line-height: 1.6;
            min-height: 63px;
          }

          .view-details {
            width: 100%;
            border: none;
            background: #f0ebff;
            color: #6845d7;
            padding: 10px 14px;
            border-radius: 9px;
            margin-top: 18px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: 0.2s ease;
          }

          .view-details:hover {
            background: #6845d7;
            color: #ffffff;
          }

          .empty-state {
            min-height: 350px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .empty-icon {
            width: 55px;
            height: 55px;
            border-radius: 50%;
            background: #f0ebff;
            color: #6845d7;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }

          .empty-state h3 {
            margin: 0 0 7px;
            color: #36364c;
            font-size: 16px;
          }

          .empty-state p {
            margin: 0;
            color: #9292a4;
            font-size: 13px;
          }

          .automation-details {
            width: 100%;
          }

          .back-button {
            border: none;
            background: #f0ebff;
            color: #6845d7;
            border-radius: 9px;
            padding: 10px 15px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
          }

          .back-button:hover {
            background: #6845d7;
            color: #ffffff;
          }

          .details-card {
            border: 1px solid #e8e8f0;
            border-radius: 15px;
            padding: 25px;
            display: flex;
            gap: 22px;
            background: #ffffff;
          }

          .details-icon {
            width: 58px;
            height: 58px;
            border-radius: 14px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 23px;
          }

          .details-main {
            flex: 1;
          }

          .details-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .details-title-row h2 {
            margin: 0;
            font-size: 22px;
            color: #2e2e45;
          }

          .details-description {
            margin: 12px 0 24px;
            color: #77778c;
            font-size: 14px;
            line-height: 1.7;
          }

          .details-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            margin-bottom: 22px;
          }

          .details-info div {
            background: #f8f8fc;
            border-radius: 10px;
            padding: 15px;
          }

          .details-info span {
            display: block;
            color: #9292a5;
            font-size: 11px;
            margin-bottom: 6px;
          }

          .details-info strong {
            color: #404056;
            font-size: 13px;
          }

          .details-message {
            background: #f8f6ff;
            border-radius: 11px;
            padding: 17px;
          }

          .details-message h3 {
            margin: 0 0 8px;
            color: #6845d7;
            font-size: 14px;
          }

          .details-message p {
            margin: 0;
            color: #77778b;
            font-size: 13px;
            line-height: 1.7;
          }

          @media (max-width: 1000px) {
            .automation-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .details-info {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 750px) {
            .automation-page {
              padding: 15px;
            }

            .automation-layout {
              flex-direction: column;
            }

            .automation-sidebar {
              width: 100%;
            }

            .automation-grid {
              grid-template-columns: 1fr;
            }

            .content-header {
              flex-direction: column;
              align-items: stretch;
            }

            .search-box {
              width: 100%;
            }

            .details-card {
              flex-direction: column;
            }

            .details-title-row {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}
      </style>
    </div>
  );
}
