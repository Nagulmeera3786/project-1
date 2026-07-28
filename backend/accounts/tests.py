from unittest.mock import patch
from unittest.mock import Mock
from io import BytesIO
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient, APITestCase
from accounts.models import FreeTrialVerifiedNumber, SMSMessage, UserWallet, Employee


User = get_user_model()


class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('accounts.views.send_otp_via_email', return_value=True)
    def test_signup_verify_and_login_flow(self, _mock_send_email):
        email = 'authflow@example.com'
        password = 'StrongPass123!'

        signup_response = self.client.post(
            '/api/auth/signup/',
            {
                'first_name': 'Auth User',
                'email': email,
                'phone_number': '9876543210',
                'password': password,
            },
            format='json',
        )
        self.assertEqual(signup_response.status_code, 201)
        self.assertTrue(signup_response.data['requires_otp'])

        user = User.objects.get(email=email)
        self.assertFalse(user.is_active)
        self.assertTrue(user.otp_code)

        verify_response = self.client.post(
            '/api/auth/verify-otp/',
            {'email': email, 'otp': user.otp_code},
            format='json',
        )
        self.assertEqual(verify_response.status_code, 200)
        self.assertIn('access', verify_response.data)
        self.assertIn('refresh', verify_response.data)

        login_response = self.client.post(
            '/api/auth/login/',
            {'email': email, 'password': password},
            format='json',
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)

    @patch('accounts.views.send_otp_via_email', return_value=False)
    def test_signup_returns_email_sent_false_when_mail_fails(self, _mock_send_email):
        signup_response = self.client.post(
            '/api/auth/signup/',
            {
                'first_name': 'Mail Fail',
                'email': 'mailfail@example.com',
                'phone_number': '9876543210',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(signup_response.status_code, 201)
        self.assertEqual(signup_response.data['email_sent'], False)
        self.assertTrue(signup_response.data['requires_otp'])

    @patch('accounts.views.send_otp_via_email', return_value=True)
    def test_signup_normalizes_country_code_phone_number(self, _mock_send_email):
        email = 'countrycode@example.com'
        signup_response = self.client.post(
            '/api/auth/signup/',
            {
                'first_name': 'Country Code',
                'email': email,
                'phone_number': '+91 98765 43210',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(signup_response.status_code, 201)
        user = User.objects.get(email=email)
        self.assertEqual(user.phone_number, '919876543210')

    def test_login_works_with_duplicate_email_records(self):
        email = 'dupe@example.com'

        inactive_user = User.objects.create(
            username='dupe-inactive',
            email=email.lower(),
            first_name='Inactive',
            is_active=False,
        )
        inactive_user.set_password('TempPass123!')
        inactive_user.save()

        active_user = User.objects.create(
            username='dupe-active',
            email=email.upper(),
            first_name='Active',
            is_active=True,
        )
        active_user.set_password('FinalPass123!')
        active_user.save()

        login_response = self.client.post(
            '/api/auth/login/',
            {'email': '  DUPE@example.com  ', 'password': 'FinalPass123!'},
            format='json',
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)

    @override_settings(PRIMARY_ADMIN_EMAIL='admin@example.com')
    @patch('accounts.views.send_otp_via_email')
    def test_primary_admin_login_does_not_require_otp_each_time(self, mock_send_otp):
        user = User.objects.create(
            username='admin-login-user',
            email='admin@example.com',
            first_name='Admin',
            is_active=True,
        )
        user.set_password('AdminPass123!')
        user.save()

        login_response = self.client.post(
            '/api/auth/login/',
            {'email': 'admin@example.com', 'password': 'AdminPass123!'},
            format='json',
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)
        self.assertFalse(bool(login_response.data.get('requires_otp_login')))
        mock_send_otp.assert_not_called()


class SMSSenderIdTests(TestCase):
    def setUp(self):
        from accounts.models import SMSCredential

        self.client = APIClient()
        self.admin_user = User.objects.create(
            username='admin-sms',
            email='adminsms@example.com',
            is_staff=True,
            is_active=True,
        )
        self.admin_user.set_password('AdminPass123!')
        self.admin_user.save()

        self.client.force_authenticate(user=self.admin_user)
        self.credential = SMSCredential.objects.create(
            user='provider-user',
            password='provider-pass',
            sender_ids=['KNOWNID'],
            is_active=True,
        )

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'm-1', 'status': 'sent'})
    def test_manual_sender_id_is_saved_to_dropdown_source(self, _mock_send):
        payload = {
            'display_sender_id': 'NEWMANUALID',
            'message_content': 'Test message',
            'recipient_number': '9876543210',
        }
        response = self.client.post('/api/auth/sms/send/', payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.credential.refresh_from_db()
        self.assertIn('NEWMANUALID', self.credential.sender_ids)

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'm-2', 'status': 'sent'})
    def test_existing_sender_id_is_not_duplicated(self, _mock_send):
        payload = {
            'display_sender_id': 'KNOWNID',
            'message_content': 'Another test message',
            'recipient_number': '9876543210',
        }
        response = self.client.post('/api/auth/sms/send/', payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.credential.refresh_from_db()
        self.assertEqual(self.credential.sender_ids.count('KNOWNID'), 1)

    @patch('accounts.views.requests.post')
    def test_sms_parser_rejects_ambiguous_text_response(self, mock_post):
        first_response = Mock()
        first_response.status_code = 200
        first_response.json.side_effect = ValueError()
        first_response.text = 'Session time out ... Please Login Again....'

        second_response = Mock()
        second_response.status_code = 200
        second_response.json.side_effect = ValueError()
        second_response.text = 'Request received. Processing now.'

        mock_post.side_effect = [first_response, second_response]

        with self.assertRaises(Exception):
            from accounts.views import SMSSendView

            SMSSendView()._send_sms_via_api(
                self.credential.user,
                self.credential.password,
                'KNOWNID',
                '919876543210',
                'Ambiguous response check',
            )

    @patch('accounts.views.requests.post')
    def test_sms_parser_accepts_success_text_response(self, mock_post):
        first_response = Mock()
        first_response.status_code = 200
        first_response.json.side_effect = ValueError()
        first_response.text = 'Session time out ... Please Login Again....'

        second_response = Mock()
        second_response.status_code = 200
        second_response.json.side_effect = ValueError()
        second_response.text = 'Message submitted successfully. MsgId: ABC12345'

        mock_post.side_effect = [first_response, second_response]

        from accounts.views import SMSSendView

        result = SMSSendView()._send_sms_via_api(
            self.credential.user,
            self.credential.password,
            'KNOWNID',
            '919876543210',
            'Success response check',
        )
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(result['message_id'], 'ABC12345')


class SMSSendModesFlowTests(TestCase):
    def setUp(self):
        from accounts.models import SMSCredential, SMSContactGroup, SMSContact

        self.client = APIClient()
        self.admin_user = User.objects.create(
            username='bulk-admin',
            email='bulkadmin@example.com',
            is_staff=True,
            is_active=True,
        )
        self.admin_user.set_password('AdminPass123!')
        self.admin_user.save()

        self.client.force_authenticate(user=self.admin_user)
        SMSCredential.objects.create(
            user='provider-user',
            password='provider-pass',
            sender_ids=['KNOWNID'],
            is_active=True,
        )

        self.group = SMSContactGroup.objects.create(owner=self.admin_user, name='Test Group')
        SMSContact.objects.create(group=self.group, name='A', phone_number='919876543210')
        SMSContact.objects.create(group=self.group, name='B', phone_number='919876543211')

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'single-1', 'status': 'sent'})
    def test_send_single_mode(self, _mock_send):
        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'display_sender_id': 'KNOWNID',
                'message_content': 'Single mode test',
                'sms_type': 'transactional',
                'send_mode': 'single',
                'recipient_number': '9876543210',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('status'), 'sent')

    @patch('accounts.views.SMSSendView._send_sms_via_api')
    def test_send_file_numbers_mode(self, mock_send):
        mock_send.side_effect = [
            {'message_id': 'file-1', 'status': 'sent'},
            {'message_id': 'file-2', 'status': 'sent'},
        ]

        txt_content = b'+919876543210\n+919876543211\n'
        source_file = SimpleUploadedFile('numbers.txt', txt_content, content_type='text/plain')

        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'display_sender_id': 'KNOWNID',
                'message_content': 'File mode test',
                'sms_type': 'transactional',
                'send_mode': 'file_numbers',
                'source_file': source_file,
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('sent_count'), 2)
        self.assertEqual(response.data.get('failed_count'), 0)

    @patch('accounts.views.SMSSendView._send_sms_via_smpp', return_value={'message_id': 'smpp-1', 'status': 'sent'})
    def test_send_single_mode_via_smpp_with_dlt_template(self, mock_send):
        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'transport': 'smpp',
                'smpp_profile': 'dlt',
                'smpp_host': 'smpp.example.com',
                'smpp_port': 2775,
                'smpp_system_id': 'smpp-user',
                'smpp_password': 'smpp-pass',
                'smpp_template_id': 'TPL123',
                'dlt_entity_id': 'ENTITY99',
                'display_sender_id': 'APPROVEDID',
                'message_content': 'Your OTP is 123456',
                'sms_type': 'transactional',
                'send_mode': 'single',
                'recipient_number': '919876543210',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('transport'), 'smpp')
        self.assertEqual((response.data.get('dlt') or {}).get('entity_id'), 'ENTITY99')
        mock_send.assert_called_once()
        smpp_config = mock_send.call_args[0][0]
        self.assertEqual(smpp_config['host'], 'smpp.example.com')
        self.assertEqual(smpp_config['template_id'], 'TPL123')


    @override_settings(SMS_DLT_TEMPLATE_ID='')
    def test_smpp_requires_template_for_dlt_profile(self):
        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'transport': 'smpp',
                'smpp_profile': 'dlt',
                'smpp_host': 'smpp.example.com',
                'smpp_port': 2775,
                'smpp_system_id': 'smpp-user',
                'smpp_password': 'smpp-pass',
                'display_sender_id': 'APPROVEDID',
                'message_content': 'Missing template id',
                'sms_type': 'transactional',
                'send_mode': 'single',
                'recipient_number': '919876543210',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('smpp_template_id', response.data)

    @override_settings(SMS_DLT_ENTITY_ID='')
    def test_smpp_dlt_requires_entity_id_when_not_configured(self):
        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'transport': 'smpp',
                'smpp_profile': 'dlt',
                'smpp_host': 'smpp.example.com',
                'smpp_port': 2775,
                'smpp_system_id': 'smpp-user',
                'smpp_password': 'smpp-pass',
                'smpp_template_id': 'TPL123',
                'display_sender_id': 'APPROVEDID',
                'message_content': 'Missing entity id',
                'sms_type': 'transactional',
                'send_mode': 'single',
                'recipient_number': '919876543210',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('dlt_entity_id', response.data)

    @override_settings(SMS_DLT_TELEMARKETER_ID='')
    def test_smpp_dlt_requires_telemarketer_id_when_not_configured(self):
        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'transport': 'smpp',
                'smpp_profile': 'dlt',
                'smpp_host': 'smpp.example.com',
                'smpp_port': 2775,
                'smpp_system_id': 'smpp-user',
                'smpp_password': 'smpp-pass',
                'smpp_template_id': 'TPL123',
                'dlt_entity_id': 'ENTITY1',
                'display_sender_id': 'APPROVEDID',
                'message_content': 'Missing telemarketer id',
                'sms_type': 'transactional',
                'send_mode': 'single',
                'recipient_number': '919876543210',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('dlt_telemarketer_id', response.data)

    def test_smpp_rejects_scheduled_delivery(self):
        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'transport': 'smpp',
                'smpp_profile': 'standard',
                'smpp_host': 'smpp.example.com',
                'smpp_port': 2775,
                'smpp_system_id': 'smpp-user',
                'smpp_password': 'smpp-pass',
                'display_sender_id': 'TEST',
                'message_content': 'Scheduled smpp',
                'sms_type': 'transactional',
                'send_mode': 'single',
                'recipient_number': '201234567890',
                'delivery_mode': 'scheduled',
                'timezone_name': 'UTC',
                'start_date': '2026-03-20',
                'start_time': '10:00:00',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('delivery_mode', response.data)

    @patch('accounts.views.SMSSendView._send_sms_via_api')
    def test_send_personalized_file_mode(self, mock_send):
        import openpyxl

        mock_send.side_effect = [
            {'message_id': 'pers-1', 'status': 'sent'},
            {'message_id': 'pers-2', 'status': 'sent'},
        ]

        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.append(['Phone', 'Name'])
        sheet.append(['919876543210', 'Alice'])
        sheet.append(['919876543211', 'Bob'])

        stream = BytesIO()
        workbook.save(stream)
        stream.seek(0)
        source_file = SimpleUploadedFile(
            'personalized.xlsx',
            stream.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )

        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'display_sender_id': 'KNOWNID',
                'message_content': 'Hi #2#, your code is ready',
                'sms_type': 'transactional',
                'send_mode': 'personalized_file',
                'source_file': source_file,
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('sent_count'), 2)
        self.assertEqual(response.data.get('failed_count'), 0)


class EmailValidationMediatorTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.primary_admin = User.objects.create(
            username='primary-admin',
            email='primary@example.com',
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        self.primary_admin.set_password('AdminPass123!')
        self.primary_admin.save()

        self.normal_user = User.objects.create(
            username='normal-user',
            email='normal@example.com',
            is_staff=False,
            is_superuser=False,
            is_active=True,
        )
        self.normal_user.set_password('UserPass123!')
        self.normal_user.save()
        UserWallet.objects.create(user=self.normal_user, balance=Decimal('0'), email_validation_balance=Decimal('2.0000'))
        UserWallet.objects.create(user=self.primary_admin, balance=Decimal('0'), email_validation_balance=Decimal('0'))

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._validate_email_with_verifalia')
    @patch('accounts.views._get_email_validation_cost_per_request', return_value=Decimal('1.0000'))
    def test_authenticated_non_admin_can_validate_with_admin_mediator(self, mock_cost, mock_validate):
        mock_validate.return_value = {
            'email': 'user@example.com',
            'validMailbox': True,
            'validSyntax': True,
            'catchAll': False,
            'didYouMean': 'user@example.com',
            'disposable': False,
            'roleBased': False,
            'risk': 'low',
        }

        self.client.force_authenticate(user=self.normal_user)
        response = self.client.post(
            '/api/auth/email-validation/validate/',
            {'email': 'user@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('count'), 1)
        self.assertEqual(response.data.get('wallet_balance'), '1.0000')
        self.assertEqual(response.data.get('results')[0].get('validMailbox'), True)
        self.assertEqual(response.data.get('results')[0].get('validSyntax'), True)
        self.assertEqual(response.data.get('results')[0].get('catchAll'), False)
        self.assertEqual(response.data.get('results')[0].get('didYouMean'), 'user@example.com')
        self.assertEqual(response.data.get('results')[0].get('disposable'), False)
        self.assertEqual(response.data.get('results')[0].get('roleBased'), False)
        self.assertEqual(response.data.get('results')[0].get('risk'), 'low')

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._get_verifalia_admin_credits', return_value=None)
    def test_email_validation_fails_when_primary_admin_credits_are_missing(self, _mock_verifalia_credits):
        self.client.force_authenticate(user=self.primary_admin)
        response = self.client.post(
            '/api/auth/email-validation/validate/',
            {'email': 'user@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn('detail', response.data)

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._validate_email_with_verifalia')
    @patch('accounts.views._get_email_validation_cost_per_request', return_value=Decimal('1.0000'))
    @patch('accounts.views._get_verifalia_admin_credits', return_value=Decimal('25.0000'))
    def test_admin_validation_uses_verifalia_credits_even_if_local_wallet_is_zero(
        self,
        _mock_verifalia_credits,
        _mock_cost,
        mock_validate,
    ):
        mock_validate.return_value = {
            'email': 'admin@example.com',
            'validMailbox': True,
            'validSyntax': True,
            'catchAll': False,
            'didYouMean': 'admin@example.com',
            'disposable': False,
            'roleBased': False,
            'risk': 'low',
        }

        self.client.force_authenticate(user=self.primary_admin)
        response = self.client.post(
            '/api/auth/email-validation/validate/',
            {'email': 'admin@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('count'), 1)
        self.assertEqual(response.data.get('wallet_balance'), '24.0000')

        admin_wallet = UserWallet.objects.get(user=self.primary_admin)
        self.assertEqual(str(admin_wallet.email_validation_balance), '0.0000')

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    def test_email_validation_rejects_when_user_validation_credits_are_zero(self):
        wallet = UserWallet.objects.get(user=self.normal_user)
        wallet.email_validation_balance = Decimal('0')
        wallet.save(update_fields=['email_validation_balance', 'updated_at'])

        self.client.force_authenticate(user=self.normal_user)
        response = self.client.post(
            '/api/auth/email-validation/validate/',
            {'email': 'user@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, 402)
        self.assertIn('No email validation credits available', response.data.get('detail', ''))

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._validate_email_with_verifalia')
    @patch('accounts.views._get_email_validation_cost_per_request', return_value=Decimal('1.0000'))
    def test_validation_history_search_supports_user_id(self, mock_cost, mock_validate):
        mock_validate.return_value = {
            'email': 'user@example.com',
            'validMailbox': True,
            'validSyntax': True,
            'catchAll': False,
            'didYouMean': 'user@example.com',
            'disposable': False,
            'roleBased': False,
            'risk': 'low',
        }

        self.client.force_authenticate(user=self.normal_user)
        validate_response = self.client.post(
            '/api/auth/email-validation/validate/',
            {'email': 'user@example.com'},
            format='json',
        )

        self.assertEqual(validate_response.status_code, 200)
        history_response = self.client.get(f'/api/auth/email-validation/history/?q={self.normal_user.id}')
        self.assertEqual(history_response.status_code, 200)
        self.assertGreaterEqual(len(history_response.data), 1)
        self.assertEqual(history_response.data[0]['user'], self.normal_user.id)

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._validate_email_list_with_verifalia')
    @patch('accounts.views._get_email_validation_cost_per_request', return_value=Decimal('1.0000'))
    def test_api_email_validation_returns_compact_bhisha_response_and_history_attribution(self, _mock_cost, mock_validate_list):
        from accounts.models import UserAPIKey

        api_key = UserAPIKey.objects.create(user=self.normal_user, name='Bhisha Client', key='a' * 64, is_active=True)
        mock_validate_list.return_value = [
            {
                'email': 'yifemat211@fishnone.com',
                'validMailbox': True,
                'validSyntax': True,
                'catchAll': False,
                'didYouMean': 'yifemat211@fishnone.com',
                'disposable': True,
                'roleBased': False,
                'risky': True,
                'risk': 'low',
                'providerMessageId': 'verifalia-job-1',
                'summary': 'ignored',
                'report': 'ignored',
                'status': 'High-risk email type',
                'statusCode': 'DomainIsWellKnownDea',
                'classification': 'Risky',
                'failure_reason': 'High-risk email type',
            }
        ]

        response = self.client.post(
            '/api/auth/email-validation/api/validate/',
            {
                'user_id': self.normal_user.id,
                'password': 'UserPass123!',
                'api_key': api_key.key,
                'email': 'yifemat211@fishnone.com',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('count'), 1)
        self.assertEqual(response.data.get('wallet_balance'), '1.0000')
        self.assertNotIn('simple_results', response.data)
        self.assertEqual(response.data['results'][0], {
            'email': 'yifemat211@fishnone.com',
            'valid_inbox': False,
            'valid_syntax': True,
            'disposable': True,
            'role_based': False,
            'catch_all': False,
            'risk_factors': 'None Detected',
            'raw_status_details': 'do_not_mail (disposable)',
            'is_free_domain': True,
        })
        self.assertEqual(response.data['history']['user_email'], 'normal@example.com')
        self.assertEqual(response.data['history']['api_key_name'], 'Bhisha Client')

        history = self.normal_user.email_validations.latest('created_at')
        self.assertEqual(history.source, 'api')
        self.assertEqual(history.api_key_id, api_key.id)

    def test_compact_result_prefers_verifalia_success_deliverable_over_conflicting_flags(self):
        from accounts.views import _build_bhisha_api_validation_result, _build_validation_result_from_verifalia

        entry = {
            'email': 'mrmeera786@gmail.com',
            'validSyntax': False,
            'validMailbox': True,
            'disposable': False,
            'roleBased': False,
            'catchAll': False,
            'statusCode': 'Success',
            'classification': 'Deliverable',
            'status': 'Valid email, with no high-risk factors detected: safe to send mail.',
            'summary': 'Valid email, with no high-risk factors detected: safe to send mail.',
            'report': (
                'Syntax validation\n'
                ' The address is valid according to syntax rules.\n\n'
                'Mailbox validation\n'
                ' The mail exchanger responsible for the email address domain can correctly receive messages sent to the email address being tested.'
            ),
        }

        result = _build_validation_result_from_verifalia(
            'mrmeera786@gmail.com',
            entry,
            {},
            provider_message_id='provider-job-1',
            provider_status_text='Completed',
        )
        compact = _build_bhisha_api_validation_result(result)

        self.assertEqual(compact['valid_syntax'], True)
        self.assertEqual(compact['valid_inbox'], True)
        self.assertEqual(compact['risk_factors'], 'None Detected')
        self.assertEqual(compact['raw_status_details'], 'safe_to_mail')

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com', EMAIL_VALIDATION_MAX_EMAILS_PER_REQUEST=5000)
    @patch('accounts.views._validate_email_batch_with_verifalia')
    def test_validate_email_list_batches_large_requests(self, mock_batch_validate):
        mock_batch_validate.side_effect = lambda batch: [
            {
                'email': email,
                'validMailbox': True,
                'validSyntax': True,
                'catchAll': False,
                'didYouMean': email,
                'disposable': False,
                'roleBased': False,
                'risky': False,
                'risk': 'low',
                'providerMessageId': 'batch-job',
                'summary': '',
                'report': '',
                'status': 'Validation completed.',
                'statusCode': 'Success',
                'classification': 'Deliverable',
                'failure_reason': '',
            }
            for email in batch
        ]

        from accounts.views import _validate_email_list_with_verifalia

        emails = [f'user{idx}@example.com' for idx in range(205)]
        results = _validate_email_list_with_verifalia(emails)

        self.assertEqual(len(results), 205)
        self.assertEqual(mock_batch_validate.call_count, 2)
        self.assertEqual(len(mock_batch_validate.call_args_list[0].args[0]), 200)
        self.assertEqual(len(mock_batch_validate.call_args_list[1].args[0]), 5)

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com', EMAIL_VALIDATION_MAX_EMAILS_PER_REQUEST=5000)
    def test_collect_validation_emails_accepts_large_file_limits(self):
        from accounts.views import _collect_validation_emails

        source_file = SimpleUploadedFile(
            'bulk.txt',
            b'user1@example.com\nuser2@example.com\n',
            content_type='text/plain',
        )

        request = Mock()
        request.data = {}
        request.FILES = {'source_file': source_file}

        emails, file_name = _collect_validation_emails(request)

        self.assertEqual(emails, ['user1@example.com', 'user2@example.com'])
        self.assertEqual(file_name, 'bulk.txt')

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    def test_admin_can_add_wallet_credits_manually(self):
        self.client.force_authenticate(user=self.primary_admin)
        response = self.client.patch(
            f'/api/auth/admin/users/{self.normal_user.id}/wallet/credits/',
            {
                'add_message_credits': '15.5',
                'add_email_validation_credits': '3.25',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message_credits'], '15.5000')
        self.assertEqual(response.data['email_validation_credits'], '5.2500')

        wallet = UserWallet.objects.get(user=self.normal_user)
        self.assertEqual(str(wallet.balance), '15.5000')
        self.assertEqual(str(wallet.email_validation_balance), '5.2500')

    def test_normalize_email_validation_flags_extracts_expected_fields(self):
        from accounts.views import _normalize_email_validation_flags

        quality_info = {'quality': 'deliverable', 'is_deliverable': True, 'is_risky': False}
        entry = {
            'isValidSyntax': True,
            'isRoleAccount': True,
            'isDisposableEmailAddress': False,
            'isCatchAll': True,
            'suggestedEmailAddress': 'info@example.com',
            'risk': 'medium',
            'riskScore': 42,
        }

        mapped = _normalize_email_validation_flags('user@example.com', entry, quality_info)

        self.assertTrue(mapped.get('validSyntax'))
        self.assertTrue(mapped.get('validMailbox'))
        self.assertTrue(mapped.get('catchAll'))
        self.assertEqual(mapped.get('didYouMean'), 'info@example.com')
        self.assertFalse(mapped.get('disposable'))
        self.assertTrue(mapped.get('roleBased'))
        self.assertEqual(mapped.get('domain'), 'example.com')
        self.assertTrue(mapped.get('risky'))
        self.assertEqual(mapped.get('risk'), 'medium')

    def test_verifalia_style_report_includes_expected_sections(self):
        from accounts.views import _build_verifalia_style_report

        normalized_flags = {
            'email': 'mrm53451@gmail.com',
            'domain': 'gmail.com',
            'validMailbox': True,
            'validSyntax': True,
            'catchAll': False,
            'didYouMean': '',
            'disposable': False,
            'roleBased': False,
            'risky': False,
            'risk': 'low',
        }
        quality_info = {'classification': 'Deliverable', 'quality': 'deliverable', 'is_deliverable': True, 'is_risky': False}

        report = _build_verifalia_style_report(normalized_flags, quality_info)

        self.assertIn('#### Validation summary', report['summary'])
        self.assertIn('Input data:**mrm53451@gmail.com**', report['summary'])
        self.assertIn('Classification:Deliverable', report['summary'])
        self.assertIn('Valid email, with no high-risk factors detected: safe to send mail.', report['summary'])
        self.assertIn('#### Validation report', report['report'])
        self.assertIn('Syntax validation', report['report'])
        self.assertIn('Mailbox validation', report['report'])
        self.assertIn('Catch-all mail exchanger validation', report['report'])

    def test_hmil_domain_is_detected_as_hotmail_typo(self):
        from accounts.views import _detect_popular_domain_typo, _validate_email_with_own_system

        self.assertEqual(_detect_popular_domain_typo('hmil.com'), 'hotmail.com')

        result = _validate_email_with_own_system('user@hmil.com')

        self.assertFalse(result.get('validSyntax'))
        self.assertFalse(result.get('validMailbox'))
        self.assertEqual(result.get('statusCode'), 'INVALID_SYNTAX_DOMAIN_TYPO')
        self.assertIn('hotmail.com', str(result.get('didYouMean') or ''))

    def test_nested_verifalia_payload_extracts_risky_disposable_fields(self):
        from accounts.views import _extract_verifalia_entry, _normalize_email_validation_flags

        payload = {
            'overview': {'status': 'Completed'},
            'entries': [
                {
                    'inputData': 'patogow577@lidugw.com',
                    'classification': 'Risky',
                    'status': 'High-risk email type',
                    'statusCode': 'DomainIsWellKnownDea',
                    'details': {
                        'isValidSyntax': True,
                        'isValidMailbox': True,
                        'isRoleAccount': False,
                    },
                }
            ],
        }

        entry = _extract_verifalia_entry(payload)
        quality_info = {
            'quality': 'risky',
            'is_deliverable': False,
            'is_risky': True,
            'classification': 'Risky',
            'status_text': 'High-risk email type: disposable provider',
            'status_code': 'DomainIsWellKnownDea',
        }

        mapped = _normalize_email_validation_flags('patogow577@lidugw.com', entry, quality_info)

        self.assertTrue(mapped.get('validSyntax'))
        self.assertTrue(mapped.get('validMailbox'))
        self.assertTrue(mapped.get('disposable'))
        self.assertEqual(mapped.get('risk'), 'high')

    def test_extract_verifalia_entry_prefers_richer_result_entry(self):
        from accounts.views import _extract_verifalia_entry

        payload = {
            'entries': [
                {'inputData': 'patogow577@lidugw.com'},
            ],
            'result': {
                'entries': [
                    {
                        'inputData': 'patogow577@lidugw.com',
                        'classification': 'Risky',
                        'statusCode': 'DomainIsWellKnownDea',
                        'details': {
                            'isDisposableEmailAddress': True,
                            'isValidSyntax': True,
                            'isValidMailbox': True,
                        },
                    }
                ]
            },
        }

        entry = _extract_verifalia_entry(payload)

        self.assertEqual(entry.get('classification'), 'Risky')
        self.assertEqual(entry.get('statusCode'), 'DomainIsWellKnownDea')
        self.assertTrue(entry.get('details', {}).get('isDisposableEmailAddress'))

    def test_status_code_and_disposable_are_derived_from_nested_status(self):
        from accounts.views import _normalize_email_validation_flags, _extract_verifalia_status_code

        entry = {
            'inputData': 'patogow577@lidugw.com',
            'classification': 'Risky',
            'status': {
                'code': 'DomainIsWellKnownDea',
                'description': 'High-risk email type: disposable provider',
            },
            'details': {
                'isValidSyntax': True,
                'isValidMailbox': True,
            },
        }
        payload = {'entries': [entry]}

        status_code = _extract_verifalia_status_code(entry, payload)
        quality_info = {
            'quality': 'risky',
            'is_deliverable': False,
            'is_risky': True,
            'classification': 'Risky',
            'status_text': 'High-risk email type: disposable provider',
            'status_code': status_code,
        }

        mapped = _normalize_email_validation_flags('patogow577@lidugw.com', entry, quality_info)

        self.assertEqual(status_code, 'DomainIsWellKnownDea')
        self.assertTrue(mapped.get('disposable'))

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._get_verifalia_admin_credits', return_value=123.4567)
    def test_admin_wallet_endpoint_includes_verifalia_credits(self, mock_verifalia_credits):
        self.client.force_authenticate(user=self.primary_admin)

        response = self.client.get('/api/auth/wallet/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('balance', response.data)
        self.assertEqual(response.data.get('verifalia_credits'), '123.4567')
        mock_verifalia_credits.assert_called_once()

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._get_verifalia_admin_credits', return_value=77.0000)
    def test_non_primary_admin_wallet_endpoint_includes_verifalia_credits(self, mock_verifalia_credits):
        secondary_admin = User.objects.create(
            username='secondary-admin',
            email='secondary@example.com',
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        secondary_admin.set_password('AdminPass123!')
        secondary_admin.save()

        self.client.force_authenticate(user=secondary_admin)

        response = self.client.get('/api/auth/wallet/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('verifalia_credits'), '77.0')
        mock_verifalia_credits.assert_called_once()

class FreeTrialFlowTests(TestCase):
    def setUp(self):
        from accounts.models import SMSCredential

        self.client = APIClient()
        self.admin_user = User.objects.create(
            username='admin-mediater',
            email='admin-mediater@example.com',
            is_staff=True,
            is_active=True,
        )
        self.admin_user.set_password('AdminPass123!')
        self.admin_user.save()

        self.user = User.objects.create(
            username='trial-user',
            email='trial@example.com',
            is_staff=False,
            is_active=True,
            phone_number='919876543210',
        )
        self.user.set_password('TrialPass123!')
        self.user.free_trial_sender_id = 'TRIAL'
        self.user.save()
        self.client.force_authenticate(user=self.user)

        SMSCredential.objects.create(
            user='provider-user',
            password='provider-pass',
            sender_ids=['TRIAL'],
            free_trial_default_sender_id='TRIAL',
            is_active=True,
        )

    def test_free_trial_send_otp_is_disabled(self):
        send_otp_response = self.client.post(
            '/api/auth/sms/free-trial/send-otp/',
            {'recipient_number': '9876543210'},
            format='json',
        )
        self.assertEqual(send_otp_response.status_code, 400)
        self.assertEqual(send_otp_response.data.get('otp_required'), False)

    def test_free_trial_verify_returns_signup_number_without_otp(self):
        verify_response = self.client.post(
            '/api/auth/sms/free-trial/verify-otp/',
            {'recipient_number': '9123456789', 'otp': '123456'},
            format='json',
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.data.get('verified'))
        self.assertEqual(verify_response.data.get('verified_numbers'), ['919876543210'])

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'trial-latest-1', 'status': 'sent'})
    def test_free_trial_uses_latest_active_sms_credentials(self, mock_send):
        from accounts.models import SMSCredential

        SMSCredential.objects.create(
            user='old-user',
            password='old-pass',
            sender_ids=['OLDID'],
            free_trial_default_sender_id='OLDID',
            is_active=True,
        )
        latest_cred = SMSCredential.objects.create(
            user='latest-user',
            password='latest-pass',
            sender_ids=['LATESTID'],
            free_trial_default_sender_id='LATESTID',
            is_active=True,
        )

        response = self.client.post(
            '/api/auth/sms/free-trial/send/',
            {'recipient_number': '1111111111', 'message_content': 'Hello latest sender'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(SMSCredential.objects.filter(id=latest_cred.id, is_active=True).exists())
        mock_send.assert_called_once()
        send_args = mock_send.call_args[0]
        self.assertEqual(send_args[0], 'latest-user')
        self.assertEqual(send_args[1], 'latest-pass')
        self.assertEqual(send_args[2], 'LATESTID')
        self.assertEqual(send_args[3], '919876543210')
        self.assertEqual(send_args[4], 'Hello latest sender')

    @patch('accounts.views.SMSSendView._send_sms_via_api')
    def test_free_trial_limit_is_three_messages(self, mock_send):
        mock_send.side_effect = [
            {'message_id': 'trial-1', 'status': 'sent'},
            {'message_id': 'trial-2', 'status': 'sent'},
            {'message_id': 'trial-3', 'status': 'sent'},
        ]

        for _ in range(3):
            response = self.client.post(
                '/api/auth/sms/free-trial/send/',
                {
                    'recipient_number': '1234567890',
                    'display_sender_id': 'TRIAL',
                    'message_content': 'Hello from trial',
                },
                format='json',
            )
            self.assertEqual(response.status_code, 201)

        blocked_response = self.client.post(
            '/api/auth/sms/free-trial/send/',
            {
                'recipient_number': '1234567890',
                'display_sender_id': 'TRIAL',
                'message_content': 'Should be blocked',
            },
            format='json',
        )
        self.assertEqual(blocked_response.status_code, 400)
        self.assertTrue(blocked_response.data.get('free_trial_complete'))

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'trial-admin-1', 'status': 'sent'})
    def test_free_trial_sms_uses_admin_provider_credentials_and_signup_number(self, mock_send):
        response = self.client.post(
            '/api/auth/sms/free-trial/send/',
            {
                'recipient_number': '919988776655',
                'message_content': 'Hello from free trial',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        mock_send.assert_called_once_with(
            'provider-user',
            'provider-pass',
            'TRIAL',
            '919876543210',
            'Hello from free trial',
        )

        sms_log = SMSMessage.objects.filter(
            send_mode='free_trial',
            recipient_number='919876543210',
            recipient_user=self.user,
        ).order_by('-id').first()
        self.assertIsNotNone(sms_log)
        self.assertEqual(sms_log.sender_id, self.user.id)

        user_history = self.client.get('/api/auth/sms/messages/')
        self.assertEqual(user_history.status_code, 200)
        self.assertTrue(any(item['id'] == sms_log.id for item in user_history.data))


class SupportReadAccessTests(APITestCase):
    def setUp(self):
        self.primary_admin = User.objects.create(
            username='primary-admin',
            email='primary@example.com',
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        self.primary_admin.set_password('AdminPass123!')
        self.primary_admin.save()

        self.support_user = User.objects.create(
            username='support-user',
            email='support@example.com',
            is_staff=False,
            is_superuser=False,
            is_active=True,
        )
        self.support_user.set_password('SupportPass123!')
        self.support_user.save()
        Employee.objects.create(user=self.support_user, status=Employee.STATUS_ACTIVE, department='Support')

        UserWallet.objects.create(user=self.support_user, balance=Decimal('0'), email_validation_balance=Decimal('0'))
        UserWallet.objects.create(user=self.primary_admin, balance=Decimal('0'), email_validation_balance=Decimal('0'))

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views._get_verifalia_admin_credits', return_value=123.4567)
    def test_support_user_can_read_all_users_wallet_and_messages_but_not_edit_permissions(self, _mock_credits):
        self.client.force_authenticate(user=self.support_user)

        users_response = self.client.get('/api/auth/admin/users/')
        self.assertEqual(users_response.status_code, 200)
        self.assertGreaterEqual(len(users_response.data), 2)

        wallet_response = self.client.get('/api/auth/wallet/')
        self.assertEqual(wallet_response.status_code, 200)
        self.assertNotIn('verifalia_credits', wallet_response.data)

        messages_response = self.client.get('/api/auth/sms/messages/')
        self.assertEqual(messages_response.status_code, 200)

        edit_response = self.client.patch(
            f'/api/auth/admin/users/{self.primary_admin.id}/permissions/',
            {'is_staff': False},
            format='json',
        )
        self.assertEqual(edit_response.status_code, 403)

