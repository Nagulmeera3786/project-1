import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBookOpen, FaCode, FaKey, FaServer } from 'react-icons/fa';

const BASE_URL = 'https://bhisha.com';
const API_PREFIX = '/api/auth';
const SMS_SEND_PATH = '/sms/send/';
const MAIL_VALIDATE_PATH = '/email-validation/api/validate/';
const MAIL_STATUS_PATH = '/email-validation/api/status/';
const MAIL_CONTROL_PATH = '/email-validation/api/control/';

const codeSamples = {
  cURL: `curl -X POST ${BASE_URL}${API_PREFIX}${SMS_SEND_PATH} \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "display_sender_id": "BHISHA",
    "message_content": "Hello from Bhisha",
    "recipient_number": "+91XXXXXXXXXX"
  }'`,
  JavaScript: `const baseUrl = "${BASE_URL}";
const response = await fetch(baseUrl + "${API_PREFIX}${SMS_SEND_PATH}", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + accessToken,
  },
  body: JSON.stringify({
    display_sender_id: 'BHISHA',
    message_content: 'Hello from Bhisha',
    recipient_number: '+91XXXXXXXXXX',
  }),
});

const data = await response.json();`,
  Python: `import requests

base_url = "${BASE_URL}"
response = requests.post(
    base_url + "${API_PREFIX}${SMS_SEND_PATH}",
    headers={'Authorization': f'Bearer {access_token}'},
    json={
        'display_sender_id': 'BHISHA',
        'message_content': 'Hello from Bhisha',
        'recipient_number': '+91XXXXXXXXXX',
    },
)

print(response.json())`,
  Java: `String baseUrl = "${BASE_URL}";
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(baseUrl + "${API_PREFIX}${SMS_SEND_PATH}"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer " + accessToken)
    .POST(HttpRequest.BodyPublishers.ofString("""
        {
          \"display_sender_id\": \"BHISHA\",
          \"message_content\": \"Hello from Bhisha\",
          \"recipient_number\": \"+91XXXXXXXXXX\"
        }
        """))
    .build();`,
  'C#': `using var client = new HttpClient();
client.BaseAddress = new Uri("${BASE_URL}");
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", accessToken);

var payload = new {
    display_sender_id = "BHISHA",
    message_content = "Hello from Bhisha",
    recipient_number = "+91XXXXXXXXXX"
};

var response = await client.PostAsJsonAsync("${API_PREFIX}${SMS_SEND_PATH}", payload);`,
  PHP: `$baseUrl = '${BASE_URL}';
$payload = [
  'display_sender_id' => 'BHISHA',
  'message_content' => 'Hello from Bhisha',
  'recipient_number' => '+91XXXXXXXXXX',
];

$ch = curl_init($baseUrl . '${API_PREFIX}${SMS_SEND_PATH}');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer ' . $accessToken,
  'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));`,
  Go: `baseURL := "${BASE_URL}"
payload := strings.NewReader(` + "`" + `{
  "display_sender_id":"BHISHA",
  "message_content":"Hello from Bhisha",
  "recipient_number":"+91XXXXXXXXXX"
}` + "`" + `)

req, _ := http.NewRequest("POST", baseURL + "${API_PREFIX}${SMS_SEND_PATH}", payload)
req.Header.Set("Authorization", "Bearer "+accessToken)
req.Header.Set("Content-Type", "application/json")`,
};

const advancedSendExamples = [
  {
    title: 'Provider API - Single Send (cURL)',
    code: `curl -X POST ${BASE_URL}${API_PREFIX}/sms/send/ \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transport": "api",
    "send_mode": "single",
    "display_sender_id": "SENDERID",
    "message_content": "Your OTP is 384221",
    "recipient_number": "91XXXXXXXXXX"
  }'`,
  },
  {
    title: 'Provider API - Bulk File Send (JavaScript)',
    code: `const formData = new FormData();
formData.append('transport', 'api');
formData.append('send_mode', 'file_numbers');
formData.append('display_sender_id', 'SENDERID');
formData.append('message_content', 'Festival offer is now live');
formData.append('source_file', fileInput.files[0]);

await fetch('${BASE_URL}${API_PREFIX}/sms/send/', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + accessToken },
  body: formData,
});`,
  },
  {
    title: 'SMPP Send via App Endpoint (Python)',
    code: `import requests

payload = {
    "transport": "smpp",
    "smpp_profile": "standard",
    "display_sender_id": "SENDERID",
    "message_content": "SMPP route test message",
    "recipient_number": "91XXXXXXXXXX",
    "smpp_host": "smpp.your-provider.com",
    "smpp_port": 2775,
    "smpp_system_id": "your_system_id",
    "smpp_password": "your_smpp_password",
}

res = requests.post(
    '${BASE_URL}${API_PREFIX}/sms/send/',
    headers={"Authorization": "Bearer <access_token>"},
    json=payload,
    timeout=20,
)
print(res.status_code, res.json())`,
  },
  {
    title: 'SMPP DLT Profile Send (JSON)',
    code: `{
  "transport": "smpp",
  "smpp_profile": "dlt",
  "display_sender_id": "SENDERID",
  "message_content": "Your order #1234 is dispatched.",
  "recipient_number": "91XXXXXXXXXX",
  "smpp_host": "smpp.your-provider.com",
  "smpp_port": 2775,
  "smpp_system_id": "your_system_id",
  "smpp_password": "your_smpp_password",
  "smpp_template_id": "DLT_TEMPLATE_1001",
  "dlt_entity_id": "DLT_ENTITY_1001",
  "dlt_telemarketer_id": "DLT_TMK_1001"
}`,
  },
];

const mailValidationModes = ['api_key', 'ip_whitelist'];

const mailModeLabels = {
  api_key: 'API Key',
  ip_whitelist: 'IP Whitelist',
};

const mailValidationSamples = {
  api_key: {
    cURL: `curl -X POST ${BASE_URL}${API_PREFIX}${MAIL_VALIDATE_PATH} \\
  -H "X-API-Key: <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com"
  }'`,
    JavaScript: `const response = await fetch("${BASE_URL}${API_PREFIX}${MAIL_VALIDATE_PATH}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "<YOUR_API_KEY>",
  },
  body: JSON.stringify({
    email: "user@example.com"
  })
});

const data = await response.json();
console.log(data); // { email, status, request_id }`,
    Python: `import requests

base_url = "${BASE_URL}"
response = requests.post(
    base_url + "${API_PREFIX}${MAIL_VALIDATE_PATH}",
    headers={"X-API-Key": "<YOUR_API_KEY>"},
    json={
      "email": "user@example.com"
    },
)

print(response.json())  # {"email": "user@example.com", "status": "Valid", "request_id": "..."}`,
    Java: `String payload = """
{
  \"email\": \"user@example.com\"
}
""";`,
    'C#': `using var client = new HttpClient();
client.BaseAddress = new Uri("${BASE_URL}");
client.DefaultRequestHeaders.Add("X-API-Key", "<YOUR_API_KEY>");

var payload = new {
  email = "user@example.com"
};

var response = await client.PostAsJsonAsync("${API_PREFIX}${MAIL_VALIDATE_PATH}", payload);`,
  },
  ip_whitelist: {
    cURL: `curl -X POST ${BASE_URL}${API_PREFIX}${MAIL_VALIDATE_PATH} \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com"
  }'`,
    JavaScript: `const response = await fetch("${BASE_URL}${API_PREFIX}${MAIL_VALIDATE_PATH}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com"
  })
});

const data = await response.json();
console.log(data); // { email, status, request_id }`,
    Python: `import requests

base_url = "${BASE_URL}"
response = requests.post(
    base_url + "${API_PREFIX}${MAIL_VALIDATE_PATH}",
    json={
      "email": "user@example.com"
    },
)

print(response.json())`,
    Java: `String payload = """
{
  \"email\": \"user@example.com\"
}
""";

// Call from a whitelisted public IP configured by admin`,
    'C#': `using var client = new HttpClient();
client.BaseAddress = new Uri("${BASE_URL}");

var payload = new {
  email = "user@example.com"
};

var response = await client.PostAsJsonAsync("${API_PREFIX}${MAIL_VALIDATE_PATH}", payload);`,
  },
};

const mailTaskControlSample = `# Status
POST ${BASE_URL}${API_PREFIX}${MAIL_STATUS_PATH}
Headers (one of these modes):
  X-API-Key: <YOUR_API_KEY>
  OR no API key when caller IP is whitelisted
Body:
{
  "request_id": "<REQUEST_ID>"
}

# Control
POST ${BASE_URL}${API_PREFIX}${MAIL_CONTROL_PATH}
Headers (one of these modes):
  X-API-Key: <YOUR_API_KEY>
  OR no API key when caller IP is whitelisted
Body:
{
  "request_id": "<REQUEST_ID>",
  "action": "pause" // start, pause, resume, stop, cancel
}`;

const compactApiResponseExample = `{
  "email": "user@example.com",
  "status": "Valid",
  "request_id": "09b27399-2342-4240-bea7-0b29b7f8181c"
}`;

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    description: 'This API powers authentication, profile management, SMS operations, free-trial workflows, and internal notifications for this application.',
    points: [
      'Base path: /api/auth/',
      'JSON request/response format',
      'JWT authentication for protected endpoints',
      'Role-aware access: user and primary admin paths',
    ],
  },
  {
    id: 'authentication',
    title: 'Authentication & Access',
    description: 'Use login OTP flow and JWT tokens for secure access.',
    endpoints: [
      { method: 'POST', path: '/login/', auth: 'Public', description: 'Login and receive JWT access/refresh tokens.' },
    ],
  },
  {
    id: 'sms',
    title: 'SMS Operations',
    description: 'Send SMS, inspect message history/status, and manage groups and short URLs.',
    endpoints: [
      { method: 'POST', path: '/sms/send/', auth: 'JWT + Admin', description: 'Send SMS via API/SMPP with optional modes.' },
      { method: 'GET', path: '/sms/messages/', auth: 'JWT', description: 'List SMS history for allowed scope.' },
      { method: 'GET', path: '/sms/messages/{id}/', auth: 'JWT', description: 'Fetch a message status record.' },
      { method: 'GET/PATCH', path: '/sms/credentials/', auth: 'JWT + Admin', description: 'Get/update provider credentials and sender IDs.' },
      { method: 'GET/POST', path: '/sms/groups/', auth: 'JWT + Admin', description: 'Create and list contact groups for campaigns.' },
      { method: 'GET/POST', path: '/sms/short-urls/', auth: 'JWT + Admin', description: 'Create and list short tracking links.' },
      { method: 'PATCH/DELETE', path: '/sms/short-urls/{url_id}/', auth: 'JWT + Admin', description: 'Update or remove a short URL.' },
      { method: 'GET', path: '/sms/timezones/', auth: 'JWT', description: 'Get searchable timezone metadata for scheduling.' },
    ],
  },
  {
    id: 'mail-validation',
    title: 'Mail Validation',
    description: 'Validate single email requests and track request state with status/control APIs.',
    endpoints: [
      { method: 'POST', path: '/email-validation/api/validate/', auth: 'API Key or Whitelisted IP', description: 'Validate a single email and return email, status, and unique request_id.' },
      { method: 'POST', path: '/email-validation/api/status/', auth: 'API Key or Whitelisted IP', description: 'Get request status by request_id.' },
      { method: 'POST', path: '/email-validation/api/control/', auth: 'API Key or Whitelisted IP', description: 'Control a running request with start/pause/resume/stop/cancel.' },
    ],
  },
  {
    id: 'profile',
    title: 'Profile & Wallet',
    description: 'Fetch and update user profile, usage data, sender identity, and wallet summary.',
    endpoints: [
      { method: 'GET', path: '/profile/', auth: 'JWT', description: 'Returns profile, SMS usage, and wallet values.' },
      { method: 'PATCH', path: '/profile/', auth: 'JWT', description: 'Update profile and sender identity details.' },
      { method: 'GET', path: '/sms/usage-summary/', auth: 'JWT', description: 'Get aggregated SMS usage for current user.' },
    ],
  },
  {
    id: 'free-trial',
    title: 'Free Trial SMS',
    description: 'End-user path for trial sending and verified mobile workflow.',
    endpoints: [
      { method: 'POST', path: '/sms/free-trial/send-otp/', auth: 'JWT', description: 'Returns trial OTP guidance/state.' },
      { method: 'POST', path: '/sms/free-trial/verify-otp/', auth: 'JWT/Public', description: 'Validates trial OTP flow state.' },
      { method: 'GET', path: '/sms/free-trial/verified-numbers/', auth: 'JWT', description: 'Returns verified trial destinations.' },
      { method: 'POST', path: '/sms/free-trial/send/', auth: 'JWT', description: 'Send trial SMS under trial policy.' },
    ],
  },
];

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #EDE8FB',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 4px 16px rgba(26, 14, 78, 0.08)',
};

export default function ApiDocsOverview() {
  const navigate = useNavigate();
  const languages = useMemo(() => Object.keys(codeSamples), []);
  const navigationItems = useMemo(() => sections.map((section) => ({ id: section.id, title: section.title })), []);
  const [activeLanguage, setActiveLanguage] = useState('cURL');
  const [activeMailLanguage, setActiveMailLanguage] = useState('Python');
  const [activeMailMode, setActiveMailMode] = useState('api_key');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F5F1FF 0%, #F0EFFE 100%)', padding: '24px' }}>
      <div style={{ maxWidth: '1260px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: '#F5F3FF',
            color: '#5B3FA8',
            padding: '10px 14px',
            cursor: 'pointer',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>

        <div style={{ ...cardStyle, marginBottom: '18px', background: 'linear-gradient(140deg, #ffffff, #f1f5f9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', marginBottom: '10px' }}>
            <FaBookOpen />
            <strong>API Reference</strong>
          </div>
          <h2 style={{ margin: '0 0 8px', color: '#1A0E4E' }}>Messaging Platform API Documentation</h2>
          <p style={{ margin: 0, color: '#6B6B8A', lineHeight: 1.6 }}>
            Structured reference inspired by modern API docs, tailored to this application. Use your deployment hostname with
            the common prefix <strong>{API_PREFIX}</strong>.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <aside style={{ ...cardStyle, position: 'sticky', top: '20px', alignSelf: 'start', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#1A0E4E' }}>
              <FaServer />
              <strong>Sections</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  style={{
                    textDecoration: 'none',
                    color: '#4B4B6B',
                    fontSize: '14px',
                    background: '#F5F3FF',
                    border: '1px solid #EDE8FB',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    fontWeight: 600,
                  }}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </aside>

          <main style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#5B3FA8' }}>
                <FaKey />
                <strong style={{ color: '#1A0E4E' }}>Base URL and Auth Header</strong>
              </div>
              <div style={{ color: '#334155', lineHeight: 1.8, fontSize: '14px' }}>
                <div><strong>Base URL:</strong> {BASE_URL}</div>
                <div><strong>API Prefix:</strong> {API_PREFIX}</div>
                <div><strong>Authorization:</strong> Bearer &lt;access_token&gt;</div>
                <div><strong>Content-Type:</strong> application/json</div>
              </div>
            </div>

            {sections.map((section) => (
              <section key={section.id} id={section.id} style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#1A0E4E' }}>{section.title}</h3>
                <p style={{ marginTop: 0, color: '#6B6B8A', lineHeight: 1.6 }}>{section.description}</p>

                {section.points && (
                  <ul style={{ margin: '0 0 0 18px', color: '#4B4B6B', lineHeight: 1.7 }}>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}

                {section.endpoints && (
                  <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
                    {section.endpoints.map((item) => (
                      <div key={`${item.method}-${item.path}`} style={{ border: '1px solid #EDE8FB', borderRadius: '12px', padding: '10px 12px', background: '#F5F3FF' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ background: '#5B3FA8', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 700, padding: '4px 8px' }}>{item.method}</span>
                          <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', color: '#1a0e4e' }}>{API_PREFIX}{item.path}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B6B8A', fontWeight: 700 }}>{item.auth}</span>
                        </div>
                        <div style={{ color: '#4B4B6B', fontSize: '13px' }}>{item.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDE8FB', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaCode color="#5B3FA8" />
                <strong style={{ color: '#1A0E4E' }}>Code Samples</strong>
              </div>

              <div style={{ padding: '12px 12px 0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {languages.map(language => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setActiveLanguage(language)}
                    style={{
                      border: '1px solid #DDD4F8',
                      backgroundColor: activeLanguage === language ? '#5B3FA8' : '#F5F3FF',
                      color: activeLanguage === language ? '#ffffff' : '#4B4B6B',
                      borderRadius: '999px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {language}
                  </button>
                ))}
              </div>

              <div style={{ padding: '12px' }}>
                <div style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #1f2937',
                }}>
                  <div style={{
                    backgroundColor: '#0f172a',
                    color: '#93c5fd',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderBottom: '1px solid #1f2937',
                  }}>
                    {activeLanguage} request example
                  </div>
                  <pre style={{
                    margin: 0,
                    backgroundColor: '#020617',
                    color: '#e2e8f0',
                    padding: '14px',
                    overflowX: 'auto',
                    fontSize: '12px',
                    lineHeight: 1.55,
                  }}>
                    <code>{codeSamples[activeLanguage]}</code>
                  </pre>
                </div>
              </div>
            </div>

            <section style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#1A0E4E' }}>Advanced Send Examples (API + SMPP)</h3>
              <p style={{ marginTop: 0, color: '#6B6B8A', lineHeight: 1.6 }}>
                These examples are tailored for your application flow with provider API transport and SMPP transport.
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                {advancedSendExamples.map((example) => (
                  <div key={example.title} style={{ border: '1px solid #EDE8FB', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#F5F3FF', borderBottom: '1px solid #EDE8FB', padding: '10px 12px', fontWeight: 700, color: '#1A0E4E' }}>
                      {example.title}
                    </div>
                    <pre style={{ margin: 0, background: '#020617', color: '#e2e8f0', padding: '12px', overflowX: 'auto', fontSize: '12px', lineHeight: 1.5 }}>
                      <code>{example.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#1A0E4E' }}>Mail Validation Examples (API Key or IP Whitelist)</h3>
              <p style={{ marginTop: 0, color: '#6B6B8A', lineHeight: 1.6 }}>
                Use API key mode or whitelisted IP mode. In IP mode, admin must configure allowed IPs and billing user in Admin Center.
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {mailValidationModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveMailMode(mode)}
                    style={{
                      border: '1px solid #DDD4F8',
                      backgroundColor: activeMailMode === mode ? '#5B3FA8' : '#F5F3FF',
                      color: activeMailMode === mode ? '#ffffff' : '#4B4B6B',
                      borderRadius: '999px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {mailModeLabels[mode] || mode}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {Object.keys(mailValidationSamples[activeMailMode]).map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setActiveMailLanguage(language)}
                    style={{
                      border: '1px solid #DDD4F8',
                      backgroundColor: activeMailLanguage === language ? '#5B3FA8' : '#F5F3FF',
                      color: activeMailLanguage === language ? '#ffffff' : '#4B4B6B',
                      borderRadius: '999px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {language}
                  </button>
                ))}
              </div>

              <pre style={{ margin: 0, background: '#020617', color: '#e2e8f0', padding: '12px', overflowX: 'auto', fontSize: '12px', lineHeight: 1.5, borderRadius: '10px', border: '1px solid #1f2937' }}>
                <code>{mailValidationSamples[activeMailMode][activeMailLanguage]}</code>
              </pre>

              <div style={{ marginTop: '12px', border: '1px solid #EDE8FB', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#F5F3FF', borderBottom: '1px solid #EDE8FB', padding: '10px 12px', fontWeight: 700, color: '#1A0E4E' }}>
                  Status + Control APIs
                </div>
                <pre style={{ margin: 0, background: '#020617', color: '#e2e8f0', padding: '12px', overflowX: 'auto', fontSize: '12px', lineHeight: 1.5 }}>
                  <code>{mailTaskControlSample}</code>
                </pre>
              </div>

              <div style={{ marginTop: '12px', border: '1px solid #EDE8FB', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#F5F3FF', borderBottom: '1px solid #EDE8FB', padding: '10px 12px', fontWeight: 700, color: '#1A0E4E' }}>
                  Compact API Response (Recommended Fields)
                </div>
                <pre style={{ margin: 0, background: '#020617', color: '#e2e8f0', padding: '12px', overflowX: 'auto', fontSize: '12px', lineHeight: 1.5 }}>
                  <code>{compactApiResponseExample}</code>
                </pre>
              </div>

              <div style={{ marginTop: '12px', border: '1px solid #EDE8FB', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#F5F3FF', borderBottom: '1px solid #EDE8FB', padding: '10px 12px', fontWeight: 700, color: '#1A0E4E' }}>
                  Response Format Notes
                </div>
                <div style={{ padding: '12px', color: '#4B4B6B', background: '#ffffff', fontSize: '13px', lineHeight: 1.6 }}>
                  Each response item in <strong>results</strong> represents one email with explicit JSON fields.
                  This supports one-by-one processing cleanly in UI and backend integrations.
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}