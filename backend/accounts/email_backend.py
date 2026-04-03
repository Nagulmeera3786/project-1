import ssl

import certifi
from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend


class EmailBackend(DjangoSMTPEmailBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._force_unverified_context = False

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