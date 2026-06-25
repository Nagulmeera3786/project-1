# Bhisha Messaging & Mail Validation API Documentation

## 1. Overview
This document defines the production API contract for SMS messaging and mail validation services.

- Base URL: `https://<your-domain>`
- API prefix: `/api/auth/`
- Transport: HTTPS + JSON (`multipart/form-data` for file uploads)
- Time format: ISO-8601 UTC
- Authentication:
1. JWT Bearer token for dashboard-authenticated endpoints
2. API key + user credentials for external mail-validation API access

## 2. Authentication and Access

This API supports two authentication methods:

1. JWT Bearer tokens (dashboard and authenticated APIs)
2. API key + user credentials (external mail-validation API)

### 2.1 Login Endpoints

1. `POST /api/auth/login/`
   - Access: Public
   - Purpose: Obtain `access` and `refresh` JWT tokens.

2. `POST /api/auth/token/refresh/`
   - Access: Public
   - Purpose: Rotate expired access tokens.

### 2.2 JWT-Protected Access

Use header:

`Authorization: Bearer <access_token>`

Common JWT-protected endpoints:

1. `GET /api/auth/profile/`
2. `GET /api/auth/wallet/`
3. `POST /api/auth/email-validation/validate/`
4. `GET /api/auth/email-validation/history/`
5. `GET/POST /api/auth/email-validation/api-keys/`
6. `PATCH/DELETE /api/auth/email-validation/api-keys/{key_id}/`

### 2.3 External API Access (API Key + User Credentials)

Endpoint:

`POST /api/auth/email-validation/api/validate/`

Credentials can be passed in JSON body:

```json
{
  "api_key": "<YOUR_API_KEY>",
  "user_id": "<YOUR_USER_ID>",
  "password": "<YOUR_PASSWORD>",
  "email": "user@example.com"
}
```

Or pass API key using `X-API-Key` header and keep `user_id`, `password` in body.

### 2.4 Real-Time Code Samples (Popular Languages)

#### cURL

```bash
# Login and get JWT
curl -X POST "https://<your-domain>/api/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"<PASSWORD>"}'

# Refresh access token
curl -X POST "https://<your-domain>/api/auth/token/refresh/" \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<REFRESH_TOKEN>"}'
```

#### JavaScript (Node.js)

```javascript
import axios from "axios";

const baseUrl = "https://<your-domain>/api/auth";

async function run() {
  const login = await axios.post(`${baseUrl}/login/`, {
    email: "user@example.com",
    password: "<PASSWORD>",
  });

  const access = login.data.access;
  const refresh = login.data.refresh;

  const refreshToken = await axios.post(`${baseUrl}/token/refresh/`, {
    refresh,
  });

  console.log(access, refreshToken.data.access);
}

run().catch(console.error);
```

#### Python

```python
import requests

base = "https://<your-domain>/api/auth"

login = requests.post(
    f"{base}/login/",
    json={"email": "user@example.com", "password": "<PASSWORD>"},
    timeout=30,
)
login.raise_for_status()
access = login.json()["access"]
refresh = login.json()["refresh"]

token_refresh = requests.post(
  f"{base}/token/refresh/",
  json={"refresh": refresh},
  timeout=30,
)
token_refresh.raise_for_status()

print(access, token_refresh.json().get("access"))
```

#### Java (HttpClient)

```java
HttpClient client = HttpClient.newHttpClient();
ObjectMapper mapper = new ObjectMapper();

String loginBody = mapper.writeValueAsString(Map.of(
    "email", "user@example.com",
    "password", "<PASSWORD>"
));

HttpRequest loginReq = HttpRequest.newBuilder()
    .uri(URI.create("https://<your-domain>/api/auth/login/"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(loginBody))
    .build();

HttpResponse<String> loginRes = client.send(loginReq, HttpResponse.BodyHandlers.ofString());
String access = mapper.readTree(loginRes.body()).get("access").asText();
String refresh = mapper.readTree(loginRes.body()).get("refresh").asText();

String refreshBody = mapper.writeValueAsString(Map.of("refresh", refresh));
HttpRequest refreshReq = HttpRequest.newBuilder()
  .uri(URI.create("https://<your-domain>/api/auth/token/refresh/"))
    .header("Content-Type", "application/json")
  .POST(HttpRequest.BodyPublishers.ofString(refreshBody))
    .build();

HttpResponse<String> refreshRes = client.send(refreshReq, HttpResponse.BodyHandlers.ofString());
System.out.println(access);
System.out.println(refreshRes.body());
```

#### C# (.NET HttpClient)

```csharp
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

var http = new HttpClient();
var baseUrl = "https://<your-domain>/api/auth";

var loginContent = new StringContent(
    JsonSerializer.Serialize(new { email = "user@example.com", password = "<PASSWORD>" }),
    Encoding.UTF8,
    "application/json"
);

var loginRes = await http.PostAsync($"{baseUrl}/login/", loginContent);
loginRes.EnsureSuccessStatusCode();
var loginJson = JsonDocument.Parse(await loginRes.Content.ReadAsStringAsync());
var access = loginJson.RootElement.GetProperty("access").GetString();
var refresh = loginJson.RootElement.GetProperty("refresh").GetString();

var refreshContent = new StringContent(
  JsonSerializer.Serialize(new { refresh }),
    Encoding.UTF8,
    "application/json"
);

var refreshRes = await http.PostAsync($"{baseUrl}/token/refresh/", refreshContent);
refreshRes.EnsureSuccessStatusCode();

Console.WriteLine(access);
Console.WriteLine(await refreshRes.Content.ReadAsStringAsync());
```

## 3. Core Resource IDs and DLR
All request records include platform-generated unique IDs.

### 3.1 ID Format
`<first2><service><serial><last2>`

- `first2`: first two characters of user name
- `service`: `MS` for messaging, `MV` for mail validation
- `serial`: unique serial for the request record (zero-padded)
- `last2`: last two characters of user name

Examples for user `Meera`:
- Messaging: `MeMS00000023ra`
- Mail validation: `MeMV00000091ra`

### 3.2 DLR (Delivery/Completion Report)
DLR report fields are available in request responses and history/search responses.

- `request_id`: platform unique ID (`message_id` for SMS, `request_id` for mail validation)
- `status`: current state
- `completed`: boolean completion indicator
- `delivery_time`: completion time (`null` if pending)

## 4. Endpoint Index

### 4.1 Messaging
1. `POST /api/auth/sms/send/`  
   Send single or bulk SMS (admin-enabled JWT account).
2. `GET /api/auth/sms/messages/`  
   SMS history with search support (`?q=`).
3. `GET /api/auth/sms/messages/{id}/`  
   Retrieve one SMS status item.

### 4.2 Mail Validation
1. `POST /api/auth/email-validation/validate/`  
   Dashboard mail validation (JWT account).
2. `POST /api/auth/email-validation/api/validate/`  
   External/customer API mail validation.
3. `GET /api/auth/email-validation/history/`  
   Validation history with filters (`?source=`) and search (`?q=`).

### 4.3 Admin Credits
1. `PATCH /api/auth/admin/users/{user_id}/wallet/credits/`  
   Manually add messaging and mail-validation credits to a user wallet.
2. `GET /api/auth/wallet/`  
   Retrieve authenticated wallet balances.

### 4.4 Unified Status Search
1. `GET /api/auth/request-status/search/?q=<request_id_or_keyword>`  
   Search SMS and mail-validation request statuses by unique ID or keyword.

## 5. Messaging API

### 5.1 Single Messaging Request
- Endpoint: `POST /api/auth/sms/send/`
- Auth: `Authorization: Bearer <access_token>`
- Content-Type: `application/json`

Request body (single):
```json
{
  "transport": "api",
  "send_mode": "single",
  "display_sender_id": "BHISHA",
  "message_content": "Your OTP is 928311",
  "recipient_number": "919876543210"
}
```

Response highlights:
- `message_id`: platform unique request ID (example `MeMS00000024ra`)
- `provider_message_id`: provider reference (if returned by provider)
- `status`
- `delivery_time`
- `dlr_report`
- `remaining_sms_credits`

### 5.2 Bulk Messaging Request
- Endpoint: `POST /api/auth/sms/send/`
- Auth: Bearer JWT
- Content-Type: `multipart/form-data`

Request body fields:
- `send_mode`: `file_numbers` or `personalized_file` or `group`
- `transport`: `api` or `smpp`
- `display_sender_id`
- `message_content`
- `source_file` (for file modes)

Response highlights:
- `batch_reference`
- `sent_count`, `failed_count`, `scheduled_count`
- `message_ids[]` (platform request IDs)
- `remaining_sms_credits`

## 6. Mail Validation API

### 6.1 Dashboard Validation (Single/Bulk)
- Endpoint: `POST /api/auth/email-validation/validate/`
- Auth: Bearer JWT

Accepted inputs:
1. Single: `email`
2. Bulk inline: `emails` (array/string)
3. Bulk file upload: `source_file`

Response highlights:
- `request_id`: platform unique request ID (example `MeMV00000108ra`)
- `results[]`: Verifalia-style result objects
- `simple_results[]`: normalized yes/no summary fields
- `summary.safe_to_send_yes`, `summary.safe_to_send_no`
- `wallet_balance`
- `dlr_report` with delivery/completion time

Example request (single):
```json
{
  "email": "user@example.com"
}
```

Example request (bulk inline):
```json
{
  "emails": ["one@example.com", "two@example.com", "three@example.com"]
}
```

Example success response (shortened):
```json
{
  "request_id": "MeMV00000108ra",
  "count": 3,
  "wallet_balance": "97.0000",
  "summary": {
    "safe_to_send_yes": 2,
    "safe_to_send_no": 1
  },
  "simple_results": [
    {
      "email": "one@example.com",
      "safe_to_send": "yes",
      "valid_mailbox": "yes",
      "disposable": "no"
    }
  ]
}
```

### 6.2 External/Customer API Validation (Single/Bulk)
- Endpoint: `POST /api/auth/email-validation/api/validate/`
- Auth: API key + user credentials

Request auth fields:
- `api_key`
- `user_id`
- `password`

Same payload modes and response contract as dashboard validation.

Example request:
```json
{
  "api_key": "<YOUR_API_KEY>",
  "user_id": "<YOUR_USER_ID>",
  "password": "<YOUR_PASSWORD>",
  "emails": ["one@example.com", "two@example.com"]
}
```

Alternative auth style:
- Header: `X-API-Key: <YOUR_API_KEY>`
- Body: `user_id`, `password`, plus `email` or `emails` or `source_file`

### 6.3 File Upload Validation
- Endpoint: `POST /api/auth/email-validation/validate/` (JWT)
- Endpoint: `POST /api/auth/email-validation/api/validate/` (API key mode)
- Content-Type: `multipart/form-data`
- File field: `source_file`
- Allowed: `.txt`, `.csv`, `.xlsv`, `.xls`, `.xlsx`
- Max file size: `10MB`
- Max emails per request: `50`

### 6.4 Mail Validation Error Cases
- `400` invalid payload or unsupported file
- `401` invalid API credentials (external API mode)
- `402` insufficient email validation credits
- `503` provider credits unavailable

'''## 7. Admin Credit Management

### 7.1 Add Credits Manually
- Endpoint: `PATCH /api/auth/admin/users/{user_id}/wallet/credits/`
- Auth: Admin JWT

Request body:
```json
{
  "add_message_credits": "500",
  "add_email_validation_credits": "250"
}
```

Response:
```json
{
  "user_id": 12,
  "user_email": "client@example.com",
  "message_credits": "1500.0000",
  "email_validation_credits": "480.0000",
  "added_message_credits": "500.0000",
  "added_email_validation_credits": "250.0000"
}
```
'''
## 8. Search and Request Tracking

### 8.1 Request Status Search
- Endpoint: `GET /api/auth/request-status/search/?q=MeMS00000024ra`
- Auth: Admin/Employee JWT

Response includes:
- `sms[]`
- `email_validations[]`
- each item includes DLR/completion status and delivery/completion time

### 8.2 History Search
- SMS history: `GET /api/auth/sms/messages/?q=<term>`
- Mail history: `GET /api/auth/email-validation/history/?source=all&q=<term>`

## 9. Pseudocode Integration Examples

### 9.1 JavaScript (Node.js/TypeScript)
```javascript
// SINGLE SMS
POST /api/auth/sms/send/
headers: { Authorization: `Bearer ${token}` }
body: {
  send_mode: "single",
  display_sender_id: "BHISHA",
  message_content: "Hello",
  recipient_number: "919876543210"
}
expect response.message_id, response.dlr_report

// BULK SMS (file)
POST /api/auth/sms/send/ as multipart/form-data
fields: send_mode=file_numbers, source_file=<xlsx>, message_content=...
expect response.batch_reference, response.message_ids

// SINGLE MAIL VALIDATION
POST /api/auth/email-validation/validate/
headers: { Authorization: `Bearer ${token}` }
body: { email: "user@example.com" }
expect response.request_id, response.results, response.dlr_report

// BULK MAIL VALIDATION
POST /api/auth/email-validation/validate/
body: { emails: ["a@x.com", "b@y.com"] }
expect response.request_id, response.summary, response.simple_results
```

### 9.2 Python
```python
# SINGLE SMS
resp = post('/api/auth/sms/send/', jwt_token, {
    'send_mode': 'single',
    'display_sender_id': 'BHISHA',
    'message_content': 'Hello',
    'recipient_number': '919876543210'
})
print(resp['message_id'], resp['dlr_report'])

# BULK SMS
resp = post_multipart('/api/auth/sms/send/', jwt_token, {
    'send_mode': 'file_numbers',
    'message_content': 'Campaign message',
    'source_file': open('contacts.xlsx', 'rb')
})
print(resp['batch_reference'], resp['message_ids'])

# SINGLE MAIL VALIDATION
resp = post('/api/auth/email-validation/validate/', jwt_token, {
    'email': 'user@example.com'
})
print(resp['request_id'], resp['results'])

# BULK MAIL VALIDATION
resp = post('/api/auth/email-validation/api/validate/', None, {
    'api_key': API_KEY,
    'user_id': USER_ID,
    'password': USER_PASSWORD,
    'emails': ['a@example.com', 'b@example.com']
})
print(resp['request_id'], resp['summary'])
```

### 9.3 Java
```java
// SINGLE SMS
POST("/api/auth/sms/send/")
  .bearer(token)
  .json({
    "send_mode":"single",
    "display_sender_id":"BHISHA",
    "message_content":"Hello",
    "recipient_number":"919876543210"
  })
  .execute();

// BULK SMS
POST_MULTIPART("/api/auth/sms/send/")
  .bearer(token)
  .field("send_mode", "file_numbers")
  .file("source_file", "contacts.xlsx")
  .execute();

// SINGLE MAIL VALIDATION
POST("/api/auth/email-validation/validate/")
  .bearer(token)
  .json({"email":"user@example.com"})
  .execute();

// BULK MAIL VALIDATION (external API mode)
POST("/api/auth/email-validation/api/validate/")
  .json({
    "api_key": apiKey,
    "user_id": userId,
    "password": userPassword,
    "emails": List.of("a@example.com", "b@example.com")
  })
  .execute();
```

### 9.4 C#
```csharp
// SINGLE SMS
await PostJson("/api/auth/sms/send/", token, new {
    send_mode = "single",
    display_sender_id = "BHISHA",
    message_content = "Hello",
    recipient_number = "919876543210"
});

// BULK SMS
await PostMultipart("/api/auth/sms/send/", token, form => {
    form.Add("send_mode", "file_numbers");
    form.Add("source_file", File.OpenRead("contacts.xlsx"));
});

// SINGLE MAIL VALIDATION
await PostJson("/api/auth/email-validation/validate/", token, new {
    email = "user@example.com"
});

// BULK MAIL VALIDATION (API mode)
await PostJson("/api/auth/email-validation/api/validate/", null, new {
    api_key = apiKey,
    user_id = userId,
    password = userPassword,
    emails = new[] { "a@example.com", "b@example.com" }
});
```

## 10. Operational Notes
1. All generated request IDs are unique and searchable.
2. Messaging credits and mail-validation credits are independent wallet balances.
3. Admin can add credits manually through admin APIs and dashboard controls.
4. APIs are deployment-safe for Linux VPS and production domains, including bhisha.com.
5. For bulk operations, clients should store request IDs and poll/search status endpoints for operational tracking.

## 11. Error Contract
Standard error payload:
```json
{
  "detail": "Human-readable error message"
}
```

Common status codes:
- `200` Success
- `201` Resource created
- `400` Validation/input error
- `401` Authentication failed
- `402` Insufficient credits
- `403` Forbidden
- `404` Not found
- `500` Server error
- `503` Upstream service temporarily unavailable
