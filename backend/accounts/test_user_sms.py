from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import SMSCredential, SMSMessage, SMSTemplate, UserWallet
from accounts.views import SMSSendView


User = get_user_model()


@override_settings(
    SMS_DEFAULT_SENDER_IDS=['ADMIN-SENDER'],
    SMS_DEFAULT_SENDER_ID='ADMIN-SENDER',
    SMS_SMPP_HOST='smpp.example.test',
    SMS_SMPP_PORT=2775,
    SMS_SMPP_SYSTEM_ID='admin-smpp-user',
    SMS_SMPP_PASSWORD='admin-smpp-password',
    SMS_SMPP_SOURCE_ADDR_TON=5,
    SMS_SMPP_SOURCE_ADDR_NPI=0,
    SMS_SMPP_DEST_ADDR_TON=1,
    SMS_SMPP_DEST_ADDR_NPI=1,
    SMS_SMPP_DATA_CODING=0,
    SMS_SMPP_REGISTERED_DELIVERY=True,
)
class UserSMSSendTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='sms-user',
            email='sms-user@example.test',
            password='UserPass123!',
            phone_number='919876543210',
            is_active=True,
        )
        self.admin = User.objects.create_user(
            username='sms-admin',
            email='sms-admin@example.test',
            password='AdminPass123!',
            is_active=True,
            is_staff=True,
        )
        self.credential = SMSCredential.objects.create(
            user='admin-provider-user',
            password='admin-provider-password',
            sender_ids=['ADMIN-SENDER'],
            is_active=True,
        )
        self.template = SMSTemplate.objects.create(
            name='Approved user template',
            message_content='Your code is 123456',
            sender_id='ADMIN-SENDER',
            sms_type='transactional',
            approval_status=SMSTemplate.APPROVAL_APPROVED,
            is_active=True,
            created_by=self.admin,
        )
        UserWallet.objects.create(
            user=self.user,
            balance=Decimal('5'),
            email_validation_balance=Decimal('5'),
        )
        self.client.force_authenticate(self.user)

    def test_options_return_admin_sender_ids_and_transports(self):
        response = self.client.get('/api/auth/sms/user-send-options/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['sender_ids'], ['ADMIN-SENDER'])
        self.assertEqual(response.data['default_sender_id'], 'ADMIN-SENDER')
        self.assertEqual(response.data['transports'], ['api', 'smpp'])

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'api-1', 'status': 'sent'})
    def test_user_can_send_approved_template_with_admin_sender_and_api(self, mock_send):
        response = self.client.post(
            '/api/auth/sms/user-send/',
            {
                'transport': 'api',
                'display_sender_id': 'ADMIN-SENDER',
                'recipient_number': '919123456789',
                'message_content': 'client value must be replaced',
                'template_id': self.template.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        mock_send.assert_called_once()
        self.assertEqual(mock_send.call_args.args[2], 'ADMIN-SENDER')
        self.assertEqual(mock_send.call_args.args[4], 'Your code is 123456')
        sms = SMSMessage.objects.get(sender=self.user)
        self.assertEqual(sms.sms_template, self.template)
        self.assertEqual(sms.status, 'sent')
        wallet = UserWallet.objects.get(user=self.user)
        self.assertEqual(wallet.balance, Decimal('4.0000'))

    @patch.object(SMSSendView, '_send_sms_via_smpp', return_value={'message_id': 'smpp-1', 'status': 'sent'})
    def test_user_can_send_via_smpp_without_receiving_credentials(self, mock_send):
        response = self.client.post(
            '/api/auth/sms/user-send/',
            {
                'transport': 'smpp',
                'smpp_profile': 'standard',
                'display_sender_id': 'ADMIN-SENDER',
                'recipient_number': '919123456789',
                'message_content': 'An SMPP message',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        mock_send.assert_called_once()
        smpp_config = mock_send.call_args.args[0]
        self.assertEqual(smpp_config['host'], 'smpp.example.test')
        self.assertEqual(smpp_config['system_id'], 'admin-smpp-user')
        self.assertEqual(smpp_config['password'], 'admin-smpp-password')

    @patch('accounts.views.SMSSendView._send_sms_via_api')
    def test_user_cannot_send_with_unconfigured_sender_id(self, mock_send):
        response = self.client.post(
            '/api/auth/sms/user-send/',
            {
                'transport': 'api',
                'display_sender_id': 'UNAPPROVED-SENDER',
                'recipient_number': '919123456789',
                'message_content': 'An SMS message',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        mock_send.assert_not_called()
        self.assertEqual(UserWallet.objects.get(user=self.user).balance, Decimal('5'))

    @patch('accounts.views.SMSSendView._send_sms_via_api')
    def test_user_send_requires_wallet_credit(self, mock_send):
        UserWallet.objects.filter(user=self.user).update(balance=Decimal('0'), email_validation_balance=Decimal('0'))

        response = self.client.post(
            '/api/auth/sms/user-send/',
            {
                'transport': 'api',
                'display_sender_id': 'ADMIN-SENDER',
                'recipient_number': '919123456789',
                'message_content': 'An SMS message',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 402)
        mock_send.assert_not_called()