"""Microsoft Graph API email backend (Entra ID app + client-credentials flow).

Sends mail via https://graph.microsoft.com/v1.0/users/{sender}/sendMail using an
Azure AD (Entra) app registration, so Django's normal send_mail()/EmailMessage
API keeps working unchanged for OTP, forgot-password, and reset-password mail.
"""
import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class GraphEmailBackend(BaseEmailBackend):
    def _get_access_token(self):
        try:
            from msal import ConfidentialClientApplication
        except ImportError as exc:
            raise RuntimeError('msal package is required for GRAPH email provider; add it to requirements.txt') from exc

        tenant_id = str(getattr(settings, 'GRAPH_TENANT_ID', '') or '').strip()
        client_id = str(getattr(settings, 'GRAPH_CLIENT_ID', '') or '').strip()
        client_secret = str(getattr(settings, 'GRAPH_CLIENT_SECRET', '') or '').strip()
        if not (tenant_id and client_id and client_secret):
            raise RuntimeError('GRAPH_TENANT_ID, GRAPH_CLIENT_ID, and GRAPH_CLIENT_SECRET must be configured.')

        app = ConfidentialClientApplication(
            client_id=client_id,
            authority=f'https://login.microsoftonline.com/{tenant_id}',
            client_credential=client_secret,
        )
        result = app.acquire_token_for_client(scopes=['https://graph.microsoft.com/.default'])
        access_token = result.get('access_token')
        if not access_token:
            raise RuntimeError(
                f"Failed to acquire Graph access token: {result.get('error')} - {result.get('error_description')}"
            )
        return access_token

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        sender_email = (
            str(getattr(settings, 'GRAPH_SENDER_EMAIL', '') or '').strip()
            or str(getattr(settings, 'PRIMARY_ADMIN_EMAIL', '') or '').strip()
        )
        if not sender_email:
            raise RuntimeError('GRAPH_SENDER_EMAIL or PRIMARY_ADMIN_EMAIL must be configured for Graph email sending.')

        try:
            access_token = self._get_access_token()
        except Exception:
            logger.exception('Microsoft Graph authentication failed')
            if not self.fail_silently:
                raise
            return 0

        url = f'https://graph.microsoft.com/v1.0/users/{sender_email}/sendMail'
        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}

        sent_count = 0
        for message in email_messages:
            recipients = list(message.to or []) + list(message.cc or []) + list(message.bcc or [])
            if not recipients:
                continue

            content_type = 'HTML' if getattr(message, 'content_subtype', 'plain') == 'html' else 'Text'
            body = {
                'message': {
                    'subject': message.subject,
                    'body': {'contentType': content_type, 'content': message.body},
                    'toRecipients': [{'emailAddress': {'address': addr}} for addr in message.to or []],
                    'ccRecipients': [{'emailAddress': {'address': addr}} for addr in message.cc or []],
                    'bccRecipients': [{'emailAddress': {'address': addr}} for addr in message.bcc or []],
                },
                'saveToSentItems': True,
            }

            try:
                response = requests.post(url, headers=headers, json=body, timeout=15)
                if response.status_code == 202:
                    sent_count += 1
                else:
                    logger.error('Graph sendMail failed (%s): %s', response.status_code, response.text)
                    if not self.fail_silently:
                        response.raise_for_status()
            except Exception:
                logger.exception('Graph sendMail request failed')
                if not self.fail_silently:
                    raise

        return sent_count
