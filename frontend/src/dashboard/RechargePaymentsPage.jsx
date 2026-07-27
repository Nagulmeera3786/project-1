import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa";
import API from "../api";

const PAYMENT_METHODS = {
  upi: "upi",
  creditCard: "credit_card",
  debitCard: "debit_card",
  netbanking: "netbanking",
  wallet: "wallet",
};
const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM"];

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

const formatCurrency = (value, currency = "INR") => {
  const parsed = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(parsed) ? parsed : 0);
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector('script[data-razorpay="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const RechargePaymentsPage = () => {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [chargeConfig, setChargeConfig] = useState({
    service_charge_percentage: "0",
    tax_percentage: "0",
    currency: "INR",
    razorpay_key_id: "",
    gateway_configured: false,
  });
  const [enteredAmount, setEnteredAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.upi);
  const [cardForm, setCardForm] = useState({
    number: "",
    holderName: "",
    expiry: "",
    cvv: "",
  });
  const [cardErrors, setCardErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastPaymentSummary, setLastPaymentSummary] = useState(null);
  const activeTab = searchParams.get("tab") || "recharge";

  const fetchProfile = async () => {
    try {
      const response = await API.get("profile/");
      setProfile(response.data || null);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchChargeConfig = async () => {
    try {
      const response = await API.get("wallet/recharge/config/");
      setChargeConfig(response.data || {});
    } catch {
      setChargeConfig({
        service_charge_percentage: "0",
        tax_percentage: "0",
        currency: "INR",
        razorpay_key_id: "",
        gateway_configured: false,
      });
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const response = await API.get("wallet/recharge/payments/");
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchChargeConfig();
    fetchPayments();
  }, []);

  const serviceChargePct = Number(chargeConfig?.service_charge_percentage || 0);
  const taxPct = Number(chargeConfig?.tax_percentage || 0);
  const enteredAmountNumber = Number(enteredAmount || 0);

  const chargeSummary = useMemo(() => {
    const entered = Number.isFinite(enteredAmountNumber) ? Math.max(0, enteredAmountNumber) : 0;
    const serviceCharge = Number(((entered * serviceChargePct) / 100).toFixed(2));
    const tax = Number(((entered * taxPct) / 100).toFixed(2));
    const total = Number((entered + serviceCharge + tax).toFixed(2));
    return {
      entered,
      serviceCharge,
      tax,
      total,
      currency: chargeConfig?.currency || "INR",
    };
  }, [enteredAmountNumber, serviceChargePct, taxPct, chargeConfig]);

  const filteredPayments = useMemo(() => {
    if (statusFilter === "all") {
      return payments;
    }
    return payments.filter((row) => String(row.status || "").toLowerCase() === statusFilter);
  }, [statusFilter, payments]);

  const creditCards = [
    { title: "Wallet Balance", value: profile ? formatNumeric(profile.wallet_balance) : "0", note: "Available credit in your account" },
    { title: "Messages Available", value: profile ? formatNumeric(profile.sms_available_messages) : "0", note: "Messages remaining for current usage" },
    { title: "Messages Used", value: profile ? formatNumeric(profile.sms_used_messages) : "0", note: "Messages consumed from your allocation" },
    { title: "Total Limit", value: profile ? formatNumeric(profile.sms_total_limit) : "0", note: "Total messaging capacity assigned to your profile" },
  ];

  const cleanCardNumber = (value) => String(value || "").replace(/\D+/g, "");

  const isValidCardByLuhn = (cardNumber) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
      let digit = Number(cardNumber[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validateCardForm = () => {
    const nextErrors = {};
    const cardNumber = cleanCardNumber(cardForm.number);
    const holderName = String(cardForm.holderName || "").trim();
    const expiry = String(cardForm.expiry || "").trim();
    const cvv = String(cardForm.cvv || "").trim();

    if (cardNumber.length < 12 || cardNumber.length > 19 || !isValidCardByLuhn(cardNumber)) {
      nextErrors.number = "Please enter a valid card number.";
    }

    if (holderName.length < 3) {
      nextErrors.holderName = "Please enter card holder name.";
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      nextErrors.expiry = "Expiry must be in MM/YY format.";
    } else {
      const [mmText, yyText] = expiry.split("/");
      const mm = Number(mmText);
      const yy = Number(yyText);
      const now = new Date();
      const currentYearYY = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (mm < 1 || mm > 12) {
        nextErrors.expiry = "Invalid expiry month.";
      } else if (yy < currentYearYY || (yy === currentYearYY && mm < currentMonth)) {
        nextErrors.expiry = "Card is expired.";
      }
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      nextErrors.cvv = "CVV must be 3 or 4 digits.";
    }

    setCardErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openRazorpayCheckout = async () => {
    setError("");
    setSuccess("");
    setLastPaymentSummary(null);

    if (!Number.isFinite(chargeSummary.entered) || chargeSummary.entered <= 0) {
      setError("Please enter a valid recharge amount.");
      return;
    }

    if (!chargeConfig?.gateway_configured || !chargeConfig?.razorpay_key_id) {
      setError("Payment gateway is not configured. Ask admin to set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env and restart backend.");
      return;
    }

    setProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setError("Unable to load Razorpay checkout. Please try again.");
        setProcessing(false);
        return;
      }

      const orderResponse = await API.post("wallet/recharge/create-order/", {
        amount: chargeSummary.entered.toFixed(2),
        payment_method: paymentMethod,
      });

      const order = orderResponse?.data?.order;
      if (!order?.id) {
        setError("Unable to create payment order.");
        setProcessing(false);
        return;
      }

      const options = {
        key: chargeConfig.razorpay_key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Bhisha",
        description: "Wallet Recharge",
        order_id: order.id,
        prefill: {
          name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.username || "",
          email: profile?.email || "",
          contact: profile?.phone_number || "",
        },
        notes: {
          wallet_credit_amount: String(chargeSummary.entered.toFixed(2)),
          service_charge_amount: String(chargeSummary.serviceCharge.toFixed(2)),
          tax_amount: String(chargeSummary.tax.toFixed(2)),
          selected_payment_method: paymentMethod,
        },
        handler: async function onPaymentSuccess(response) {
          try {
            const verifyResponse = await API.post("wallet/recharge/verify/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || "",
            });

            const paymentSummary = verifyResponse?.data?.payment || null;
            setLastPaymentSummary(paymentSummary);
            setSuccess("Order Confirmed. Payment successful and wallet credited.");
            await Promise.all([fetchProfile(), fetchPayments()]);
            setEnteredAmount("");
          } catch (verifyError) {
            setError(verifyError?.response?.data?.detail || "Payment verification failed.");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function onDismiss() {
            setProcessing(false);
          },
        },
        theme: {
          color: "#5B3FA8",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function onPaymentFailed(failedResponse) {
        setError(
          failedResponse?.error?.description ||
            failedResponse?.error?.reason ||
            "Payment failed. Please try again."
        );
        setProcessing(false);
      });
      razorpay.open();
    } catch (checkoutError) {
      const detail = checkoutError?.response?.data?.detail || "Unable to start payment.";
      const gatewayError = checkoutError?.response?.data?.gateway_error;
      setError(gatewayError ? `${detail} (${gatewayError})` : detail);
      setProcessing(false);
    }
  };

  const handleProceedPayment = async () => {
    setError("");
    setSuccess("");

    if (!Number.isFinite(chargeSummary.entered) || chargeSummary.entered <= 0) {
      setError("Please enter a valid recharge amount.");
      return;
    }

    if (paymentMethod === PAYMENT_METHODS.creditCard || paymentMethod === PAYMENT_METHODS.debitCard) {
      const validCard = validateCardForm();
      if (!validCard) {
        return;
      }
      await openRazorpayCheckout();
      return;
    }

    await openRazorpayCheckout();
  };

  return (
    <div className="dashboard-shell">
      <h2 className="welcome-text" style={{ marginTop: 0 }}>
        Utilities - {tabTitleMap[activeTab] || "Recharge Account"}
      </h2>

      <div style={{ display: "grid", gap: "18px" }}>
        {activeTab === "credit-details" && (
          <section className="performance-section dashboard-fade-in" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Credit Details</h3>
            {loadingProfile ? (
              <div style={{ color: "#475569", fontSize: "14px" }}>Loading credit details...</div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                    gap: "12px",
                    marginTop: "10px",
                  }}
                >
                  {creditCards.map((card) => (
                    <div
                      key={card.title}
                      style={{ border: "1px solid #d8cef4", borderRadius: "12px", padding: "14px", background: "#ffffff" }}
                    >
                      <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{card.title}</div>
                      <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700, color: "#2d1b69" }}>{card.value}</div>
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#475569" }}>{card.note}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "recharge" && (
          <section className="performance-section dashboard-fade-in" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Recharge Payment</h3>
            <p style={{ marginTop: "6px", color: "#475569", fontSize: "14px" }}>
              Choose your preferred payment method and complete recharge. Razorpay will show all available gateway options and required verification steps (OTP/UPI PIN/bank auth).
            </p>

            <div style={{ display: "grid", gap: "14px", maxWidth: "560px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>Recharge Amount</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={enteredAmount}
                  onChange={(event) => setEnteredAmount(event.target.value)}
                  placeholder="Enter amount"
                  style={{ padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <div style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>Payment Method</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { key: PAYMENT_METHODS.upi, label: "UPI" },
                    { key: PAYMENT_METHODS.creditCard, label: "Credit Card" },
                    { key: PAYMENT_METHODS.debitCard, label: "Debit Card" },
                    { key: PAYMENT_METHODS.netbanking, label: "Net Banking" },
                    { key: PAYMENT_METHODS.wallet, label: "Wallet" },
                  ].map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key)}
                      style={{
                        border: paymentMethod === method.key ? "2px solid #5B3FA8" : "1px solid #d1d5db",
                        background: paymentMethod === method.key ? "#f3e8ff" : "#ffffff",
                        color: "#1f2937",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {(paymentMethod === PAYMENT_METHODS.creditCard || paymentMethod === PAYMENT_METHODS.debitCard) && (
                <div style={{ border: "1px solid #d1d5db", borderRadius: "12px", padding: "14px", background: "#ffffff", display: "grid", gap: "10px" }}>
                  <div style={{ fontWeight: 700, color: "#111827" }}>Enter Card Details</div>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#374151" }}>Card Number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardForm.number}
                      onChange={(event) => {
                        const value = event.target.value.replace(/[^\d\s-]/g, "");
                        setCardForm((previous) => ({ ...previous, number: value }));
                      }}
                      placeholder="1234 5678 9012 3456"
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    {cardErrors.number && <span style={{ color: "#b91c1c", fontSize: "12px" }}>{cardErrors.number}</span>}
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#374151" }}>Card Holder Name</span>
                    <input
                      type="text"
                      value={cardForm.holderName}
                      onChange={(event) => setCardForm((previous) => ({ ...previous, holderName: event.target.value }))}
                      placeholder="Name on card"
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    {cardErrors.holderName && <span style={{ color: "#b91c1c", fontSize: "12px" }}>{cardErrors.holderName}</span>}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "13px", color: "#374151" }}>Expiry (MM/YY)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={cardForm.expiry}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/\D/g, "").slice(0, 4);
                          const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
                          setCardForm((previous) => ({ ...previous, expiry: formatted }));
                        }}
                        placeholder="MM/YY"
                        style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                      {cardErrors.expiry && <span style={{ color: "#b91c1c", fontSize: "12px" }}>{cardErrors.expiry}</span>}
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "13px", color: "#374151" }}>CVV</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={cardForm.cvv}
                        onChange={(event) => {
                          const cvv = event.target.value.replace(/\D/g, "").slice(0, 4);
                          setCardForm((previous) => ({ ...previous, cvv }));
                        }}
                        placeholder="***"
                        style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                      {cardErrors.cvv && <span style={{ color: "#b91c1c", fontSize: "12px" }}>{cardErrors.cvv}</span>}
                    </label>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Card details are validated locally. Final secure card entry continues in gateway checkout.
                  </div>
                </div>
              )}

              {paymentMethod === PAYMENT_METHODS.upi && (
                <div style={{ border: "1px solid #d1d5db", borderRadius: "12px", padding: "14px", background: "#ffffff" }}>
                  <div style={{ fontWeight: 700, color: "#111827", marginBottom: "6px" }}>UPI Apps</div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>
                    Popular UPI apps: {UPI_APPS.join(", ")}. Continue to checkout and approve with your UPI PIN.
                  </div>
                </div>
              )}

              {(paymentMethod === PAYMENT_METHODS.netbanking || paymentMethod === PAYMENT_METHODS.wallet) && (
                <div style={{ border: "1px solid #d1d5db", borderRadius: "12px", padding: "14px", background: "#ffffff" }}>
                  <div style={{ fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                    {paymentMethod === PAYMENT_METHODS.netbanking ? "Net Banking" : "Wallet"}
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>
                    Click Place Order to open Razorpay checkout. Your selected method is preferred, and other gateway options are available if needed.
                  </div>
                </div>
              )}

              <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", background: "#f9fafb" }}>
                <div style={{ fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Final Charge Summary</div>
                <div style={{ display: "grid", gap: "6px", fontSize: "14px", color: "#374151" }}>
                  <div>Entered Amount: <strong>{formatCurrency(chargeSummary.entered, chargeSummary.currency)}</strong></div>
                  <div>
                    Service Charge ({formatNumeric(serviceChargePct)}%): <strong>{formatCurrency(chargeSummary.serviceCharge, chargeSummary.currency)}</strong>
                  </div>
                  <div>
                    Tax ({formatNumeric(taxPct)}%): <strong>{formatCurrency(chargeSummary.tax, chargeSummary.currency)}</strong>
                  </div>
                  <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: "8px" }}>
                    Total Payable: <strong>{formatCurrency(chargeSummary.total, chargeSummary.currency)}</strong>
                  </div>
                  <div style={{ color: "#6b7280" }}>
                    Wallet Credit on success: <strong>{formatCurrency(chargeSummary.entered, chargeSummary.currency)}</strong>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#fee2e2", color: "#b91c1c" }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#dcfce7", color: "#166534" }}>
                  {success}
                </div>
              )}

              {lastPaymentSummary && (
                <div style={{ border: "1px solid #d1fae5", borderRadius: "12px", padding: "14px", background: "#ecfdf5" }}>
                  <div style={{ fontWeight: 700, color: "#065f46", marginBottom: "6px" }}>Last Payment Completed</div>
                  <div style={{ fontSize: "14px", color: "#065f46" }}>
                    Added: {formatCurrency(lastPaymentSummary.entered_amount, lastPaymentSummary.currency)} | Service: {formatCurrency(lastPaymentSummary.service_charge_amount, lastPaymentSummary.currency)} | Tax: {formatCurrency(lastPaymentSummary.tax_amount, lastPaymentSummary.currency)}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={processing}
                className="register-btn"
                style={{ width: "fit-content", opacity: processing ? 0.7 : 1 }}
              >
                {processing
                  ? "Processing..."
                  : "Place Order"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "payment-details" && (
          <section className="performance-section dashboard-fade-in dashboard-delay-1" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Your Payment History</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <button className="register-btn" onClick={() => setStatusFilter("all")} style={{ opacity: statusFilter === "all" ? 1 : 0.78 }}>
                All Payments
              </button>
              <button className="register-btn" onClick={() => setStatusFilter("successful")} style={{ opacity: statusFilter === "successful" ? 1 : 0.78 }}>
                Successful
              </button>
              <button className="register-btn" onClick={() => setStatusFilter("failed")} style={{ opacity: statusFilter === "failed" ? 1 : 0.78 }}>
                Failed
              </button>
              <button className="register-btn" onClick={() => setStatusFilter("pending")} style={{ opacity: statusFilter === "pending" ? 1 : 0.78 }}>
                Pending
              </button>
            </div>

            {loadingPayments ? (
              <div style={{ color: "#475569" }}>Loading payments...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 8px" }}>Order ID</th>
                      <th style={{ padding: "10px 8px" }}>Entered Amount</th>
                      <th style={{ padding: "10px 8px" }}>Service Charge</th>
                      <th style={{ padding: "10px 8px" }}>Tax</th>
                      <th style={{ padding: "10px 8px" }}>Total</th>
                      <th style={{ padding: "10px 8px" }}>Status</th>
                      <th style={{ padding: "10px 8px" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((row) => {
                      const statusKey = String(row.status || "pending").toLowerCase();
                      const status = statusMeta[statusKey] || statusMeta.pending;
                      return (
                        <tr key={row.id} style={{ borderBottom: "1px solid #eef2ff" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 600 }}>{row.razorpay_order_id}</td>
                          <td style={{ padding: "10px 8px" }}>{formatCurrency(row.entered_amount, row.currency)}</td>
                          <td style={{ padding: "10px 8px" }}>{formatCurrency(row.service_charge_amount, row.currency)}</td>
                          <td style={{ padding: "10px 8px" }}>{formatCurrency(row.tax_amount, row.currency)}</td>
                          <td style={{ padding: "10px 8px" }}>{formatCurrency(row.total_amount, row.currency)}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                color: status.color,
                                background: status.bg,
                                padding: "4px 8px",
                                borderRadius: "999px",
                                fontWeight: 600,
                              }}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px" }}>{new Date(row.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {!filteredPayments.length && (
                      <tr>
                        <td colSpan={7} style={{ padding: "12px 8px", color: "#6b7280" }}>
                          No payment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default RechargePaymentsPage;
