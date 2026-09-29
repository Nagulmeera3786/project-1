import React from 'react';

export default function LegalDocumentPage({ title, subtitle, children }) {
  return (
    <div className="terms-page-shell">
      <div
        className="terms-page-card"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '30px',
        }}
      >
        <h1>{title}</h1>

        <p className="terms-page-subtitle">
          {subtitle}
        </p>

        <div className="terms-document-content">
          {children}
        </div>
      </div>
    </div>
  );
}