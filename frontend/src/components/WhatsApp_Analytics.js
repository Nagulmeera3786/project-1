import React, { useEffect, useRef, useState } from "react";

function Analytics() {
  const [openSection, setOpenSection] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const analyticsContainerRef = useRef(null);

  const campaigns = [
    {
      id: 1,
      name: "Diwali Offer",
      performance: 92,
      createdDate: "10 Sep 2026, 10:30 AM",
      status: "Active",
      sent: 5000,
      delivered: 4750,
      read: 4200,
      responses: 1850,
      openRate: 84,
      clickRate: 62,
      responseRate: 36,
    },
    {
      id: 2,
      name: "New Customer",
      performance: 86,
      createdDate: "08 Sep 2026, 02:15 PM",
      status: "Active",
      sent: 4200,
      delivered: 3900,
      read: 3500,
      responses: 1420,
      openRate: 83,
      clickRate: 58,
      responseRate: 34,
    },
    {
      id: 3,
      name: "Product Promotion",
      performance: 78,
      createdDate: "05 Sep 2026, 11:45 AM",
      status: "Completed",
      sent: 3800,
      delivered: 3420,
      read: 2950,
      responses: 1180,
      openRate: 77,
      clickRate: 51,
      responseRate: 31,
    },
    {
      id: 4,
      name: "Welcome Message",
      performance: 74,
      createdDate: "03 Sep 2026, 09:20 AM",
      status: "Active",
      sent: 3100,
      delivered: 2800,
      read: 2400,
      responses: 950,
      openRate: 76,
      clickRate: 47,
      responseRate: 30,
    },
    {
      id: 5,
      name: "Payment Reminder",
      performance: 68,
      createdDate: "01 Sep 2026, 04:30 PM",
      status: "Completed",
      sent: 2900,
      delivered: 2500,
      read: 2050,
      responses: 780,
      openRate: 71,
      clickRate: 43,
      responseRate: 27,
    },
  ];

  const reportData = {
    daily: [
      {
        period: "Monday",
        campaigns: [
          { name: "Diwali Offer", value: 48 },
          { name: "New Customer", value: 44 },
          { name: "Product Promotion", value: 41 },
          { name: "Welcome Message", value: 38 },
          { name: "Payment Reminder", value: 35 },
        ],
      },
      {
        period: "Tuesday",
        campaigns: [
          { name: "Diwali Offer", value: 68 },
          { name: "New Customer", value: 61 },
          { name: "Product Promotion", value: 57 },
          { name: "Welcome Message", value: 52 },
          { name: "Payment Reminder", value: 47 },
        ],
      },
      {
        period: "Wednesday",
        campaigns: [
          { name: "Diwali Offer", value: 54 },
          { name: "New Customer", value: 50 },
          { name: "Product Promotion", value: 46 },
          { name: "Welcome Message", value: 43 },
          { name: "Payment Reminder", value: 39 },
        ],
      },
      {
        period: "Thursday",
        campaigns: [
          { name: "Diwali Offer", value: 80 },
          { name: "New Customer", value: 73 },
          { name: "Product Promotion", value: 68 },
          { name: "Welcome Message", value: 63 },
          { name: "Payment Reminder", value: 58 },
        ],
      },
      {
        period: "Friday",
        campaigns: [
          { name: "Diwali Offer", value: 72 },
          { name: "New Customer", value: 66 },
          { name: "Product Promotion", value: 61 },
          { name: "Welcome Message", value: 56 },
          { name: "Payment Reminder", value: 51 },
        ],
      },
      {
        period: "Saturday",
        campaigns: [
          { name: "Diwali Offer", value: 91 },
          { name: "New Customer", value: 84 },
          { name: "Product Promotion", value: 78 },
          { name: "Welcome Message", value: 71 },
          { name: "Payment Reminder", value: 65 },
        ],
      },
      {
        period: "Sunday",
        campaigns: [
          { name: "Diwali Offer", value: 78 },
          { name: "New Customer", value: 72 },
          { name: "Product Promotion", value: 67 },
          { name: "Welcome Message", value: 61 },
          { name: "Payment Reminder", value: 55 },
        ],
      },
    ],

    weekly: [
      {
        period: "Week 1",
        campaigns: [
          { name: "Diwali Offer", value: 55 },
          { name: "New Customer", value: 50 },
          { name: "Product Promotion", value: 46 },
          { name: "Welcome Message", value: 42 },
          { name: "Payment Reminder", value: 38 },
        ],
      },
      {
        period: "Week 2",
        campaigns: [
          { name: "Diwali Offer", value: 70 },
          { name: "New Customer", value: 64 },
          { name: "Product Promotion", value: 59 },
          { name: "Welcome Message", value: 54 },
          { name: "Payment Reminder", value: 49 },
        ],
      },
      {
        period: "Week 3",
        campaigns: [
          { name: "Diwali Offer", value: 82 },
          { name: "New Customer", value: 76 },
          { name: "Product Promotion", value: 71 },
          { name: "Welcome Message", value: 65 },
          { name: "Payment Reminder", value: 60 },
        ],
      },
      {
        period: "Week 4",
        campaigns: [
          { name: "Diwali Offer", value: 74 },
          { name: "New Customer", value: 69 },
          { name: "Product Promotion", value: 63 },
          { name: "Welcome Message", value: 58 },
          { name: "Payment Reminder", value: 53 },
        ],
      },
    ],

    monthly: [
      {
        period: "January",
        campaigns: [
          { name: "Diwali Offer", value: 52 },
          { name: "New Customer", value: 48 },
          { name: "Product Promotion", value: 44 },
          { name: "Welcome Message", value: 40 },
          { name: "Payment Reminder", value: 36 },
        ],
      },
      {
        period: "February",
        campaigns: [
          { name: "Diwali Offer", value: 65 },
          { name: "New Customer", value: 60 },
          { name: "Product Promotion", value: 55 },
          { name: "Welcome Message", value: 50 },
          { name: "Payment Reminder", value: 45 },
        ],
      },
      {
        period: "March",
        campaigns: [
          { name: "Diwali Offer", value: 74 },
          { name: "New Customer", value: 69 },
          { name: "Product Promotion", value: 64 },
          { name: "Welcome Message", value: 59 },
          { name: "Payment Reminder", value: 54 },
        ],
      },
      {
        period: "April",
        campaigns: [
          { name: "Diwali Offer", value: 86 },
          { name: "New Customer", value: 80 },
          { name: "Product Promotion", value: 74 },
          { name: "Welcome Message", value: 68 },
          { name: "Payment Reminder", value: 62 },
        ],
      },
      {
        period: "May",
        campaigns: [
          { name: "Diwali Offer", value: 78 },
          { name: "New Customer", value: 72 },
          { name: "Product Promotion", value: 67 },
          { name: "Welcome Message", value: 61 },
          { name: "Payment Reminder", value: 56 },
        ],
      },
      {
        period: "June",
        campaigns: [
          { name: "Diwali Offer", value: 94 },
          { name: "New Customer", value: 88 },
          { name: "Product Promotion", value: 82 },
          { name: "Welcome Message", value: 76 },
          { name: "Payment Reminder", value: 70 },
        ],
      },
    ],
  };

  const toggleSection = (section) => {
    setOpenSection((current) =>
      current === section ? null : section
    );

    if (section !== "campaign") {
      setSelectedCampaign(null);
    }
  };

  const selectCampaign = (campaign) => {
    setSelectedCampaign((current) =>
      current?.id === campaign.id ? null : campaign
    );
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        analyticsContainerRef.current &&
        !analyticsContainerRef.current.contains(event.target)
      ) {
        setOpenSection(null);
        setSelectedCampaign(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const renderReport = (title, data) => {
    return (
      <div className="report-card">
        <h3>{title}</h3>

        <p className="report-description">
          Each percentage represents the response rate for that specific
          campaign during the selected period.
        </p>

        <div className="report-periods">
          {data.map((item) => (
            <div className="report-period" key={item.period}>
              <div className="report-period-title">
                {item.period}
              </div>

              <div className="report-campaigns">
                {item.campaigns.map((campaign) => (
                  <div
                    className="report-campaign"
                    key={`${item.period}-${campaign.name}`}
                  >
                    <div className="report-campaign-header">
                      <span>{campaign.name}</span>
                      <strong>{campaign.value}%</strong>
                    </div>

                    <div className="report-progress">
                      <div
                        style={{
                          width: `${campaign.value}%`,
                        }}
                      />
                    </div>

                    <small>Response Rate</small>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (openSection === "overview") {
      return (
        <div className="content-area">
          <h2>Overview</h2>

          <div className="analytics-grid">
            <div className="metric-card">
              <span>Total Activity</span>
              <strong>12,450</strong>

              <div className="mini-bars">
                <i style={{ height: "45%" }} />
                <i style={{ height: "65%" }} />
                <i style={{ height: "52%" }} />
                <i style={{ height: "78%" }} />
                <i style={{ height: "68%" }} />
                <i style={{ height: "90%" }} />
                <i style={{ height: "80%" }} />
              </div>
            </div>

            <div className="metric-card">
              <span>Overall Reach</span>
              <strong>18.5K</strong>

              <div className="reach-chart">
                <div style={{ height: "48%" }} />
                <div style={{ height: "62%" }} />
                <div style={{ height: "55%" }} />
                <div style={{ height: "78%" }} />
                <div style={{ height: "88%" }} />
                <div style={{ height: "72%" }} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (openSection === "campaign") {
      return (
        <div className="content-area">
          <h2>Campaign Performance</h2>

          <div className="content-section">
            <h3>Top Campaigns</h3>

            <div className="horizontal-chart">
              {campaigns.map((campaign) => (
                <div key={campaign.id}>
                  <button
                    className={`campaign-row ${
                      selectedCampaign?.id === campaign.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => selectCampaign(campaign)}
                  >
                    <span>{campaign.name}</span>

                    <div className="campaign-progress">
                      <i
                        style={{
                          width: `${campaign.performance}%`,
                        }}
                      />
                    </div>

                    <b>{campaign.performance}%</b>
                  </button>

                  {selectedCampaign?.id === campaign.id && (
                    <div className="details-panel">
                      <div>
                        <span>Campaign Name</span>
                        <strong>{campaign.name}</strong>
                      </div>

                      <div>
                        <span>Created Date & Time</span>
                        <strong>{campaign.createdDate}</strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong
                          className={
                            campaign.status === "Active"
                              ? "active-status"
                              : "completed-status"
                          }
                        >
                          {campaign.status}
                        </strong>
                      </div>

                      <div>
                        <span>Performance</span>
                        <strong>{campaign.performance}%</strong>
                      </div>

                      <div className="engagement-detail-card">
                        <span>Open Rate</span>
                        <strong>{campaign.openRate}%</strong>

                        <div className="engagement-progress">
                          <div
                            style={{
                              width: `${campaign.openRate}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="engagement-detail-card">
                        <span>Click Rate</span>
                        <strong>{campaign.clickRate}%</strong>

                        <div className="engagement-progress">
                          <div
                            style={{
                              width: `${campaign.clickRate}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="engagement-detail-card">
                        <span>Response Rate</span>
                        <strong>{campaign.responseRate}%</strong>

                        <div className="engagement-progress">
                          <div
                            style={{
                              width: `${campaign.responseRate}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="content-section">
            <h3>Campaign Comparison</h3>

            <div className="comparison-table">
              <div className="comparison-header">
                <span>Campaign</span>
                <span>Sent</span>
                <span>Delivered</span>
                <span>Read</span>
                <span>Responses</span>
              </div>

              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  className={`comparison-row ${
                    selectedCampaign?.id === campaign.id
                      ? "comparison-selected"
                      : ""
                  }`}
                  onClick={() => selectCampaign(campaign)}
                >
                  <span className="campaign-name-cell">
                    {campaign.name}
                  </span>

                  <span className="number-cell">
                    {campaign.sent.toLocaleString()}
                  </span>

                  <span className="number-cell">
                    {campaign.delivered.toLocaleString()}
                  </span>

                  <span className="number-cell">
                    {campaign.read.toLocaleString()}
                  </span>

                  <span className="number-cell">
                    {campaign.responses.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (openSection === "channel") {
      return (
        <div className="content-area">
          <h2>Channel Performance</h2>

          <div className="content-section">
            <h3>WhatsApp</h3>

            <div className="whatsapp-card">
              <div className="whatsapp-logo">W</div>

              <div className="whatsapp-details">
                <strong>WhatsApp</strong>
                <span>Channel performance overview</span>
              </div>

              <div className="channel-status">Active</div>
            </div>

            <div className="line-chart">
              <div className="line">
                <span style={{ left: "5%", bottom: "35%" }} />
                <span style={{ left: "20%", bottom: "52%" }} />
                <span style={{ left: "35%", bottom: "42%" }} />
                <span style={{ left: "50%", bottom: "68%" }} />
                <span style={{ left: "65%", bottom: "58%" }} />
                <span style={{ left: "80%", bottom: "82%" }} />
                <span style={{ left: "95%", bottom: "72%" }} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (openSection === "delivery") {
      return (
        <div className="content-area">
          <h2>Delivery Status</h2>

          <div className="status-grid">
            <div className="status-card successful">
              <div className="circle">82%</div>
              <strong>Successful</strong>
            </div>

            <div className="status-card pending">
              <div className="circle">12%</div>
              <strong>Pending</strong>
            </div>

            <div className="status-card bounced">
              <div className="circle">6%</div>
              <strong>Bounced</strong>
            </div>
          </div>
        </div>
      );
    }

    if (openSection === "reports") {
      return (
        <div className="content-area">
          <h2>Reports</h2>

          <div className="report-tabs">
            {renderReport("Daily Report", reportData.daily)}
            {renderReport("Weekly Report", reportData.weekly)}
            {renderReport("Monthly Report", reportData.monthly)}
          </div>
        </div>
      );
    }

    return (
      <div className="empty-content">
        <div className="empty-icon">↗</div>
        <h2>Analytics</h2>
        <p>Select an option from the left side to view analytics.</p>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .analytics-page {
            min-height: 100vh;
            padding: 30px;
            background: #f6f8fc;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
          }

          .analytics-heading {
            margin-bottom: 25px;
          }

          .analytics-heading h1 {
            margin: 0;
            color: #27344b;
            font-size: 30px;
            font-weight: 700;
          }

          .analytics-heading p {
            margin: 7px 0 0;
            color: #8992a3;
            font-size: 14px;
          }

          .analytics-layout {
            display: grid;
            grid-template-columns: 285px 1fr;
            gap: 24px;
            max-width: 1250px;
            min-height: 650px;
            margin: 0 auto;
            align-items: start;
          }

          .analytics-menu {
            padding: 10px;
            background: #ffffff;
            border: 1px solid #e5e9f0;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(38, 51, 76, 0.06);
          }

          .menu-option {
            margin-bottom: 8px;
          }

          .menu-option:last-child {
            margin-bottom: 0;
          }

          .menu-button {
            position: relative;
            width: 100%;
            min-height: 53px;
            padding: 15px 42px 15px 20px;
            border: none;
            border-radius: 9px;
            background: transparent;
            color: #5e697b;
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .menu-button::before {
            content: "";
            position: absolute;
            left: 10px;
            top: 50%;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #a5a9e9;
            transform: translateY(-50%);
          }

          .menu-button span {
            margin-left: 12px;
          }

          .menu-button::after {
            content: "›";
            position: absolute;
            right: 18px;
            top: 50%;
            color: #9aa2b1;
            font-size: 20px;
            transform: translateY(-50%);
          }

          .menu-button:hover,
          .menu-button.active {
            background: #f1f3ff;
            color: #5963d5;
          }

          .menu-button.active::before {
            background: #6671e7;
          }

          .menu-button.active::after {
            color: #6671e7;
          }

          .analytics-content {
            min-width: 0;
            min-height: 650px;
            background: #ffffff;
            border: 1px solid #e4e8ef;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(38, 51, 76, 0.06);
            overflow: hidden;
          }

          .empty-content {
            min-height: 650px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
          }

          .empty-icon {
            width: 70px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
            border-radius: 18px;
            background: #f0f1ff;
            color: #6872df;
            font-size: 32px;
          }

          .empty-content h2 {
            margin: 0 0 8px;
            color: #39455a;
            font-size: 22px;
          }

          .empty-content p {
            margin: 0;
            color: #9098a7;
            font-size: 14px;
          }

          .content-area {
            padding: 30px;
          }

          .content-area > h2 {
            margin: 0 0 25px;
            color: #2e3b51;
            font-size: 23px;
            font-weight: 700;
          }

          .analytics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }

          .metric-card {
            min-height: 170px;
            padding: 20px;
            border: 1px solid #e9edf3;
            border-radius: 12px;
            background: #fcfdff;
          }

          .metric-card > span {
            display: block;
            margin-bottom: 10px;
            color: #7f899a;
            font-size: 13px;
          }

          .metric-card strong {
            display: block;
            color: #5964d8;
            font-size: 27px;
          }

          .mini-bars {
            height: 65px;
            display: flex;
            align-items: flex-end;
            gap: 7px;
            margin-top: 15px;
          }

          .mini-bars i {
            flex: 1;
            border-radius: 5px 5px 2px 2px;
            background: linear-gradient(180deg, #8790ef, #b8aceb);
          }

          .reach-chart {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            height: 65px;
            margin-top: 14px;
          }

          .reach-chart div {
            flex: 1;
            border-radius: 5px 5px 2px 2px;
            background: linear-gradient(180deg, #8d96ee, #bbb1e9);
          }

          .content-section {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #e9edf3;
            border-radius: 12px;
            background: #fcfdff;
          }

          .content-section:last-child {
            margin-bottom: 0;
          }

          .content-section h3 {
            margin: 0 0 18px;
            color: #5e697b;
            font-size: 15px;
          }

          .horizontal-chart {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .horizontal-chart > div {
            width: 100%;
          }

          .campaign-row {
            width: 100%;
            display: grid;
            grid-template-columns: 145px minmax(0, 1fr) 55px;
            align-items: center;
            gap: 12px;
            padding: 12px 10px;
            border: 1px solid transparent;
            border-radius: 9px;
            background: #ffffff;
            font-family: inherit;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .campaign-row:hover,
          .campaign-row.selected {
            background: #f5f6ff;
            border-color: #dfe2fa;
          }

          .campaign-row > span {
            color: #667184;
            font-size: 12px;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .campaign-progress {
            height: 10px;
            overflow: hidden;
            border-radius: 20px;
            background: #edf0f5;
          }

          .campaign-progress i {
            display: block;
            height: 100%;
            border-radius: 20px;
            background: linear-gradient(90deg, #e892b7, #f3b3cf);
          }

          .campaign-row b {
            color: #6670d5;
            font-size: 12px;
            text-align: right;
          }

          .details-panel {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 8px 0 5px;
            padding: 15px;
            border-left: 3px solid #a397e5;
            border-radius: 0 8px 8px 0;
            background: #ffffff;
          }

          .details-panel > div {
            padding: 13px;
            border-radius: 8px;
            background: #fafbfe;
          }

          .details-panel span {
            display: block;
            margin-bottom: 5px;
            color: #929aaa;
            font-size: 11px;
          }

          .details-panel strong {
            color: #5f6a7d;
            font-size: 13px;
          }

          .active-status {
            color: #55af80 !important;
          }

          .completed-status {
            color: #d59a52 !important;
          }

          .engagement-detail-card {
            background: #ffffff !important;
            border: 1px solid #e9edf3;
          }

          .engagement-detail-card strong {
            display: block;
            margin-bottom: 12px;
            color: #6874d8 !important;
            font-size: 27px;
            font-weight: 700;
          }

          .engagement-progress {
            width: 100%;
            height: 8px;
            overflow: hidden;
            border-radius: 20px;
            background: #edf0f5;
          }

          .engagement-progress div {
            height: 100%;
            border-radius: 20px;
            background: #7b86df;
          }

          .comparison-table {
            width: 100%;
            overflow-x: auto;
          }

          .comparison-header,
          .comparison-row {
            width: 100%;
            min-width: 680px;
            display: grid;
            grid-template-columns: minmax(180px, 1.8fr) repeat(4, minmax(100px, 1fr));
            align-items: center;
            column-gap: 0;
          }

          .comparison-header {
            padding: 13px 15px;
            border-radius: 8px 8px 0 0;
            background: #f1f3ff;
            color: #727c8d;
            font-size: 11px;
            font-weight: 700;
          }

          .comparison-header span {
            text-align: center;
          }

          .comparison-header span:first-child {
            text-align: left;
          }

          .comparison-row {
            padding: 13px 15px;
            border: none;
            border-bottom: 1px solid #edf0f4;
            background: #ffffff;
            color: #737d8e;
            font-family: inherit;
            font-size: 12px;
            text-align: left;
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .comparison-row:hover,
          .comparison-row.comparison-selected {
            background: #f8f9ff;
            color: #5963d5;
          }

          .campaign-name-cell {
            text-align: left;
            font-weight: 600;
            padding-right: 15px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .number-cell {
            text-align: center;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }

          .whatsapp-card {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 18px;
            background: #ffffff;
            border: 1px solid #e7ecef;
            border-radius: 10px;
          }

          .whatsapp-logo {
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #e8f8f0;
            color: #42a978;
            font-size: 21px;
            font-weight: 700;
          }

          .whatsapp-details {
            flex: 1;
          }

          .whatsapp-details strong {
            display: block;
            color: #4f5b6d;
            font-size: 14px;
          }

          .whatsapp-details span {
            display: block;
            margin-top: 4px;
            color: #929aaa;
            font-size: 11px;
          }

          .channel-status {
            padding: 6px 12px;
            border-radius: 20px;
            background: #e9f8f1;
            color: #4ca978;
            font-size: 11px;
            font-weight: 600;
          }

          .line-chart {
            position: relative;
            height: 180px;
            margin-top: 20px;
            border-bottom: 1px solid #e7eaf0;
            background: repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent 44px,
              #f0f2f6 45px
            );
          }

          .line {
            position: absolute;
            inset: 0;
          }

          .line::before {
            content: "";
            position: absolute;
            left: 5%;
            right: 5%;
            bottom: 0;
            height: 2px;
            background: #7d87e9;
            transform: rotate(-5deg);
            transform-origin: left center;
          }

          .line span {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #707be4;
            border: 3px solid #ffffff;
            box-shadow: 0 0 0 1px #8b93e7;
          }

          .status-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .status-card {
            padding: 25px 15px;
            text-align: center;
            border: 1px solid #e9edf2;
            border-radius: 12px;
            background: #fcfdff;
          }

          .status-card .circle {
            width: 85px;
            height: 85px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 13px;
            border-radius: 50%;
            font-size: 18px;
            font-weight: 700;
          }

          .successful .circle {
            background: #e9f8f1;
            color: #4cae7f;
          }

          .pending .circle {
            background: #fff7e9;
            color: #d69b43;
          }

          .bounced .circle {
            background: #fff0f2;
            color: #d27a8c;
          }

          .status-card strong {
            color: #697386;
            font-size: 13px;
          }

          .report-tabs {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .report-card {
            padding: 20px;
            border: 1px solid #e9edf3;
            border-radius: 12px;
            background: #fcfdff;
          }

          .report-card h3 {
            margin: 0 0 8px;
            color: #626d7f;
            font-size: 16px;
          }

          .report-description {
            margin: 0 0 20px;
            color: #929aaa;
            font-size: 12px;
          }

          .report-periods {
            display: grid;
            gap: 16px;
          }

          .report-period {
            padding: 16px;
            border: 1px solid #e8ecf2;
            border-radius: 10px;
            background: #ffffff;
          }

          .report-period-title {
            margin-bottom: 15px;
            color: #5c677a;
            font-size: 14px;
            font-weight: 700;
          }

          .report-campaigns {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
          }

          .report-campaign {
            min-width: 0;
            padding: 12px;
            border: 1px solid #edf0f4;
            border-radius: 8px;
            background: #fafbfe;
          }

          .report-campaign-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 10px;
          }

          .report-campaign-header span {
            color: #687386;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.4;
          }

          .report-campaign-header strong {
            color: #5f69d4;
            font-size: 13px;
            white-space: nowrap;
          }

          .report-progress {
            width: 100%;
            height: 7px;
            overflow: hidden;
            border-radius: 20px;
            background: #e9edf3;
          }

          .report-progress div {
            height: 100%;
            border-radius: 20px;
            background: linear-gradient(90deg, #7c86e9, #a9a0e7);
          }

          .report-campaign small {
            display: block;
            margin-top: 7px;
            color: #9aa1af;
            font-size: 9px;
          }

          @media (max-width: 1100px) {
            .report-campaigns {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (max-width: 900px) {
            .analytics-layout {
              grid-template-columns: 220px 1fr;
            }

            .analytics-grid {
              grid-template-columns: 1fr;
            }

            .report-campaigns {
              grid-template-columns: repeat(2, 1fr);
            }

            .comparison-header,
            .comparison-row {
              min-width: 650px;
            }
          }

          @media (max-width: 700px) {
            .analytics-page {
              padding: 20px 14px;
            }

            .analytics-layout {
              grid-template-columns: 1fr;
            }

            .analytics-menu {
              width: 100%;
            }

            .analytics-content {
              min-height: 500px;
            }

            .empty-content {
              min-height: 400px;
            }

            .content-area {
              padding: 20px;
            }

            .status-grid,
            .details-panel {
              grid-template-columns: 1fr;
            }

            .campaign-row {
              grid-template-columns: 105px minmax(0, 1fr) 40px;
            }

            .comparison-header,
            .comparison-row {
              min-width: 650px;
              grid-template-columns: minmax(150px, 1.5fr) repeat(4, minmax(95px, 1fr));
            }

            .report-campaigns {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="analytics-page">
        <div className="analytics-heading">
          <h1>Analytics</h1>
          <p>Monitor and analyze your campaign performance</p>
        </div>

        <div
          className="analytics-layout"
          ref={analyticsContainerRef}
        >
          <div className="analytics-menu">
            <div className="menu-option">
              <button
                className={`menu-button ${
                  openSection === "overview" ? "active" : ""
                }`}
                onClick={() => toggleSection("overview")}
              >
                <span>Overview</span>
              </button>
            </div>

            <div className="menu-option">
              <button
                className={`menu-button ${
                  openSection === "campaign" ? "active" : ""
                }`}
                onClick={() => toggleSection("campaign")}
              >
                <span>Campaign Performance</span>
              </button>
            </div>

            <div className="menu-option">
              <button
                className={`menu-button ${
                  openSection === "channel" ? "active" : ""
                }`}
                onClick={() => toggleSection("channel")}
              >
                <span>Channel Performance</span>
              </button>
            </div>

            <div className="menu-option">
              <button
                className={`menu-button ${
                  openSection === "delivery" ? "active" : ""
                }`}
                onClick={() => toggleSection("delivery")}
              >
                <span>Delivery Status</span>
              </button>
            </div>

            <div className="menu-option">
              <button
                className={`menu-button ${
                  openSection === "reports" ? "active" : ""
                }`}
                onClick={() => toggleSection("reports")}
              >
                <span>Reports</span>
              </button>
            </div>
          </div>

          <div className="analytics-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Analytics;