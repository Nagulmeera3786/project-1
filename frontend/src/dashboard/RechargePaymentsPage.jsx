import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaWallet,
  FaCreditCard,
  FaMoneyBillWave,
  FaGlobe,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import API from "../api";

const methodCards = [
  { key: "upi", title: "UPI", icon: <FaWallet />, description: "Fast account-to-account payments with UPI apps." },
  { key: "netbanking", title: "Net Banking", icon: <FaMoneyBillWave />, description: "Pay directly using your internet banking login." },
  { key: "credit-card", title: "Credit Card", icon: <FaCreditCard />, description: "Global credit card acceptance with secure checkout." },
  { key: "debit-card", title: "Debit Card", icon: <FaCreditCard />, description: "Domestic and international debit card payments." },
  { key: "paypal", title: "PayPal", icon: <FaGlobe />, description: "Popular worldwide wallet option for global customers." },
  { key: "local-methods", title: "Popular Local Methods", icon: <FaGlobe />, description: "Local payment rails by region for higher conversion." },
];

const tabTitleMap = {
  "credit-details": "Credit Details",
  recharge: "Recharge Account",
  "payment-details": "Payment Details",
};

const statusMeta = {
  successful: { label: "Successful", icon: <FaCheckCircle />, color: "#16a34a", bg: "#dcfce7" },
  failed: { label: "Failed", icon: <FaTimesCircle />, color: "#dc2626", bg: "#fee2e2" },
  pending: { label: "Pending", icon: <FaHourglassHalf />, color: "#d97706", bg: "#ffedd5" },
};

const formatNumeric = (value) => {
  const parsed = Number(value || 0);
  if (Number.isNaN(parsed)) {
    return "0";
  }
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2);
};

const RechargePaymentsPage = () => {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const activeTab = searchParams.get("tab") || "recharge";

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await API.get("profile/");
        setProfile(response.data || null);
      } catch {
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const userPaymentRows = useMemo(() => {
    const userLabel = profile?.email || profile?.username || "your account";
    return [
      { id: "TXN-1042", amount: 1250, method: "UPI", status: "successful", date: "2026-04-12", account: userLabel },
      { id: "TXN-1041", amount: 2200, method: "Credit Card", status: "failed", date: "2026-04-11", account: userLabel },
      { id: "TXN-1040", amount: 499, method: "PayPal", status: "pending", date: "2026-04-10", account: userLabel },
      { id: "TXN-1039", amount: 999, method: "Net Banking", status: "successful", date: "2026-04-09", account: userLabel },
    ];
  }, [profile]);

  const filteredPayments = useMemo(() => {
    if (statusFilter === "all") {
      return userPaymentRows;
    }
    return userPaymentRows.filter((row) => row.status === statusFilter);
  }, [statusFilter, userPaymentRows]);

  const creditCards = [
    { title: "Wallet Balance", value: profile ? formatNumeric(profile.wallet_balance) : "0", note: "Available credit in your account" },
    { title: "Messages Available", value: profile ? formatNumeric(profile.sms_available_messages) : "0", note: "Messages remaining for current usage" },
    { title: "Messages Used", value: profile ? formatNumeric(profile.sms_used_messages) : "0", note: "Messages consumed from your allocation" },
    { title: "Total Limit", value: profile ? formatNumeric(profile.sms_total_limit) : "0", note: "Total messaging capacity assigned to your profile" },
  ];

  return (
    <div className="dashboard-shell">
      <h2 className="welcome-text" style={{ marginTop: 0 }}>Utilities - {tabTitleMap[activeTab] || "Recharge Account"}</h2>

      <div style={{ display: "grid", gap: "18px" }}>
        {activeTab === "credit-details" && (
          <section className="performance-section dashboard-fade-in" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Credit Details</h3>
            <p style={{ marginTop: "6px", color: "#475569", fontSize: "14px" }}>
              This view shows your current wallet credit and message availability.
            </p>
            {loadingProfile ? (
              <div style={{ color: "#475569", fontSize: "14px" }}>Loading credit details...</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px", marginTop: "10px" }}>
                  {creditCards.map((card) => (
                    <div key={card.title} style={{ border: "1px solid #d8cef4", borderRadius: "12px", padding: "14px", background: "#ffffff" }}>
                      <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{card.title}</div>
                      <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700, color: "#2d1b69" }}>{card.value}</div>
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#475569" }}>{card.note}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "14px", padding: "14px", borderRadius: "12px", background: "#f8f5ff", color: "#334155", fontSize: "14px" }}>
                  <strong>Account summary:</strong> {profile?.email || profile?.username || "Current user"} has {formatNumeric(profile?.sms_available_messages)} messages available and wallet balance {formatNumeric(profile?.wallet_balance)}.
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "recharge" && (
          <section className="performance-section dashboard-fade-in" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Recharge Account</h3>
            <p style={{ marginTop: "6px", color: "#475569", fontSize: "14px" }}>
              Choose one payment method below. Bank account details are intentionally not added.
            </p>
            <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
              {methodCards.map((method) => (
                <label
                  key={method.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    border: selectedMethod === method.key ? "2px solid #7c5dc7" : "1px solid #d8cef4",
                    borderRadius: "12px",
                    padding: "14px",
                    background: selectedMethod === method.key ? "#f6f1ff" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.key}
                    checked={selectedMethod === method.key}
                    onChange={() => setSelectedMethod(method.key)}
                    style={{ marginTop: "4px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5b3fa8", fontWeight: 700 }}>
                      <span>{method.icon}</span>
                      <span>{method.title}</span>
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#475569" }}>{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}

        {activeTab === "payment-details" && (
          <section className="performance-section dashboard-fade-in dashboard-delay-1" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Your Payment History</h3>
            <p style={{ marginTop: "6px", color: "#475569", fontSize: "14px" }}>
              Only payments associated with your current profile are shown here.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <button className="register-btn" onClick={() => setStatusFilter("all")} style={{ opacity: statusFilter === "all" ? 1 : 0.78 }}>
                All Payments
              </button>
              <button className="register-btn" onClick={() => setStatusFilter("successful")} style={{ opacity: statusFilter === "successful" ? 1 : 0.78 }}>
                Successful Payments
              </button>
              <button className="register-btn" onClick={() => setStatusFilter("failed")} style={{ opacity: statusFilter === "failed" ? 1 : 0.78 }}>
                Failed Payments
              </button>
              <button className="register-btn" onClick={() => setStatusFilter("pending")} style={{ opacity: statusFilter === "pending" ? 1 : 0.78 }}>
                Pending Payments
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "10px 8px" }}>Transaction ID</th>
                    <th style={{ padding: "10px 8px" }}>Amount</th>
                    <th style={{ padding: "10px 8px" }}>Method</th>
                    <th style={{ padding: "10px 8px" }}>Date</th>
                    <th style={{ padding: "10px 8px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((row) => {
                    const status = statusMeta[row.status];
                    return (
                      <tr key={row.id} style={{ borderBottom: "1px solid #eef2ff" }}>
                        <td style={{ padding: "10px 8px", fontWeight: 600 }}>{row.id}</td>
                        <td style={{ padding: "10px 8px" }}>Rs. {row.amount}</td>
                        <td style={{ padding: "10px 8px" }}>{row.method}</td>
                        <td style={{ padding: "10px 8px" }}>{row.date}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: status.color, background: status.bg, padding: "4px 8px", borderRadius: "999px", fontWeight: 600 }}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default RechargePaymentsPage;
