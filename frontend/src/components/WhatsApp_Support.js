import React from "react";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaWhatsapp,
  FaGlobe,
  FaClock,
} from "react-icons/fa";

const contactCards = [
  {
    title: "Email Support",
    detail: "info@bhisha.com",
    note: "Best for account, billing, and technical issues.",
    icon: <FaEnvelope />,
    actionLabel: "Send Email",
    action: () => window.open("mailto:info@bhisha.com", "_self"),
  },
  {
    title: "Phone Support",
    detail: "+91 9666666666",
    note: "Priority voice support for urgent service concerns.",
    icon: <FaPhoneAlt />,
    actionLabel: "Call Now",
    action: () => window.open("tel:+919666666666", "_self"),
  },
  {
    title: "WhatsApp Support",
    detail: "+91 9666666666",
    note: "Quick assistance for follow-ups and status updates.",
    icon: <FaWhatsapp />,
    actionLabel: "Open WhatsApp",
    action: () =>
      window.open(
        "https://wa.me/919666666666",
        "_blank",
        "noopener,noreferrer"
      ),
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
    <>
      <style>
        {`
          .support-page {
            min-height: 100vh;
            padding: 30px 34px;
            background: #f6f8fc;
            box-sizing: border-box;
          }

          .support-header {
            margin-bottom: 24px;
          }

          .support-title {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: #26324a;
            letter-spacing: -0.3px;
          }

          .support-subtitle {
            margin: 8px 0 0;
            color: #718096;
            font-size: 14px;
          }

          .support-container {
            background: #ffffff;
            border: 1px solid #e5eaf2;
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 6px 20px rgba(56, 72, 100, 0.06);
          }

          .support-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 18px;
          }

          .support-card {
            background: #ffffff;
            border: 1px solid #e4e9f2;
            border-radius: 15px;
            padding: 20px;
            min-height: 205px;
            display: flex;
            flex-direction: column;
            transition: all 0.25s ease;
            box-sizing: border-box;
          }

          .support-card:hover {
            transform: translateY(-3px);
            border-color: #cfd7ee;
            box-shadow: 0 10px 24px rgba(56, 72, 100, 0.09);
          }

          .support-card-top {
            display: flex;
            align-items: center;
            gap: 11px;
            margin-bottom: 15px;
          }

          .support-icon {
            width: 40px;
            height: 40px;
            border-radius: 11px;
            background: #eef1fb;
            color: #6674c8;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
            flex-shrink: 0;
          }

          .support-card-title {
            font-size: 15px;
            font-weight: 700;
            color: #334155;
          }

          .support-detail {
            font-size: 16px;
            font-weight: 650;
            color: #1f2937;
            margin-bottom: 8px;
          }

          .support-note {
            margin: 0;
            color: #788398;
            font-size: 13px;
            line-height: 1.6;
            flex: 1;
          }

          .support-button {
            width: 100%;
            margin-top: 17px;
            border: none;
            border-radius: 9px;
            padding: 10px 14px;
            background: #6876c9;
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .support-button:hover {
            background: #5867bd;
            transform: translateY(-1px);
          }

          .support-hours {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            margin-top: 17px;
            padding: 9px 13px;
            border-radius: 9px;
            background: #f1f4fb;
            color: #5e6980;
            font-size: 13px;
            font-weight: 600;
          }

          .support-hours svg {
            color: #6876c9;
          }

          @media (max-width: 768px) {
            .support-page {
              padding: 22px 18px;
            }

            .support-container {
              padding: 17px;
            }

            .support-title {
              font-size: 24px;
            }

            .support-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="support-page">
        <div className="support-header">
          <h2 className="support-title">Contact Support</h2>
          <p className="support-subtitle">
            Reach the support team through your preferred channel.
          </p>
        </div>

        <div className="support-container">
          <div className="support-grid">
            {contactCards.map((card) => (
              <div className="support-card" key={card.title}>
                <div className="support-card-top">
                  <div className="support-icon">{card.icon}</div>
                  <div className="support-card-title">{card.title}</div>
                </div>

                <div className="support-detail">{card.detail}</div>

                <p className="support-note">{card.note}</p>

                {card.action ? (
                  <button
                    className="support-button"
                    onClick={card.action}
                  >
                    {card.actionLabel}
                  </button>
                ) : (
                  <div className="support-hours">
                    <FaClock />
                    <span>Always available</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSupportPage;
