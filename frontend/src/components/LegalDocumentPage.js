import React from 'react';

export default function LegalDocumentPage({ title, subtitle, pdfPath }) {
  const readOnlyPdfPath = `${pdfPath}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

  return (
    <div className="terms-page-shell">
      <div className="terms-page-card" style={{ maxWidth: '1200px' }}>
        <h1>{title}</h1>
        <p className="terms-page-subtitle">{subtitle}</p>

        <iframe
          title={title}
          src={readOnlyPdfPath}
          style={{
            width: '100%',
            minHeight: '70vh',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            background: '#fff',
          }}
        />
      </div>
    </div>
  );
}
