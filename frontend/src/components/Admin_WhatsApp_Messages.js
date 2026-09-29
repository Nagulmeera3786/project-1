import React, { useEffect, useRef, useState } from "react";
import {
  FaInbox,
  FaPaperPlane,
  FaClock,
  FaFileAlt,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const menu = [
  {
    title: "Inbox",
    icon: <FaInbox />,
    suboptions: ["All Messages", "Unread"],
  },
  {
    title: "Sent",
    icon: <FaPaperPlane />,
    suboptions: ["Delivered", "Failed"],
  },
  {
    title: "Scheduled",
    icon: <FaClock />,
    suboptions: ["Upcoming", "Completed"],
  },
  {
    title: "Templates",
    icon: <FaFileAlt />,
    suboptions: ["Approved", "Pending"],
  },
];

const content = {
  "All Messages": {
    title: "All Messages",
    type: "messages",
    data: [
      {
        name: "Rahul Kumar",
        message: "Hello, I would like to know more about your product.",
        time: "10:30 AM",
        status: "Unread",
      },
      {
        name: "Priya Sharma",
        message: "Thank you for the information.",
        time: "09:45 AM",
        status: "Read",
      },
      {
        name: "Arjun Reddy",
        message: "Can you share the pricing details?",
        time: "Yesterday",
        status: "Unread",
      },
      {
        name: "Sneha Patel",
        message: "The appointment has been confirmed.",
        time: "Yesterday",
        status: "Read",
      },
    ],
  },

  Unread: {
    title: "Unread Messages",
    type: "messages",
    data: [
      {
        name: "Rahul Kumar",
        message: "Hello, I would like to know more about your product.",
        time: "10:30 AM",
        status: "Unread",
      },
      {
        name: "Arjun Reddy",
        message: "Can you share the pricing details?",
        time: "Yesterday",
        status: "Unread",
      },
    ],
  },

  Delivered: {
    title: "Delivered Messages",
    type: "status",
    data: [
      {
        name: "Anil Kumar",
        message: "Your order has been successfully confirmed.",
        time: "10:15 AM",
        status: "Delivered",
      },
      {
        name: "Meena Rao",
        message: "Your appointment has been scheduled.",
        time: "09:30 AM",
        status: "Delivered",
      },
      {
        name: "Vijay Singh",
        message: "Thank you for choosing our service.",
        time: "Yesterday",
        status: "Delivered",
      },
    ],
  },

  Failed: {
    title: "Failed Messages",
    type: "status",
    data: [
      {
        name: "Ravi Kumar",
        message: "Your message could not be delivered.",
        time: "11:20 AM",
        status: "Failed",
      },
      {
        name: "Pooja Sharma",
        message: "Message delivery failed.",
        time: "Yesterday",
        status: "Failed",
      },
    ],
  },

  Upcoming: {
    title: "Upcoming Scheduled Messages",
    type: "scheduled",
    data: [
      {
        name: "Rahul",
        message: "Product Follow-up",
        date: "16 Sep 2026",
        time: "04:00 PM",
        status: "Upcoming",
      },
      {
        name: "Priya",
        message: "Appointment Reminder",
        date: "17 Sep 2026",
        time: "10:00 AM",
        status: "Upcoming",
      },
      {
        name: "Customer Group",
        message: "Offer Campaign",
        date: "18 Sep 2026",
        time: "06:30 PM",
        status: "Upcoming",
      },
    ],
  },

  Completed: {
    title: "Completed Scheduled Messages",
    type: "scheduled",
    data: [
      {
        name: "New Customers",
        message: "Welcome Message",
        date: "15 Sep 2026",
        time: "09:00 AM",
        status: "Completed",
      },
      {
        name: "Customer Group",
        message: "Payment Reminder",
        date: "14 Sep 2026",
        time: "05:00 PM",
        status: "Completed",
      },
    ],
  },

  Approved: {
    title: "Approved Templates",
    type: "templates",
    data: [
      {
        name: "Welcome",
        message: "Customer Marketing",
        category: "Marketing",
        language: "English",
        status: "Approved",
      },
      {
        name: "Appointment Confirmation",
        message: "Utility",
        category: "Utility",
        language: "English",
        status: "Approved",
      },
      {
        name: "Order Confirmation",
        message: "Utility",
        category: "Utility",
        language: "English",
        status: "Approved",
      },
    ],
  },

  Pending: {
    title: "Pending Templates",
    type: "templates",
    data: [
      {
        name: "Festival Offer",
        message: "Marketing",
        category: "Marketing",
        language: "English",
        status: "Pending",
      },
      {
        name: "Customer Feedback",
        message: "Utility",
        category: "Utility",
        language: "English",
        status: "Pending",
      },
    ],
  },
};

export default function Messages() {
  const [openOption, setOpenOption] = useState("");
  const [activeOption, setActiveOption] = useState("");
  const [search, setSearch] = useState("");

  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  const handleMainClick = (title) => {
    setOpenOption((previous) =>
      previous === title ? "" : title
    );
  };

  const handleSubClick = (suboption) => {
    setActiveOption(suboption);
    setSearch("");
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      const clickedInsideSidebar =
        sidebarRef.current &&
        sidebarRef.current.contains(target);

      const clickedInsideContent =
        contentRef.current &&
        contentRef.current.contains(target);

      if (!clickedInsideSidebar && !clickedInsideContent) {
        setOpenOption("");
        setActiveOption("");
        setSearch("");
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
    };
  }, []);

  const current = activeOption
    ? content[activeOption]
    : null;

  const filteredData = current
    ? current.data.filter((item) =>
        JSON.stringify(item)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="messages-page">
      <style>
        {`
          .messages-page {
            min-height: 100vh;
            padding: 32px;
            box-sizing: border-box;
            background: #f8f9fd;
            font-family: Arial, sans-serif;
            color: #29263d;
          }

          .messages-heading {
            margin-bottom: 24px;
          }

          .messages-heading h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }

          .messages-heading p {
            margin: 7px 0 0;
            color: #77738a;
            font-size: 14px;
          }

          .messages-wrapper {
            display: grid;
            grid-template-columns: 240px 1fr;
            gap: 24px;
            align-items: start;
          }

          .messages-sidebar {
            background: #ffffff;
            border: 1px solid #e9e7f0;
            border-radius: 16px;
            padding: 18px;
            box-sizing: border-box;
          }

          .sidebar-title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #3d3855;
          }

          .messages-menu-item {
            margin-bottom: 8px;
          }

          .messages-menu-button {
            width: 100%;
            border: none;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 11px 10px;
            border-radius: 9px;
            cursor: pointer;
            color: #45415b;
            font-size: 14px;
            transition: 0.2s ease;
          }

          .messages-menu-button:hover {
            background: #f2efff;
            color: #6845d7;
          }

          .messages-menu-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .messages-menu-left svg {
            color: #6845d7;
            font-size: 15px;
          }

          .messages-submenu {
            margin: 3px 0 8px 14px;
            padding: 5px 0 5px 10px;
            border-left: 2px solid #ebe7ff;
          }

          .messages-submenu button {
            width: 100%;
            border: none;
            background: transparent;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 10px;
            border-radius: 8px;
            color: #77738a;
            font-size: 13px;
            cursor: pointer;
            text-align: left;
            transition: 0.2s ease;
          }

          .messages-submenu button:hover {
            background: #f5f2ff;
            color: #6845d7;
          }

          .messages-submenu button.active {
            background: #eeeaff;
            color: #6845d7;
            font-weight: 600;
          }

          .messages-submenu button svg {
            font-size: 9px;
          }

          .messages-panel {
            background: #ffffff;
            border: 1px solid #e9e7f0;
            border-radius: 16px;
            min-height: 620px;
            padding: 24px;
            box-sizing: border-box;
          }

          .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
          }

          .panel-header h2 {
            margin: 0;
            font-size: 21px;
            color: #302b49;
          }

          .search-container {
            width: 240px;
            height: 40px;
            border: 1px solid #dedbe8;
            border-radius: 9px;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 12px;
            box-sizing: border-box;
            background: #ffffff;
          }

          .search-container svg {
            color: #89859a;
            font-size: 13px;
          }

          .search-container input {
            width: 100%;
            border: none;
            outline: none;
            font-size: 13px;
            color: #38344d;
            background: transparent;
          }

          .message-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .message-card {
            border: 1px solid #eceaf2;
            border-radius: 12px;
            padding: 16px;
            background: #ffffff;
            transition: 0.2s ease;
          }

          .message-card:hover {
            border-color: #d9d1ff;
            background: #fcfbff;
          }

          .message-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .message-name {
            font-size: 14px;
            font-weight: 700;
            color: #38334f;
          }

          .message-time {
            font-size: 12px;
            color: #9995a7;
          }

          .message-text {
            margin-top: 8px;
            font-size: 13px;
            color: #77738a;
            line-height: 1.5;
          }

          .message-status {
            margin-top: 11px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 9px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
          }

          .status-read {
            background: #f0f7f2;
            color: #4c9560;
          }

          .status-unread {
            background: #f2efff;
            color: #6845d7;
          }

          .status-delivered {
            background: #f0f7f2;
            color: #4c9560;
          }

          .status-failed {
            background: #fff3f1;
            color: #d16b5c;
          }

          .status-upcoming {
            background: #f2efff;
            color: #6845d7;
          }

          .status-completed {
            background: #f0f7f2;
            color: #4c9560;
          }

          .status-approved {
            background: #f0f7f2;
            color: #4c9560;
          }

          .status-pending {
            background: #fff8e8;
            color: #b88935;
          }

          .scheduled-card,
          .template-card {
            border: 1px solid #eceaf2;
            border-radius: 12px;
            padding: 17px;
            background: #ffffff;
          }

          .scheduled-card:hover,
          .template-card:hover {
            border-color: #d9d1ff;
            background: #fcfbff;
          }

          .scheduled-main,
          .template-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }

          .scheduled-title,
          .template-name {
            font-size: 14px;
            font-weight: 700;
            color: #38334f;
          }

          .scheduled-person,
          .template-category,
          .template-language {
            margin-top: 7px;
            font-size: 13px;
            color: #77738a;
          }

          .scheduled-date {
            text-align: right;
            font-size: 12px;
            color: #77738a;
            line-height: 1.7;
          }

          .template-details {
            margin-top: 7px;
            display: flex;
            gap: 15px;
            font-size: 12px;
            color: #77738a;
          }

          .empty-state {
            min-height: 450px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #89859a;
          }

          .empty-state svg {
            font-size: 35px;
            margin-bottom: 14px;
            color: #c1bbd6;
          }

          .empty-state h3 {
            margin: 0 0 6px;
            color: #4a4560;
            font-size: 16px;
          }

          .empty-state p {
            margin: 0;
            font-size: 13px;
          }

          @media (max-width: 850px) {
            .messages-page {
              padding: 20px;
            }

            .messages-wrapper {
              grid-template-columns: 1fr;
            }

            .messages-sidebar {
              width: 100%;
            }

            .panel-header {
              flex-direction: column;
              align-items: stretch;
            }

            .search-container {
              width: 100%;
            }
          }
        `}
      </style>

      <div className="messages-heading">
        <h1>Messages</h1>
        <p>Manage and monitor your customer communication.</p>
      </div>

      <div className="messages-wrapper">
        <div
          className="messages-sidebar"
          ref={sidebarRef}
        >
          <div className="sidebar-title">
            Message Management
          </div>

          {menu.map((item) => (
            <div
              className="messages-menu-item"
              key={item.title}
            >
              <button
                className="messages-menu-button"
                onClick={() =>
                  handleMainClick(item.title)
                }
              >
                <span className="messages-menu-left">
                  {item.icon}
                  {item.title}
                </span>

                {openOption === item.title ? (
                  <FaChevronDown />
                ) : (
                  <FaChevronRight />
                )}
              </button>

              {openOption === item.title && (
                <div
                  className="messages-submenu"
                  onMouseLeave={() =>
                    setOpenOption("")
                  }
                >
                  {item.suboptions.map(
                    (suboption) => (
                      <button
                        key={suboption}
                        className={
                          activeOption === suboption
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          handleSubClick(suboption)
                        }
                      >
                        <FaChevronRight />
                        {suboption}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {current && (
          <div
            className="messages-panel"
            ref={contentRef}
          >
            <div className="panel-header">
              <h2>{current.title}</h2>

              <div className="search-container">
                <FaSearch />

                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>
            </div>

            {filteredData.length > 0 ? (
              <div className="message-list">
                {current.type === "messages" &&
                  filteredData.map(
                    (item, index) => (
                      <div
                        className="message-card"
                        key={index}
                      >
                        <div className="message-top">
                          <div className="message-name">
                            <FaEnvelope
                              style={{
                                marginRight: "8px",
                                color: "#6845d7",
                              }}
                            />
                            {item.name}
                          </div>

                          <div className="message-time">
                            {item.time}
                          </div>
                        </div>

                        <div className="message-text">
                          {item.message}
                        </div>

                        <div
                          className={`message-status ${
                            item.status === "Unread"
                              ? "status-unread"
                              : "status-read"
                          }`}
                        >
                          {item.status === "Unread" ? (
                            <FaEnvelope />
                          ) : (
                            <FaCheckCircle />
                          )}

                          {item.status}
                        </div>
                      </div>
                    )
                  )}

                {current.type === "status" &&
                  filteredData.map(
                    (item, index) => (
                      <div
                        className="message-card"
                        key={index}
                      >
                        <div className="message-top">
                          <div className="message-name">
                            <FaEnvelope
                              style={{
                                marginRight: "8px",
                                color: "#6845d7",
                              }}
                            />
                            {item.name}
                          </div>

                          <div className="message-time">
                            {item.time}
                          </div>
                        </div>

                        <div className="message-text">
                          {item.message}
                        </div>

                        <div
                          className={`message-status ${
                            item.status === "Failed"
                              ? "status-failed"
                              : "status-delivered"
                          }`}
                        >
                          {item.status === "Failed" ? (
                            <FaExclamationCircle />
                          ) : (
                            <FaCheckCircle />
                          )}

                          {item.status}
                        </div>
                      </div>
                    )
                  )}

                {current.type === "scheduled" &&
                  filteredData.map(
                    (item, index) => (
                      <div
                        className="scheduled-card"
                        key={index}
                      >
                        <div className="scheduled-main">
                          <div>
                            <div className="scheduled-title">
                              {item.message}
                            </div>

                            <div className="scheduled-person">
                              {item.name}
                            </div>

                            <div
                              className={`message-status ${
                                item.status ===
                                "Completed"
                                  ? "status-completed"
                                  : "status-upcoming"
                              }`}
                            >
                              {item.status ===
                              "Completed" ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClock />
                              )}

                              {item.status}
                            </div>
                          </div>

                          <div className="scheduled-date">
                            <div>
                              {item.date}
                            </div>
                            <div>
                              {item.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                {current.type === "templates" &&
                  filteredData.map(
                    (item, index) => (
                      <div
                        className="template-card"
                        key={index}
                      >
                        <div className="template-main">
                          <div>
                            <div className="template-name">
                              <FaFileAlt
                                style={{
                                  marginRight: "8px",
                                  color: "#6845d7",
                                }}
                              />
                              {item.name}
                            </div>

                            <div className="template-category">
                              {item.message}
                            </div>

                            <div className="template-details">
                              <span>
                                Category:{" "}
                                {item.category}
                              </span>

                              <span>
                                Language:{" "}
                                {item.language}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`message-status ${
                              item.status ===
                              "Approved"
                                ? "status-approved"
                                : "status-pending"
                            }`}
                          >
                            {item.status ===
                            "Approved" ? (
                              <FaCheckCircle />
                            ) : (
                              <FaClock />
                            )}

                            {item.status}
                          </div>
                        </div>
                      </div>
                    )
                  )}
              </div>
            ) : (
              <div className="empty-state">
                <FaSearch />
                <h3>No messages found</h3>
                <p>
                  No results match your search.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

