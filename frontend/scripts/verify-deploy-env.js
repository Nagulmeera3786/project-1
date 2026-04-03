/* eslint-disable no-console */

const isTruthy = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const normalize = (value) => String(value || '').trim();

const ensureAuthApiSuffix = (raw) => {
  const value = normalize(raw);
  if (!value) return '';
  const withSlash = value.endsWith('/') ? value : `${value}/`;
  if (/\/api\/auth\/$/i.test(withSlash)) return withSlash;
  if (/\/api\/$/i.test(withSlash)) return `${withSlash}auth/`;
  return `${withSlash}api/auth/`;
};

const nodeEnv = normalize(process.env.NODE_ENV);
const isProductionBuild = nodeEnv === 'production' || nodeEnv === '';

if (!isProductionBuild) {
  process.exit(0);
}

const apiBaseUrl = ensureAuthApiSuffix(process.env.REACT_APP_API_BASE_URL);
const apiUrlAlias = ensureAuthApiSuffix(process.env.REACT_APP_API_URL);
const apiHost = normalize(process.env.REACT_APP_API_HOST);
const sameOrigin = isTruthy(process.env.REACT_APP_USE_SAME_ORIGIN_API);
const allowFallback = isTruthy(process.env.REACT_APP_ALLOW_PRODUCTION_API_FALLBACK);

const hasExplicitApiTarget = Boolean(apiBaseUrl || apiUrlAlias || apiHost || sameOrigin || allowFallback);

if (!hasExplicitApiTarget) {
  console.error('\n[deploy-check] Missing frontend API configuration for production build.');
  console.error('[deploy-check] Set one of the following in Netlify environment variables:');
  console.error('[deploy-check] 1) REACT_APP_API_BASE_URL=https://your-backend-domain/api/auth/');
  console.error('[deploy-check] 2) REACT_APP_API_URL=https://your-backend-domain/api/auth/');
  console.error('[deploy-check] 3) REACT_APP_USE_SAME_ORIGIN_API=true (only when frontend + backend share one domain)');
  console.error('[deploy-check] 4) REACT_APP_API_HOST=api.your-domain.com');
  process.exit(1);
}

if ((apiBaseUrl && !/^https?:\/\//i.test(apiBaseUrl)) || (apiUrlAlias && !/^https?:\/\//i.test(apiUrlAlias))) {
  console.error('\n[deploy-check] API URL must start with http:// or https://');
  process.exit(1);
}

console.log('[deploy-check] Frontend API configuration looks valid for production.');
