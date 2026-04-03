from unittest.mock import patch
from unittest.mock import Mock
from io import BytesIO

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from accounts.models import FreeTrialVerifiedNumber, SMSMessage


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
        mock_send.assert_called_once()
        smpp_config = mock_send.call_args[0][0]
        self.assertEqual(smpp_config['host'], 'smpp.example.com')
        self.assertEqual(smpp_config['template_id'], 'TPL123')

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

    @patch('accounts.views.SMSSendView._send_sms_via_api')
    def test_send_group_mode(self, mock_send):
        mock_send.side_effect = [
            {'message_id': 'group-1', 'status': 'sent'},
            {'message_id': 'group-2', 'status': 'sent'},
        ]

        response = self.client.post(
            '/api/auth/sms/send/',
            {
                'display_sender_id': 'KNOWNID',
                'message_content': 'Group mode test',
                'sms_type': 'transactional',
                'send_mode': 'group',
                'group_id': self.group.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('sent_count'), 2)
        self.assertEqual(response.data.get('failed_count'), 0)


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

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'otp-1', 'status': 'sent'})
    def test_free_trial_send_otp_and_verify(self, _mock_send):
        send_otp_response = self.client.post(
            '/api/auth/sms/free-trial/send-otp/',
            {'recipient_number': '9876543210'},
            format='json',
        )
        self.assertEqual(send_otp_response.status_code, 200)
        self.assertTrue(send_otp_response.data.get('otp_sent'))
        self.assertEqual(send_otp_response.data.get('provider_message_id'), 'otp-1')
        self.assertEqual(send_otp_response.data.get('delivery_status'), 'sent')

        otp_log = SMSMessage.objects.filter(
            recipient_user=self.user,
            recipient_number='9876543210',
            batch_reference=f'free-trial-otp-{self.user.id}',
        ).order_by('-id').first()
        self.assertIsNotNone(otp_log)
        self.assertEqual(otp_log.sender_id, self.admin_user.id)
        self.assertEqual(otp_log.status, 'sent')

        record = FreeTrialVerifiedNumber.objects.get(owner=self.user, phone_number='9876543210')
        verify_response = self.client.post(
            '/api/auth/sms/free-trial/verify-otp/',
            {'recipient_number': '9876543210', 'otp': record.otp_code},
            format='json',
        )
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.data.get('verified'))
        self.assertIn('9876543210', verify_response.data.get('verified_numbers', []))

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'otp-no-auth-1', 'status': 'sent'})
    def test_free_trial_verify_otp_allows_missing_auth_header_fallback(self, _mock_send):
        send_otp_response = self.client.post(
            '/api/auth/sms/free-trial/send-otp/',
            {'recipient_number': '9123456789'},
            format='json',
        )
        self.assertEqual(send_otp_response.status_code, 200)

        record = FreeTrialVerifiedNumber.objects.get(owner=self.user, phone_number='9123456789')
        unauth_client = APIClient()
        verify_response = unauth_client.post(
            '/api/auth/sms/free-trial/verify-otp/',
            {'recipient_number': '9123456789', 'otp': record.otp_code},
            format='json',
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.data.get('verified'))
        self.assertIn('9123456789', verify_response.data.get('verified_numbers', []))

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'otp-auto-1', 'status': 'sent'})
    def test_free_trial_otp_works_without_admin_selected_default_sender(self, mock_send):
        from accounts.models import SMSCredential

        SMSCredential.objects.filter(is_active=True).update(
            sender_ids=['AUTO1', 'AUTO2'],
            free_trial_default_sender_id='',
        )
        self.user.free_trial_sender_id = None
        self.user.save(update_fields=['free_trial_sender_id'])

        send_otp_response = self.client.post(
            '/api/auth/sms/free-trial/send-otp/',
            {'recipient_number': '9988776655'},
            format='json',
        )

        self.assertEqual(send_otp_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.free_trial_sender_id, 'AUTO1')
        mock_send.assert_called_once()
        self.assertEqual(mock_send.call_args[0][2], 'AUTO1')

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'otp-latest-1', 'status': 'sent'})
    def test_free_trial_otp_uses_latest_active_sms_credentials(self, mock_send):
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

        send_otp_response = self.client.post(
            '/api/auth/sms/free-trial/send-otp/',
            {'recipient_number': '9876543210'},
            format='json',
        )

        self.assertEqual(send_otp_response.status_code, 200)
        self.assertTrue(SMSCredential.objects.filter(id=latest_cred.id, is_active=True).exists())
        mock_send.assert_called_once()
        send_args = mock_send.call_args[0]
        self.assertEqual(send_args[0], 'latest-user')
        self.assertEqual(send_args[1], 'latest-pass')
        self.assertEqual(send_args[2], 'LATESTID')
        self.assertEqual(send_args[3], '9876543210')
        self.assertIn('Your ABC free trial OTP is', send_args[4])

    @patch('accounts.views.SMSSendView._send_sms_via_api')
    def test_free_trial_limit_is_three_messages(self, mock_send):
        mock_send.side_effect = [
            {'message_id': 'trial-1', 'status': 'sent'},
            {'message_id': 'trial-2', 'status': 'sent'},
            {'message_id': 'trial-3', 'status': 'sent'},
        ]

        FreeTrialVerifiedNumber.objects.create(
            owner=self.user,
            phone_number='9876543210',
            is_verified=True,
        )

        for _ in range(3):
            response = self.client.post(
                '/api/auth/sms/free-trial/send/',
                {
                    'recipient_number': '9876543210',
                    'display_sender_id': 'TRIAL',
                    'message_content': 'Hello from trial',
                },
                format='json',
            )
            self.assertEqual(response.status_code, 201)

        blocked_response = self.client.post(
            '/api/auth/sms/free-trial/send/',
            {
                'recipient_number': '9876543210',
                'display_sender_id': 'TRIAL',
                'message_content': 'Should be blocked',
            },
            format='json',
        )
        self.assertEqual(blocked_response.status_code, 400)
        self.assertTrue(blocked_response.data.get('free_trial_complete'))

    @patch('accounts.views.SMSSendView._send_sms_via_api', return_value={'message_id': 'trial-admin-1', 'status': 'sent'})
    def test_free_trial_sms_uses_admin_provider_credentials_and_entered_number(self, mock_send):
        FreeTrialVerifiedNumber.objects.create(
            owner=self.user,
            phone_number='919988776655',
            is_verified=True,
        )

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
            '919988776655',
            'Hello from free trial',
        )

        sms_log = SMSMessage.objects.filter(
            send_mode='free_trial',
            recipient_number='919988776655',
            recipient_user=self.user,
        ).order_by('-id').first()
        self.assertIsNotNone(sms_log)
        self.assertEqual(sms_log.sender_id, self.admin_user.id)

        admin_client = APIClient()
        admin_client.force_authenticate(user=self.admin_user)
        admin_history = admin_client.get('/api/auth/sms/messages/')
        self.assertEqual(admin_history.status_code, 200)
        self.assertTrue(any(item['id'] == sms_log.id for item in admin_history.data))

        user_history = self.client.get('/api/auth/sms/messages/')
        self.assertEqual(user_history.status_code, 200)
        self.assertTrue(any(item['id'] == sms_log.id for item in user_history.data))
