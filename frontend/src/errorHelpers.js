const statusReasonMap = {
  400: 'Bad request. Please check the entered values.',
  401: 'Unauthorized. Please check credentials or login again.',
  403: 'Forbidden. Access is blocked for this request.',
  404: 'API endpoint not found. Verify frontend API base URL.',
  405: 'Method not allowed by API endpoint.',
  408: 'Request timed out. Try again.',
  429: 'Too many requests. Please wait and retry.',
  500: 'Server error on backend. Check Render logs.',
  502: 'Bad gateway between services. Retry in a moment.',
  503: 'Service temporarily unavailable. Retry shortly.',
  504: 'Gateway timeout. Backend took too long to respond.',
};

export const buildOtpDiagnostics = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const diagnostics = {
    errorCode: data?.error_code || null,
    provider: data?.email_delivery?.provider || null,
    host: data?.email_delivery?.host || null,
    backend: data?.email_delivery?.backend || null,
    nextStep: data?.next_step || null,
    otpGenerated: data?.otp_generated,
  };

  const hasAny = Object.values(diagnostics).some((value) => value !== null && value !== undefined && value !== '');
  return hasAny ? diagnostics : null;
};

export const parseApiError = (err, fallbackMessage) => {
  const fallback = fallbackMessage || 'Request failed. Please try again.';
  const response = err?.response;
  const data = response?.data;

  if (!response) {
    return {
      message: 'Network/CORS error. Backend is unreachable from browser.',
      diagnostics: {
        errorCode: 'NETWORK_OR_CORS_ERROR',
        nextStep: 'Check Render service status and CORS/CSRF settings for your Netlify domain.',
      },
    };
  }

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return {
      message: data.detail.trim(),
      diagnostics: buildOtpDiagnostics(data),
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
      };
    }
  }

  const status = response?.status;
  const reason = statusReasonMap[status] || fallback;
  return {
    message: `HTTP ${status}: ${reason}`,
    diagnostics: buildOtpDiagnostics(data),
  };
};
