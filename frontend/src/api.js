import axios from 'axios';

const normalizeBaseUrl = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

const toAuthApiBaseUrl = (value) => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) {
    return '';
  }

  if (/\/api\/auth\/?$/i.test(normalized)) {
    return normalized;
  }

  if (/\/api\/?$/i.test(normalized)) {
    return `${normalized}auth/`;
  }

  return `${normalized}api/auth/`;
};

const localHostNames = ['localhost', '127.0.0.1', '::1'];
const isLoopbackHost = (host) => localHostNames.includes(String(host || '').toLowerCase());

const adaptLoopbackBaseUrlForBrowserHost = (baseUrl) => {
  if (typeof window === 'undefined' || !baseUrl) {
    return baseUrl;
  }

  const browserHost = String(window.location.hostname || '').trim().toLowerCase();
  if (!browserHost || isLoopbackHost(browserHost)) {
    return baseUrl;
  }

  try {
    const parsed = new URL(baseUrl, window.location.origin);
    if (!isLoopbackHost(parsed.hostname)) {
      return baseUrl;
    }

    parsed.hostname = browserHost;
    return parsed.toString();
  } catch {
    return baseUrl;
  }
};
const runtimeConfigBaseUrl =
  typeof window !== 'undefined'
    ? adaptLoopbackBaseUrlForBrowserHost(toAuthApiBaseUrl(window.__APP_CONFIG__?.apiBaseUrl))
    : '';
const explicitApiUrl = toAuthApiBaseUrl(process.env.REACT_APP_API_URL);
const explicitBaseUrl = adaptLoopbackBaseUrlForBrowserHost(
  toAuthApiBaseUrl(process.env.REACT_APP_API_BASE_URL) || explicitApiUrl
);
const useSameOriginApi = process.env.REACT_APP_USE_SAME_ORIGIN_API === 'true';
const allowProductionApiFallback = process.env.REACT_APP_ALLOW_PRODUCTION_API_FALLBACK === 'true';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const browserProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const isLocalBrowserHost = isLoopbackHost(browserHost);

const apiHost = String(process.env.REACT_APP_API_HOST || '').trim();
const apiPort = String(process.env.REACT_APP_API_PORT || '').trim();
const apiProtocol = String(process.env.REACT_APP_API_PROTOCOL || browserProtocol).trim() || 'http:';
const isProductionBuild = process.env.NODE_ENV === 'production';

const resolvedBaseUrl = (() => {
  if (runtimeConfigBaseUrl) {
    return runtimeConfigBaseUrl;
  }

  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (useSameOriginApi) {
    return '/api/auth/';
  }

  if (apiHost) {
    const portSuffix = apiPort ? `:${apiPort}` : '';
    return toAuthApiBaseUrl(`${apiProtocol}//${apiHost}${portSuffix}`);
  }

  // For local development on any frontend port, default API calls to backend :8000.
  if (typeof window !== 'undefined' && !isProductionBuild && String(window.location.port) !== '8000') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || '127.0.0.1';
    return toAuthApiBaseUrl(`${protocol}//${hostname}:8000`);
  }

  // In production, avoid hard-coding machine-local hosts.
  if (isProductionBuild) {
    return allowProductionApiFallback ? '/api/auth/' : '';
  }

  // Keep localhost default only for local development.
  if (typeof window !== 'undefined' && !isLocalBrowserHost) {
    return toAuthApiBaseUrl(window.location.origin);
  }

  return 'http://127.0.0.1:8000/api/auth/';
})();

const missingApiConfigurationInProduction =
  isProductionBuild &&
  !runtimeConfigBaseUrl &&
  !explicitBaseUrl &&
  !useSameOriginApi &&
  !apiHost &&
  !allowProductionApiFallback;

if (typeof window !== 'undefined' && !isLocalBrowserHost && !runtimeConfigBaseUrl && !explicitBaseUrl && !useSameOriginApi && !apiHost) {
  // eslint-disable-next-line no-console
  console.warn(
    'API base URL is not explicitly configured. Set REACT_APP_API_BASE_URL in deployment for split frontend/backend hosting.'
  );
}

if (typeof window !== 'undefined' && missingApiConfigurationInProduction) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing API config for production build. Set REACT_APP_API_BASE_URL (or REACT_APP_API_URL) to your deployed Django backend, or set REACT_APP_USE_SAME_ORIGIN_API=true when both frontend and backend share one domain.'
  );
}

const API = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 15000,
});

const refreshClient = axios.create({ baseURL: resolvedBaseUrl });

let isRefreshing = false;
let refreshQueue = [];

const flushRefreshQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(token);
  });
  refreshQueue = [];
};

const PUBLIC_ENDPOINTS = [
  'signup/',
  'verify-otp/',
  'login/',
  'forgot-password/',
  'reset-password/',
  'token/refresh/',
];

const normalizeRequestUrl = (url = '') => {
  let cleaned = String(url || '').split('?')[0];

  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      cleaned = new URL(cleaned).pathname;
    }
  } catch {
    // Keep original value if URL parsing fails.
  }

  cleaned = cleaned.replace(/^\/+/, '');
  const marker = 'api/auth/';
  const markerIndex = cleaned.toLowerCase().indexOf(marker);
  if (markerIndex >= 0) {
    cleaned = cleaned.slice(markerIndex + marker.length);
  }

  return cleaned;
};

const isPublicAuthEndpoint = (url = '') => {
  const normalized = normalizeRequestUrl(url);
  return PUBLIC_ENDPOINTS.some((endpoint) => {
    const bareEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    return normalized === endpoint || normalized === bareEndpoint;
  });
};

API.interceptors.request.use(config => {
  if (missingApiConfigurationInProduction) {
    return Promise.reject(
      new Error(
        'Frontend API is not configured for production. Set REACT_APP_API_BASE_URL (or REACT_APP_API_URL) in Netlify environment variables.'
      )
    );
  }

  const reqUrl = config?.url || '';
  const isPublic = isPublicAuthEndpoint(reqUrl);

  if (isPublic) {
    if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  }

  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const responseStatus = error?.response?.status;
    const detail = error?.response?.data?.detail;

    const isTokenInvalid = typeof detail === 'string' && detail.includes('Given token not valid for any token type');
    const isPublicRequest = isPublicAuthEndpoint(originalRequest?.url || '');

    if ((responseStatus === 401 || isTokenInvalid) && !isPublicRequest && !originalRequest._retry) {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('authToken');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return API(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshClient.post('token/refresh/', { refresh });
        const newAccessToken = refreshResponse?.data?.access;
        if (!newAccessToken) {
          throw new Error('Token refresh failed');
        }

        localStorage.setItem('access', newAccessToken);
        localStorage.setItem('authToken', newAccessToken);
        flushRefreshQueue(null, newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        flushRefreshQueue(refreshError, null);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('authToken');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (isTokenInvalid) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export default API;
