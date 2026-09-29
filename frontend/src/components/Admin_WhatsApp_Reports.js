import React, { useState } from "react";
import {
  FaChartBar,
  FaUsers,
  FaWhatsapp,
  FaBullhorn,
  FaRobot,
  FaDownload,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaSearch
} from "react-icons/fa";

const ranges = [
  "Today",
  "Last 7 Days",
  "Last 30 Days",
  "Last 90 Days",
  "This Year"
];

const data = {
  Today: {
    users: [["Today", 12580, 9840, 310]],
    messages: [
      ["Sent", 3240, 3020, "93.2%"],
      ["Delivered", 3020, 2840, "94.0%"],
      ["Read", 2760, 2590, "93.8%"],
      ["Failed", 220, 180, "81.8%"],
      ["Received", 1420, 1330, "93.7%"]
    ],
    campaigns: [
      ["Website Enquiry", 620, 585, "94.4%", 142],
      ["Product Demo", 480, 452, "94.2%", 118],
      ["New Offer Campaign", 390, 365, "93.6%", 96],
      ["Customer Follow-up", 320, 300, "93.8%", 82]
    ],
    automations: [
      ["Product Inquiry", 820, 790, "96.3%"],
      ["Booking Team", 740, 710, "95.9%"],
      ["Support Team", 680, 650, "95.6%"],
      ["Lead Follow-up", 590, 565, "95.8%"]
    ],
    chart: [
      ["8 AM", 220],
      ["10 AM", 260],
      ["12 PM", 310],
      ["2 PM", 280],
      ["4 PM", 360],
      ["6 PM", 410],
      ["8 PM", 390],
      ["10 PM", 470],
      ["11 PM", 540]
    ]
  },

  "Last 7 Days": {
    users: [
      ["Monday", 11920, 9120, 210],
      ["Tuesday", 12050, 9280, 230],
      ["Wednesday", 12180, 9430, 250],
      ["Thursday", 12300, 9560, 265],
      ["Friday", 12420, 9680, 280],
      ["Saturday", 12510, 9760, 295],
      ["Sunday", 12580, 9840, 310]
    ],
    messages: [
      ["Sent", 18940, 17260, "95.1%"],
      ["Delivered", 17620, 16090, "94.8%"],
      ["Read", 16380, 14960, "92.9%"],
      ["Failed", 1320, 1170, "88.6%"],
      ["Received", 9240, 8680, "93.9%"]
    ],
    campaigns: [
      ["Website Enquiry", 2120, 2005, "94.6%", 520],
      ["Product Demo", 1680, 1590, "94.6%", 405],
      ["New Offer Campaign", 1420, 1320, "93.0%", 330],
      ["Customer Follow-up", 1180, 1095, "92.8%", 286]
    ],
    automations: [
      ["Product Inquiry", 1820, 1748, "96.0%"],
      ["Booking Team", 1690, 1620, "95.9%"],
      ["Support Team", 1580, 1510, "95.6%"],
      ["Lead Follow-up", 1420, 1360, "95.8%"]
    ],
    chart: [
      ["Mon", 2100],
      ["Tue", 2450],
      ["Wed", 2520],
      ["Thu", 2680],
      ["Fri", 2890],
      ["Sat", 3020],
      ["Sun", 3280]
    ]
  },

  "Last 30 Days": {
    users: [
      ["Week 1", 18000, 13500, 1100],
      ["Week 2", 19000, 14500, 1200],
      ["Week 3", 20000, 15400, 1300],
      ["Week 4", 21000, 16300, 1400],
      ["Week 5", 22000, 17200, 1500]
    ],
    messages: [
      ["Sent", 84620, 78450, "92.7%"],
      ["Delivered", 78450, 73120, "93.2%"],
      ["Read", 73120, 68540, "93.7%"],
      ["Failed", 6170, 5330, "86.4%"],
      ["Received", 42680, 39850, "93.4%"]
    ],
    campaigns: [
      ["Website Enquiry", 8420, 7920, "94.1%", 1820],
      ["Product Demo", 6230, 5890, "94.5%", 1420],
      ["New Offer Campaign", 5120, 4780, "93.4%", 1180],
      ["Customer Follow-up", 4680, 4390, "93.8%", 980]
    ],
    automations: [
      ["Product Inquiry", 4250, 4080, "96.0%"],
      ["Booking Team", 3980, 3820, "96.0%"],
      ["Support Team", 3756, 3590, "95.6%"],
      ["Lead Follow-up", 3420, 3280, "95.9%"]
    ],
    chart: [
      ["Week 1", 14000],
      ["Week 2", 16000],
      ["Week 3", 17000],
      ["Week 4", 18000],
      ["Week 5", 19620]
    ]
  },

  "Last 90 Days": {
    users: [
      ["Month 1", 420000, 310000, 4200],
      ["Month 2", 450000, 335000, 4700],
      ["Month 3", 480000, 360000, 5200]
    ],
    messages: [
      ["Sent", 218640, 202480, "92.6%"],
      ["Delivered", 202480, 189760, "93.7%"],
      ["Read", 189760, 178920, "94.3%"],
      ["Failed", 16160, 12720, "78.7%"],
      ["Received", 108420, 101580, "93.7%"]
    ],
    campaigns: [
      ["Website Enquiry", 21640, 20410, "94.3%", 5420],
      ["Product Demo", 18920, 17850, "94.3%", 4680],
      ["New Offer Campaign", 15760, 14820, "94.0%", 3940],
      ["Customer Follow-up", 13480, 12710, "94.3%", 3120]
    ],
    automations: [
      ["Product Inquiry", 11420, 10980, "96.1%"],
      ["Booking Team", 10860, 10420, "96.0%"],
      ["Support Team", 9760, 9380, "96.1%"],
      ["Lead Follow-up", 8920, 8560, "96.0%"]
    ],
    chart: [
      ["Month 1", 52000],
      ["Month 2", 71000],
      ["Month 3", 95640]
    ]
  },

  "This Year": {
    users: [
      ["January", 520000, 390000, 5200],
      ["February", 550000, 415000, 5600],
      ["March", 580000, 440000, 6000],
      ["April", 610000, 465000, 6400],
      ["May", 640000, 490000, 6800],
      ["June", 670000, 515000, 7200],
      ["July", 700000, 540000, 7600],
      ["August", 730000, 565000, 8000],
      ["September", 850000, 660000, 8500],
      ["October", 880000, 685000, 9000],
      ["November", 910000, 710000, 9500],
      ["December", 940000, 735000, 10000]
    ],
    messages: [
      ["Sent", 842360, 781420, "92.8%"],
      ["Delivered", 781420, 733860, "93.9%"],
      ["Read", 733860, 689240, "93.9%"],
      ["Failed", 60940, 47560, "78.0%"],
      ["Received", 426820, 399740, "93.7%"]
    ],
    campaigns: [
      ["Website Enquiry", 84200, 79240, "94.1%", 18240],
      ["Product Demo", 62300, 58900, "94.5%", 14200],
      ["New Offer Campaign", 51200, 47800, "93.4%", 11800],
      ["Customer Follow-up", 46800, 43900, "93.8%", 9800]
    ],
    automations: [
      ["Product Inquiry", 42500, 40800, "96.0%"],
      ["Booking Team", 39800, 38200, "96.0%"],
      ["Support Team", 37560, 35900, "95.6%"],
      ["Lead Follow-up", 34200, 32800, "95.9%"]
    ],
    chart: [
      ["Jan", 52000],
      ["Feb", 56000],
      ["Mar", 60000],
      ["Apr", 62000],
      ["May", 65000],
      ["Jun", 68000],
      ["Jul", 70000],
      ["Aug", 73000],
      ["Sep", 76000],
      ["Oct", 80000],
      ["Nov", 84000],
      ["Dec", 96360]
    ]
  }
};

const options = [
  ["Overview Report", FaChartBar],
  ["User Report", FaUsers],
  ["Message Report", FaWhatsapp],
  ["Campaign Report", FaBullhorn],
  ["Automation Report", FaRobot],
  ["Export Reports", FaDownload]
];

const num = value => Number(String(value).replace(/,/g, ""));
const fmt = value => Number(value).toLocaleString("en-IN");

function Admin_WhatsApp_Reports() {
  const [report, setReport] = useState("Overview Report");
  const [range, setRange] = useState("Last 30 Days");
  const [search, setSearch] = useState("");

  const d = data[range];

  const userTotals = d.users.reduce(
    (total, row) => ({
      total: total.total + num(row[1]),
      active: total.active + num(row[2]),
      newUsers: total.newUsers + num(row[3])
    }),
    {
      total: 0,
      active: 0,
      newUsers: 0
    }
  );

  userTotals.inactive = userTotals.total - userTotals.active;

  const messageTotal = d.messages[0][1];

  const campaignTotal = d.campaigns.reduce(
    (total, row) => total + num(row[1]),
    0
  );

  const automationTotal = d.automations.reduce(
    (total, row) => total + num(row[1]),
    0
  );

  const stats = [
    ["Total Users", userTotals.total, "5.7", 1, FaUsers],
    ["Messages Sent", messageTotal, "9.8", 1, FaWhatsapp],
    ["Campaigns", campaignTotal, "6.4", 1, FaBullhorn],
    ["Automations", automationTotal, "3.2", 0, FaRobot]
  ];

  const filter = rows =>
    rows.filter(row =>
      row[0].toLowerCase().includes(search.toLowerCase())
    );

  const exportReport = () => {
    let text =
      `WhatsApp Report\n` +
      `Period: ${range}\n` +
      `Report: ${report}\n\n`;

    text += `Total Users: ${fmt(userTotals.total)}\n`;
    text += `Active Users: ${fmt(userTotals.active)}\n`;
    text += `New Users: ${fmt(userTotals.newUsers)}\n`;
    text += `Inactive Users: ${fmt(userTotals.inactive)}\n`;
    text += `Messages Sent: ${fmt(messageTotal)}\n`;
    text += `Campaigns: ${fmt(campaignTotal)}\n`;
    text += `Automations: ${fmt(automationTotal)}\n`;

    if (report === "User Report") {
      text += "\nPeriod,Total Users,Active Users,New Users,Inactive Users\n";

      d.users.forEach(row => {
        text +=
          `${row[0]},${fmt(row[1])},${fmt(row[2])},` +
          `${fmt(row[3])},${fmt(num(row[1]) - num(row[2]))}\n`;
      });
    }

    const blob = new Blob([text], {
      type: "text/plain"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `${report.replace(/\s/g, "_")}_` +
      `${range.replace(/\s/g, "_")}.txt`;

    link.click();
    URL.revokeObjectURL(url);
  };

  const Table = ({ rows, type }) => {
    const headers = {
      User: [
        "Period",
        "Total Users",
        "Active Users",
        "New Users",
        "Inactive Users"
      ],

      Message: [
        "Type",
        "Total",
        "Successful",
        "Success Rate"
      ],

      Campaign: [
        "Campaign",
        "Sent",
        "Delivered",
        "Delivery Rate",
        "Responses"
      ],

      Automation: [
        "Automation",
        "Executions",
        "Successful",
        "Success Rate"
      ]
    }[type];

    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filter(rows).map((row, index) => (
              <tr key={index}>
                <td>{row[0]}</td>

                {type === "User" && (
                  <>
                    <td>{fmt(row[1])}</td>
                    <td>{fmt(row[2])}</td>
                    <td>{fmt(row[3])}</td>
                    <td>
                      {fmt(num(row[1]) - num(row[2]))}
                    </td>
                  </>
                )}

                {type === "Message" && (
                  <>
                    <td>{fmt(row[1])}</td>
                    <td>{fmt(row[2])}</td>
                    <td className="success">
                      {row[3]}
                    </td>
                  </>
                )}

                {type === "Campaign" && (
                  <>
                    <td>{fmt(row[1])}</td>
                    <td>{fmt(row[2])}</td>
                    <td className="success">
                      {row[3]}
                    </td>
                    <td>{fmt(row[4])}</td>
                  </>
                )}

                {type === "Automation" && (
                  <>
                    <td>{fmt(row[1])}</td>
                    <td>{fmt(row[2])}</td>
                    <td className="success">
                      {row[3]}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f7f8fc;
          padding: 28px;
          font-family: Arial, sans-serif;
          color: #29243d;
        }

        .wrap {
          max-width: 1450px;
          margin: auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 22px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
        }

        h2 {
          margin: 0;
          font-size: 18px;
        }

        .sub {
          margin-top: 6px;
          color: #817c90;
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .date,
        .btn {
          border: 1px solid #e2dfeb;
          background: white;
          border-radius: 9px;
          padding: 10px 13px;
        }

        .date {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date svg {
          color: #6845d7;
        }

        .date select {
          border: 0;
          outline: 0;
          background: white;
          cursor: pointer;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #6845d7;
          color: white;
          border: 0;
          cursor: pointer;
        }

        .period {
          display: flex;
          align-items: center;
          background: #6845d7;
          color: white;
          border-radius: 11px;
          padding: 14px 18px;
          margin-bottom: 20px;
        }

        .layout {
          display: grid;
          grid-template-columns: 215px 1fr;
          gap: 20px;
        }

        .side,
        .card {
          background: white;
          border: 1px solid #eceaf3;
          border-radius: 13px;
        }

        .side {
          height: max-content;
          padding: 13px;
        }

        .side-title {
          padding: 9px 11px 13px;
          color: #908b9e;
          font-size: 12px;
          font-weight: bold;
        }

        .option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          margin-bottom: 3px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #686375;
          text-align: left;
          cursor: pointer;
        }

        .option:hover,
        .option.active {
          background: #eeeaff;
          color: #6845d7;
        }

        .option.active {
          font-weight: bold;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 18px;
        }

        .stat {
          padding: 17px;
          background: white;
          border: 1px solid #eceaf3;
          border-radius: 13px;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
        }

        .icon {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eeeaff;
          color: #6845d7;
          border-radius: 9px;
        }

        .change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .up {
          color: #15935b;
        }

        .down {
          color: #df5656;
        }

        .label {
          margin-top: 13px;
          color: #858093;
          font-size: 12px;
        }

        .value {
          margin-top: 4px;
          font-size: 24px;
          font-weight: bold;
        }

        .card {
          padding: 20px;
          margin-bottom: 18px;
        }

        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 18px;
        }

        .desc {
          margin-top: 5px;
          color: #898497;
          font-size: 12px;
        }

        .search {
          width: 220px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          border: 1px solid #e3e0eb;
          border-radius: 8px;
        }

        .search svg {
          color: #9994a6;
        }

        .search input {
          width: 100%;
          border: 0;
          outline: 0;
        }

        .chart-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .chart-label {
          color: #777184;
          font-size: 12px;
          font-weight: bold;
        }

        .chart-box {
          padding: 18px 12px 10px;
          border: 1px solid #eeeaf4;
          border-radius: 10px;
        }

        .axis-y {
          margin-bottom: 5px;
          color: #8a8495;
          font-size: 11px;
        }

        .chart {
          height: 270px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          padding: 15px 5px 0;
          border-bottom: 1px solid #ddd9e8;
        }

        .bar-wrap {
          height: 100%;
          flex: 1;
          min-width: 45px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
        }

        .bar-value {
          margin-bottom: 5px;
          color: #5f596c;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        }

        .bar {
          width: 70%;
          max-width: 45px;
          min-height: 4px;
          background: #6845d7;
          border-radius: 6px 6px 2px 2px;
        }

        .bar-label {
          margin-top: 8px;
          color: #777184;
          font-size: 10px;
          white-space: nowrap;
        }

        .axis-x {
          margin-top: 12px;
          color: #8a8495;
          font-size: 11px;
          text-align: center;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .summary div {
          padding: 15px;
          background: #f8f7fc;
          border-radius: 9px;
        }

        .summary b {
          display: block;
          margin-top: 5px;
          font-size: 18px;
        }

        .user-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .user-box {
          padding: 15px;
          background: #f8f7fc;
          border-radius: 10px;
        }

        .user-box small {
          color: #817c90;
        }

        .user-box strong {
          display: block;
          margin-top: 6px;
          font-size: 21px;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
        }

        th {
          padding: 12px;
          background: #f8f7fc;
          color: #706b7d;
          font-size: 12px;
          text-align: left;
        }

        td {
          padding: 13px;
          border-bottom: 1px solid #f0eef5;
          font-size: 13px;
        }

        tr:last-child td {
          border-bottom: 0;
        }

        .success {
          color: #15935b;
          font-weight: bold;
        }

        .export {
          padding: 35px;
          text-align: center;
        }

        .export-icon {
          width: 62px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          background: #eeeaff;
          color: #6845d7;
          border-radius: 50%;
          font-size: 24px;
        }

        .export h2 {
          margin-bottom: 7px;
        }

        .export p {
          max-width: 550px;
          margin: 0 auto 18px;
          color: #817c90;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 1000px) {
          .stats,
          .summary,
          .user-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {
          .header {
            flex-direction: column;
            align-items: flex-start;
          }

          .layout {
            grid-template-columns: 1fr;
          }

          .actions {
            width: 100%;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 600px) {
          .stats,
          .summary,
          .user-summary {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }

          .date,
          .btn {
            justify-content: center;
          }

          .card-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .search {
            width: 100%;
          }

          .chart {
            gap: 5px;
          }

          .bar-label {
            font-size: 9px;
          }
        }
      `}</style>

      <div className="wrap">
        <div className="header">
          <div>
            <h1>Reports</h1>

            <div className="sub">
              Monitor and analyze your WhatsApp platform performance.
            </div>
          </div>

          <div className="actions">
            <div className="date">
              <FaCalendarAlt />

              <select
                value={range}
                onChange={e => {
                  setRange(e.target.value);
                  setSearch("");
                }}
              >
                {ranges.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <button className="btn" onClick={exportReport}>
              <FaDownload />
              Export
            </button>
          </div>
        </div>

        <div className="period">
          <FaCalendarAlt />
          &nbsp;
          <b>{range}</b>
          &nbsp;— Complete data for the selected reporting period
        </div>

        <div className="layout">
          <aside className="side">
            <div className="side-title">
              REPORT TYPES
            </div>

            {options.map(([name, Icon]) => (
              <button
                key={name}
                className={`option ${
                  report === name ? "active" : ""
                }`}
                onClick={() => {
                  setReport(name);
                  setSearch("");
                }}
              >
                <Icon />
                {name}
              </button>
            ))}
          </aside>

          <main>
            {report === "Overview Report" && (
              <>
                <div className="stats">
                  {stats.map(
                    ([title, value, change, positive, Icon]) => (
                      <div className="stat" key={title}>
                        <div className="stat-top">
                          <div className="icon">
                            <Icon />
                          </div>

                          <div
                            className={`change ${
                              positive ? "up" : "down"
                            }`}
                          >
                            {positive ? (
                              <FaArrowUp />
                            ) : (
                              <FaArrowDown />
                            )}
                            {change}%
                          </div>
                        </div>

                        <div className="label">
                          {title}
                        </div>

                        <div className="value">
                          {fmt(value)}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="card">
                  <div className="card-head">
                    <div>
                      <h2>Message Activity</h2>

                      <div className="desc">
                        Messages sent during {range}
                      </div>
                    </div>
                  </div>

                  <div className="chart-title">
                    <span className="chart-label">
                      Messages Sent
                    </span>

                    <span className="chart-label">
                      {range}
                    </span>
                  </div>

                  <div className="chart-box">
                    <div className="axis-y">
                      Number of Messages
                    </div>

                    <div className="chart">
                      {d.chart.map(([label, value]) => {
                        const max = Math.max(
                          ...d.chart.map(item => item[1])
                        );

                        return (
                          <div
                            className="bar-wrap"
                            key={label}
                          >
                            <div className="bar-value">
                              {fmt(value)}
                            </div>

                            <div
                              className="bar"
                              style={{
                                height: `${(value / max) * 82}%`
                              }}
                            />

                            <div className="bar-label">
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="axis-x">
                      Time Period
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div>
                      <h2>System Summary</h2>

                      <div className="desc">
                        Key platform metrics for {range}
                      </div>
                    </div>
                  </div>

                  <div className="summary">
                    <div>
                      <span className="label">
                        Active Users
                      </span>

                      <b>
                        {fmt(userTotals.active)}
                      </b>
                    </div>

                    <div>
                      <span className="label">
                        Active WhatsApp Accounts
                      </span>

                      <b>
                        {range === "Today"
                          ? "42"
                          : range === "Last 7 Days"
                          ? "104"
                          : range === "Last 30 Days"
                          ? "148"
                          : range === "Last 90 Days"
                          ? "172"
                          : "186"}
                      </b>
                    </div>

                    <div>
                      <span className="label">
                        Successful Messages
                      </span>

                      <b>
                        {fmt(d.messages[1][2])}
                      </b>
                    </div>

                    <div>
                      <span className="label">
                        Automation Success Rate
                      </span>

                      <b>
                        {d.automations[0][3]}
                      </b>
                    </div>
                  </div>
                </div>
              </>
            )}

            {report === "User Report" && (
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>User Report</h2>

                    <div className="desc">
                      Complete user data for {range}
                    </div>
                  </div>

                  <div className="search">
                    <FaSearch />

                    <input
                      placeholder="Search period..."
                      value={search}
                      onChange={e =>
                        setSearch(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="user-summary">
                  <div className="user-box">
                    <small>Total Users</small>

                    <strong>
                      {fmt(userTotals.total)}
                    </strong>
                  </div>

                  <div className="user-box">
                    <small>Active Users</small>

                    <strong>
                      {fmt(userTotals.active)}
                    </strong>
                  </div>

                  <div className="user-box">
                    <small>New Users</small>

                    <strong>
                      {fmt(userTotals.newUsers)}
                    </strong>
                  </div>

                  <div className="user-box">
                    <small>Inactive Users</small>

                    <strong>
                      {fmt(userTotals.inactive)}
                    </strong>
                  </div>
                </div>

                <Table
                  rows={d.users}
                  type="User"
                />
              </div>
            )}

            {report === "Message Report" && (
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>Message Report</h2>

                    <div className="desc">
                      Message performance for {range}
                    </div>
                  </div>

                  <div className="search">
                    <FaSearch />

                    <input
                      placeholder="Search message type..."
                      value={search}
                      onChange={e =>
                        setSearch(e.target.value)
                      }
                    />
                  </div>
                </div>

                <Table
                  rows={d.messages}
                  type="Message"
                />
              </div>
            )}

            {report === "Campaign Report" && (
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>Campaign Report</h2>

                    <div className="desc">
                      Campaign performance for {range}
                    </div>
                  </div>

                  <div className="search">
                    <FaSearch />

                    <input
                      placeholder="Search campaign..."
                      value={search}
                      onChange={e =>
                        setSearch(e.target.value)
                      }
                    />
                  </div>
                </div>

                <Table
                  rows={d.campaigns}
                  type="Campaign"
                />
              </div>
            )}

            {report === "Automation Report" && (
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>Automation Report</h2>

                    <div className="desc">
                      Automation performance for {range}
                    </div>
                  </div>

                  <div className="search">
                    <FaSearch />

                    <input
                      placeholder="Search automation..."
                      value={search}
                      onChange={e =>
                        setSearch(e.target.value)
                      }
                    />
                  </div>
                </div>

                <Table
                  rows={d.automations}
                  type="Automation"
                />
              </div>
            )}

            {report === "Export Reports" && (
              <div className="card export">
                <div className="export-icon">
                  <FaDownload />
                </div>

                <h2>Export Report Data</h2>

                <p>
                  Export the complete report data for the
                  selected period: {range}.
                </p>

                <button
                  className="btn"
                  onClick={exportReport}
                >
                  <FaDownload />
                  Download Report
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Admin_WhatsApp_Reports;