import React from "react";
import { FaEnvelope, FaPhoneAlt, FaWhatsapp, FaGlobe, FaClock } from "react-icons/fa";

const contactCards = [
  {
    title: "Email Support",
    detail: "support@abccompany.com",
    note: "Best for account, billing, and technical issues.",
    icon: <FaEnvelope />,
    actionLabel: "Send Email",
    action: () => window.open("mailto:support@abccompany.com", "_self"),
  },
  {
    title: "Phone Support",
    detail: "+91 90000 00000",
    note: "Priority voice support for urgent service concerns.",
    icon: <FaPhoneAlt />,
    actionLabel: "Call Now",
    action: () => window.open("tel:+919000000000", "_self"),
  },
  {
    title: "WhatsApp Support",
    detail: "+91 90000 00000",
    note: "Quick assistance for follow-ups and status updates.",
    icon: <FaWhatsapp />,
    actionLabel: "Open WhatsApp",
    action: () => window.open("https://wa.me/919000000000", "_blank", "noopener,noreferrer"),
  },
  {
    title: "Global Availability",
    detail: "24/7 Worldwide Coverage",
    note: "Regional teams available across major time zones.",
    icon: <FaGlobe />,
    actionLabel: "View Service Hours",
    action: null,
  },
];

const ContactSupportPage = () => {
  return (
    <div className="dashboard-shell">
      <h2 className="welcome-text" style={{ marginTop: 0 }}>Contact Support</h2>
      <p style={{ color: "#475569", marginTop: "-8px", marginBottom: "16px" }}>
        Reach the support team through your preferred channel.
      </p>

      <div className="performance-section dashboard-fade-in" style={{ padding: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {contactCards.map((card) => (
            <div key={card.title} style={{ border: "1px solid #d8cef4", borderRadius: "12px", padding: "14px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5b3fa8", fontWeight: 700 }}>
                <span>{card.icon}</span>
                <span>{card.title}</span>
              </div>
              <div style={{ marginTop: "8px", fontWeight: 600, color: "#0f172a" }}>{card.detail}</div>
              <p style={{ margin: "8px 0 12px", fontSize: "13px", color: "#475569" }}>{card.note}</p>
              {card.action ? (
                <button className="register-btn" onClick={card.action}>{card.actionLabel}</button>
              ) : (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#334155", fontSize: "13px" }}>
                  <FaClock />
                  <span>Always available</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactSupportPage;
