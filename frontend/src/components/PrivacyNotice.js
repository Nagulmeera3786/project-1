import React from 'react';
import LegalDocumentPage from './LegalDocumentPage';

export default function PrivacyNotice() {
  return (
    <LegalDocumentPage
      title="Privacy Notice"
      subtitle="Official Bhisha privacy notice document."
      pdfPath="/legal/bhisha-privacy-notice.pdf"
    />
  );
}
