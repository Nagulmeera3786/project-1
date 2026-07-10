import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaChartLine,
  FaCheckCircle,
  FaEnvelope,
  FaFacebookF,
  FaHeadset,
  FaInstagram,
  FaPaperPlane,
  FaLinkedinIn,
  FaYoutube,
  FaShieldAlt,
  FaSms,
  FaWhatsapp,
} from 'react-icons/fa';

const services = [
  {
    icon: <FaSms />,
    title: 'Bulk SMS campaigns',
    description: 'Send transactional and promotional SMS at scale with clear delivery-focused workflows.',
  },
  {
    icon: <FaShieldAlt />,
    title: 'OTP and verification',
    description: 'Secure sign-up and login journeys with fast OTP delivery and account verification.',
  },
  {
    icon: <FaWhatsapp />,
    title: 'WhatsApp messaging',
    description: 'Reach customers on WhatsApp for alerts, follow-ups, reminders, and conversational support.',
  },
  {
    icon: <FaEnvelope />,
    title: 'Email validation',
    description: 'Keep your contact lists clean and improve campaign quality with email validation tools.',
  },
  {
    icon: <FaChartLine />,
    title: 'Tracking and reporting',
    description: 'Monitor message performance, campaign activity, and operational trends from one place.',
  },
  {
    icon: <FaHeadset />,
    title: 'Campaign orchestration',
    description: 'Coordinate journeys, routing, and channel activity from a single control layer.',
  },
];

const highlights = [
  'Fast onboarding for communication teams',
  'Single dashboard for messaging and customer journeys',
  'Built for operations, growth, and delivery scale',
];

const capabilityRows = [
  {
    title: 'Messaging',
    items: ['SMS campaigns', 'WhatsApp alerts', 'Notifications'],
  },
  {
    title: 'Security',
    items: ['OTP verification', 'Login protection', 'Account checks'],
  },
  {
    title: 'Data quality',
    items: ['Email validation', 'List hygiene', 'Quality checks'],
  },
  {
    title: 'Insight',
    items: ['Tracking', 'Reporting', 'Delivery visibility'],
  },
];

const solutionsBoards = [
  {
    title: 'Business Segments',
    items: [
      { heading: 'B2B platforms', text: 'Enable client communication traffic at scale with shared campaign operations.' },
      { heading: 'Digital natives', text: 'Launch product messaging quickly with SMS, OTP, and validation APIs.' },
      { heading: 'Enterprise', text: 'Coordinate global communication workflows across multiple teams.' },
      { heading: 'Wholesale', text: 'Expand high-volume messaging channels for partner-driven businesses.' },
    ],
  },
  {
    title: 'Industry Verticals',
    items: [
      { heading: 'Finance', text: 'Secure OTP and transactional messaging for regulated interactions.' },
      { heading: 'Retail and eCommerce', text: 'Improve conversion with timely alerts and journey messaging.' },
      { heading: 'Telecoms', text: 'Manage high-throughput customer journey communication.' },
      { heading: 'Healthcare', text: 'Deliver appointment and patient notifications with verified contacts.' },
      { heading: 'Transportation', text: 'Keep customers updated with dispatch, route, and delay notifications.' },
      { heading: 'Government', text: 'Support citizen communication with dependable multi-channel delivery.' },
    ],
  },
  {
    title: 'Departments',
    items: [
      { heading: 'Marketing', text: 'Run omnichannel campaign automation and engagement journeys.' },
      { heading: 'Sales', text: 'Automate lead and follow-up notifications from one dashboard.' },
      { heading: 'Customer service', text: 'Provide channel-ready support messaging with tracking visibility.' },
    ],
  },
  {
    title: 'Our Services',
    items: [
      { heading: 'Now: SMS and OTP', text: 'Production-ready messaging and verification workflows.' },
      { heading: 'Now: Email validation', text: 'Use Verifalia-backed checks to keep customer data clean.' },
      { heading: 'Next: Omnichannel orchestration', text: 'Grow into WhatsApp and journey-led automation modules.' },
    ],
  },
];

const footerColumns = [
  {
    title: 'Business',
    items: ['SMS Messaging', 'OTP Verification', 'WhatsApp Messaging', 'Email Validation', 'Tracking'],
  },
  {
    title: 'Solutions',
    items: ['Customer journeys', 'Notifications', 'Campaign automation', 'Reporting', 'Integrations'],
  },
  {
    title: 'Company',
    items: ['About Bhisha', 'Pricing', 'API Docs', 'Login', 'Try for free'],
  },
  {
    title: 'Support',
    items: ['Support center', 'Contact us', 'Service status', 'External connectivity status', 'Startups'],
  },
];

const associationPartners = [
  { name: 'Infobip', logo: '/logos/infobip-logo.svg' },
  { name: 'Broadnet', logo: '/logos/broadnet-logo.webp' },
  { name: 'SMS Country', logo: '/logos/sms-country-logo.png' },
  { name: 'Telebu', logo: '/logos/telebu-logo.png' },
  { name: 'Bankainet', logo: '/logos/bankai-logo.jfif' },
];

const clientPartners = [
  {
    name: 'Partha Dental',
    logo: '/logos/partha-logo.webp',
  },
  {
    name: 'ICAI SIRC Branch',
    logo: '/logos/icai-logo.png',
  },
  {
    name: 'Lalitha Jewellery',
    logo: '/logos/lalitha-logo.svg',
  },
];

const footerLinkTo = (item) => {
  if (item === 'Contact us' || item === 'Support center' || item === 'Service status' || item === 'External connectivity status') {
    return '/contact-support';
  }

  if (item === 'API Docs') {
    return '/api-docs';
  }

  if (item === 'Login') {
    return '/login';
  }

  if (item === 'Try for free' || item === 'Pricing') {
    return '/signup';
  }

  return '/#services';
};

export default function MainPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero" id="home">
        <div className="landing-hero-copy">
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Bhisha communications platform
          </div>

          <h1 className="landing-title">
            A polished messaging platform built for fast customer communication.
          </h1>

          <p className="landing-subtitle">
            Bhisha helps teams deliver SMS, OTP, WhatsApp, email validation, notifications, and campaign orchestration from one clear dashboard.
            The experience is designed to feel enterprise-ready, easy to trust, and easy to use.
          </p>

          <div className="landing-actions">
            <Link to="/signup" className="landing-primary-action">
              Get started
              <FaArrowRight />
            </Link>
            <a href="#services" className="landing-secondary-action">
              Explore services
            </a>
            <Link to="/api-docs" className="landing-secondary-action landing-secondary-action-quiet">
              View APIs
            </Link>
          </div>

          <div className="landing-highlights">
            {highlights.map((item) => (
              <div key={item} className="landing-highlight-chip">
                <FaCheckCircle />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero-panel" aria-label="Bhisha platform overview">
          <div className="landing-panel-topline">One platform for growth and operations</div>
          <div className="landing-panel-card landing-panel-card-primary">
            <span className="landing-panel-label">Core capability</span>
            <strong>Send, verify, engage, and manage customer communication in one workflow.</strong>
            <p>
              From first verification to ongoing notifications, Bhisha gives your team a clean operating layer for communication.
            </p>
          </div>
          <div className="landing-panel-grid">
            <div className="landing-panel-card">
              <FaPaperPlane />
              <strong>Delivery focused</strong>
              <span>Run dependable SMS and WhatsApp communication.</span>
            </div>
            <div className="landing-panel-card">
              <FaShieldAlt />
              <strong>Secure flows</strong>
              <span>Support OTP and verification journeys with confidence.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-capability-section">
        <div className="landing-capability-grid">
          {capabilityRows.map((capability) => (
            <article key={capability.title} className="landing-capability-card">
              <span className="landing-section-kicker">{capability.title}</span>
              <ul>
                {capability.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-solutions-board" id="solutions">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">Solutions</span>
          <h2>Where you can use Bhisha now and in the future</h2>
          <p>
            This view maps the most relevant business segments, departments, and service directions for the Bhisha application.
          </p>
        </div>

        <div className="landing-solutions-grid">
          {solutionsBoards.map((board) => (
            <article key={board.title} className="landing-solutions-column">
              <span className="landing-solutions-pill">{board.title}</span>
              <div className="landing-solutions-list">
                {board.items.map((item) => (
                  <div key={`${board.title}-${item.heading}`} className="landing-solutions-item">
                    <strong>{item.heading}</strong>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="services">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">Services</span>
          <h2>What Bhisha does</h2>
          <p>
            The landing page should make it clear what the platform offers, so this section highlights the actual services available in Bhisha.
          </p>
        </div>

        <div className="landing-service-grid">
          {services.map((service) => (
            <article key={service.title} className="landing-service-card">
              <div className="landing-service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-split" id="why">
        <div className="landing-section-heading landing-section-heading-compact">
          <span className="landing-section-kicker">Why Bhisha</span>
          <h2>A cleaner story for teams that need to communicate at scale</h2>
          <p>
            Bhisha is positioned as a practical communications platform for marketing, operations, and customer-facing teams.
          </p>
        </div>

        <div className="landing-value-grid">
          <div className="landing-value-card">
            <strong>Unified operations</strong>
            <p>Manage messaging, verification, notifications, and analytics without switching tools.</p>
          </div>
          <div className="landing-value-card">
            <strong>Professional presentation</strong>
            <p>A modern layout, clean visual hierarchy, and stronger service messaging improve the first impression.</p>
          </div>
          <div className="landing-value-card">
            <strong>Built for scale</strong>
            <p>Designed for teams that need reliable customer communication and predictable delivery.</p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-trust-section" id="associations">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">Trust Network</span>
          <h2>our associations with</h2>
          <p>
            Bhisha works with established ecosystem partners for messaging and communication infrastructure.
          </p>
        </div>

        <div className="landing-logo-grid landing-logo-grid-associations">
          {associationPartners.map((partner) => (
            <article key={partner.name} className="landing-logo-card" aria-label={partner.name}>
              <img src={partner.logo} alt={partner.name} loading="lazy" />
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-trust-section" id="clients">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">Client Proof</span>
          <h2>our clients</h2>
          <p>
            Trusted by organizations across healthcare, finance, and enterprise communication operations.
          </p>
        </div>

        <div className="landing-logo-grid landing-logo-grid-clients">
          {clientPartners.map((client) => (
            <article key={client.name} className="landing-logo-card" aria-label={client.name}>
              <img src={client.logo} alt={client.name} loading="lazy" />
            </article>
          ))}
        </div>
      </section>

      <section className="landing-footer-cta">
        <div>
          <span className="landing-section-kicker">Ready to start</span>
          <h2>Bring Bhisha to your communication workflow</h2>
          <p>
            Bhisha now presents a clearer enterprise-style story with services, capabilities, and product value similar to the reference layout.
          </p>
        </div>
        <div className="landing-actions landing-actions-footer">
          <Link to="/signup" className="landing-primary-action">
            Create account
            <FaArrowRight />
          </Link>
          <Link to="/login" className="landing-secondary-action landing-secondary-action-light">
            Sign in
          </Link>
        </div>
      </section>

      <section className="landing-footer-options">
        <div className="landing-footer-options-brand">
          <img src="/bhisha-logo.svg" alt="Bhisha" className="landing-footer-brand-logo" />
          <div>
            <strong>Bhisha</strong>
            <p>Communication services, platform tools, and support access in one place.</p>
          </div>
        </div>

        <div className="landing-footer-columns">
          {footerColumns.map((column) => (
            <div key={column.title} className="landing-footer-column">
              <h3>{column.title}</h3>
              <div className="landing-footer-links">
                {column.items.map((item) => (
                  <Link key={item} to={footerLinkTo(item)} className="landing-footer-link-btn">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-bottom-bar">
        <div className="landing-bottom-copy">Copyright © 2020-2026 Bhisha Ltd.</div>
        <div className="landing-bottom-links">
          <a href="/" className="landing-bottom-link">Terms & Conditions</a>
          <a href="/" className="landing-bottom-link">Privacy Notice</a>
          <a href="/" className="landing-bottom-link">Terms of Use</a>
        </div>
      </section>
    </div>
  );
}

