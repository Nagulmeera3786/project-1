const statusReasonMap = {
  400: 'Bad request. Please check the entered values.',
  401: 'Unauthorized. Please check credentials or login again.',
  403: 'Forbidden. Access is blocked for this request.',
  404: 'API endpoint not found. Verify frontend API base URL.',
  405: 'Method not allowed by API endpoint.',
  408: 'Request timed out. Try again.',
  429: 'Too many requests. Please wait and retry.',
  500: 'Server error on backend. Check backend server logs.',
  502: 'Bad gateway between services. Retry in a moment.',
  503: 'Service temporarily unavailable. Retry shortly.',
  504: 'Gateway timeout. Backend took too long to respond.',
};

const genericBusyMessage = 'Server is busy, please try again later.';
const genericConnectivityMessage = 'We are having trouble completing your request right now. Please try again shortly.';

export const buildOtpDiagnostics = (data) => {
  // Never expose backend/provider diagnostic internals to end users.
  return null;
};

export const parseApiError = (err, fallbackMessage) => {
  const fallback = fallbackMessage || genericBusyMessage;
  const response = err?.response;
  const data = response?.data;
  const errorMessage = String(err?.message || '').trim();

  if (!response && /Frontend API is not configured for production/i.test(errorMessage)) {
    return {
      message: genericBusyMessage,
      diagnostics: null,
      isBuffering: false,
    };
  }

  if (!response) {
    return {
      message: genericConnectivityMessage,
      diagnostics: null,
      isBuffering: true,
      showMessageAfterMs: 3000,
    };
  }

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return {
      message: data.detail.trim(),
      diagnostics: buildOtpDiagnostics(data),
      isBuffering: false,
    };
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const pairs = Object.entries(data)
      .map(([field, value]) => {
        if (field === 'detail') {
          return null;
        }
        if (Array.isArray(value)) {
          return `${field}: ${value.join(', ')}`;
        }
        if (value && typeof value === 'object') {
          return `${field}: ${JSON.stringify(value)}`;
        }
        return `${field}: ${String(value)}`;
      })
      .filter(Boolean);

    if (pairs.length > 0) {
      return {
        message: pairs.join(' | '),
        diagnostics: buildOtpDiagnostics(data),
        isBuffering: false,
      };
    }
  }

  const status = response?.status;
  const shouldMaskServerAvailability = [502, 503, 504].includes(Number(status));
  const reason = shouldMaskServerAvailability ? genericBusyMessage : (statusReasonMap[status] || fallback);
  return {
    message: shouldMaskServerAvailability ? '' : reason,
    diagnostics: shouldMaskServerAvailability ? null : buildOtpDiagnostics(data),
    isBuffering: shouldMaskServerAvailability,
    showMessageAfterMs: shouldMaskServerAvailability ? 3000 : 0,
  };
};

export const getProfessionalErrorMessage = (err, fallbackMessage) => {
  return parseApiError(err, fallbackMessage).message;
};
