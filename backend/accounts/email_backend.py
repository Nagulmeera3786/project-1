import ssl
import socket
import smtplib

import certifi
from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend


class EmailBackend(DjangoSMTPEmailBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._force_unverified_context = False

    def _fallback_profiles(self):
        provider = str(getattr(settings, 'EMAIL_PROVIDER', '') or '').strip().lower()
        profiles = []

        if provider == 'ionos':
            current = (str(self.host).strip().lower(), int(self.port), bool(self.use_tls), bool(self.use_ssl))
            ionos_profiles = [
                ('smtp.ionos.com', 587, True, False),
                ('smtp.ionos.com', 465, False, True),
            ]
            for host, port, use_tls, use_ssl in ionos_profiles:
                if current != (host, port, use_tls, use_ssl):
                    profiles.append({
                        'host': host,
                        'port': port,
                        'use_tls': use_tls,
                        'use_ssl': use_ssl,
                    })

        return profiles

    def _apply_profile(self, profile):
        self.close()
        self.host = profile['host']
        self.port = profile['port']
        self.use_tls = profile['use_tls']
        self.use_ssl = profile['use_ssl']
        self.connection_class = smtplib.SMTP_SSL if self.use_ssl else smtplib.SMTP

    def _send_with_fallback_profiles(self, email_messages):
        original = {
            'host': self.host,
            'port': self.port,
            'use_tls': self.use_tls,
            'use_ssl': self.use_ssl,
            'connection_class': self.connection_class,
        }

        last_exception = None
        for profile in self._fallback_profiles():
            try:
                self._apply_profile(profile)
                return super().send_messages(email_messages)
            except Exception as exc:
                last_exception = exc
                continue
            finally:
                self.close()

        self.host = original['host']
        self.port = original['port']
        self.use_tls = original['use_tls']
        self.use_ssl = original['use_ssl']
        self.connection_class = original['connection_class']

        if last_exception:
            raise last_exception

        return 0

    @property
    def ssl_context(self):
        if self._force_unverified_context:
            context = ssl._create_unverified_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            return context

        context = ssl.create_default_context(cafile=certifi.where())

        verify_certs = getattr(settings, 'EMAIL_VERIFY_CERTS', True)
        if not verify_certs:
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

        if self.ssl_certfile or self.ssl_keyfile:
            context.load_cert_chain(self.ssl_certfile, self.ssl_keyfile)

        return context

    def send_messages(self, email_messages):
        try:
            return super().send_messages(email_messages)
        except ssl.SSLCertVerificationError:
            allow_fallback = getattr(settings, 'EMAIL_ALLOW_INSECURE_FALLBACK', True)
            if not allow_fallback:
                raise
            self.close()
            self._force_unverified_context = True
            try:
                return super().send_messages(email_messages)
            finally:
                self._force_unverified_context = False
        except (TimeoutError, socket.timeout, OSError):
            return self._send_with_fallback_profiles(email_messages)
