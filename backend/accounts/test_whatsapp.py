from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import SMSTemplate, WhatsAppCampaign, WhatsAppMessage, WhatsAppTemplate
from accounts.serializers import SMSSendSerializer


User = get_user_model()


@override_settings(
    WHATSAPP_API='test-api-key',
    WHATSAPP_API_BASE_URL='https://apiv1.anantya.ai',
)
class WhatsAppApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='whatsapp-test',
            password='StrongPass123!',
            phone_number='919876543210',
        )
        self.client.force_authenticate(self.user)

    @patch('accounts.views.requests.post')
    def test_send_text_calls_provider_and_records_history(self, mock_post):
        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            'DataObj': {'MsgId': 3540, 'MsgStatus': 4},
            'IsSuccess': True,
            'Message': None,
        }
        mock_post.return_value = provider_response

        response = self.client.post(
            '/api/auth/whatsapp/send/',
            {'contactNo': '919876543210', 'contactName': 'Test User', 'msgText': 'Hello Test'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(mock_post.call_args.args[0], 'https://apiv1.anantya.ai/api/Messages/sendtext')
        self.assertEqual(mock_post.call_args.kwargs['headers']['X-Api-Key'], 'test-api-key')
        self.assertEqual(mock_post.call_args.kwargs['json'], {'msgText': 'Hello Test', 'contactNo': '919876543210'})
        message = WhatsAppMessage.objects.get()
        self.assertEqual(message.status, WhatsAppMessage.STATUS_ACCEPTED)
        self.assertEqual(message.provider_message_id, '3540')
        self.assertEqual(message.provider_status_code, 4)
        self.assertEqual(message.delivery_status, WhatsAppMessage.DELIVERY_SENT)

    @patch('accounts.views.requests.post')
    def test_approved_template_message_uses_anantya_template_endpoint(self, mock_post):
        template = WhatsAppTemplate.objects.create(
            name='First contact',
            message_text='Hello {{1}}',
            provider_template_id='123',
            approval_status=WhatsAppTemplate.APPROVAL_APPROVED,
            is_active=True,
            created_by=self.user,
        )
        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            'dataObj': {'id': 249, 'orderNo': 'ANTCAM-249'},
            'isSuccess': True,
        }
        mock_post.return_value = provider_response

        response = self.client.post(
            '/api/auth/whatsapp/send/',
            {
                'contactNo': '919876543210',
                'contactName': 'Test User',
                'templateId': template.id,
                'attributes': ['Taylor'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(mock_post.call_args.args[0], 'https://apiv1.anantya.ai/api/Campaign/SendSingleTemplateMessage')
        self.assertEqual(mock_post.call_args.kwargs['params'], {'templateId': 123})
        fields = mock_post.call_args.kwargs['files']
        self.assertEqual(fields['ContactNo'], (None, '919876543210'))
        self.assertEqual(fields['Attribute1'], (None, 'Taylor'))
        message = WhatsAppMessage.objects.get()
        self.assertEqual(message.provider_campaign_id, '249')
        self.assertEqual(message.provider_message_id, '')

        status_response = Mock()
        status_response.ok = True
        status_response.json.return_value = {
            'dataObj': [{'contactNo': '919876543210', 'messageStatus': 'Delivered'}],
            'isSuccess': True,
        }
        mock_post.return_value = status_response
        status_result = self.client.get(f'/api/auth/whatsapp/messages/{message.id}/status/')
        self.assertEqual(status_result.status_code, 200)
        self.assertEqual(status_result.data['deliveryStatus'], WhatsAppMessage.DELIVERY_DELIVERED)
        self.assertEqual(mock_post.call_args.args[0], 'https://apiv1.anantya.ai/api/Campaign/GetCampaign')
        self.assertEqual(mock_post.call_args.kwargs['params'], {'CampaignId': 249})

    @patch('accounts.views.requests.post')
    def test_http_200_with_provider_business_failure_is_not_accepted(self, mock_post):
        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            'DataObj': None,
            'IsSuccess': False,
            'Message': 'Recipient is not eligible',
        }
        mock_post.return_value = provider_response

        response = self.client.post(
            '/api/auth/whatsapp/send/',
            {'contactNo': '919876543210', 'msgText': 'Hello Test'},
            format='json',
        )

        self.assertEqual(response.status_code, 502)
        message = WhatsAppMessage.objects.get()
        self.assertEqual(message.status, WhatsAppMessage.STATUS_FAILED)
        self.assertEqual(message.error_message, 'Recipient is not eligible')

    @patch('accounts.views.requests.get')
    def test_status_refresh_updates_delivery_state_from_anantya(self, mock_get):
        message = WhatsAppMessage.objects.create(
            user=self.user,
            mode=WhatsAppMessage.MODE_TEXT,
            contact_no='919876543210',
            message_text='Hello Test',
            status=WhatsAppMessage.STATUS_ACCEPTED,
            delivery_status=WhatsAppMessage.DELIVERY_SENT,
            provider_status_code=4,
            provider_message_id='3540',
        )
        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            'DataObj': {'MsgId': 3540, 'MsgStatus': 5},
            'IsSuccess': True,
        }
        mock_get.return_value = provider_response

        response = self.client.get(f'/api/auth/whatsapp/messages/{message.id}/status/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['deliveryStatus'], WhatsAppMessage.DELIVERY_DELIVERED)
        self.assertEqual(response.data['providerStatusCode'], 5)
        mock_get.assert_called_once()
        self.assertEqual(mock_get.call_args.kwargs['params'], {'msgId': 3540})

    @patch('accounts.views.requests.post')
    def test_campaign_status_refresh_updates_delivery_and_failure_rows(self, mock_post):
        campaign = WhatsAppCampaign.objects.create(
            user=self.user,
            template_id='123',
            provider_campaign_id='42',
            recipient_count=2,
            status=WhatsAppCampaign.STATUS_ACCEPTED,
        )
        delivered = WhatsAppMessage.objects.create(
            user=self.user,
            campaign=campaign,
            mode=WhatsAppMessage.MODE_CAMPAIGN,
            contact_no='919876543210',
            template_id='123',
            status=WhatsAppMessage.STATUS_ACCEPTED,
        )
        failed = WhatsAppMessage.objects.create(
            user=self.user,
            campaign=campaign,
            mode=WhatsAppMessage.MODE_CAMPAIGN,
            contact_no='919876543211',
            template_id='123',
            status=WhatsAppMessage.STATUS_ACCEPTED,
        )
        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            'dataObj': [
                {'contactNo': '919876543210', 'messageStatus': 'Delivered'},
                {'contactNo': '919876543211', 'messageStatus': 'Failed', 'failedReason': 'Rejected by Meta'},
            ],
            'isSuccess': True,
            'responseCode': 200,
        }
        mock_post.return_value = provider_response

        response = self.client.get(f'/api/auth/whatsapp/campaigns/{campaign.id}/status/')

        self.assertEqual(response.status_code, 200)
        delivered.refresh_from_db()
        failed.refresh_from_db()
        self.assertEqual(delivered.delivery_status, WhatsAppMessage.DELIVERY_DELIVERED)
        self.assertEqual(failed.delivery_status, WhatsAppMessage.DELIVERY_FAILED)
        self.assertEqual(failed.error_message, 'Rejected by Meta')
        self.assertEqual(response.data['deliveryCounts']['delivered'], 1)
        self.assertEqual(response.data['deliveryCounts']['failed'], 1)
        self.assertEqual(mock_post.call_args.kwargs['params'], {'CampaignId': 42})

    @patch('accounts.views.requests.post')
    def test_campaign_calls_provider_and_records_each_recipient(self, mock_post):
        template = WhatsAppTemplate.objects.create(
            name='Launch',
            message_text='Hello {{name}}',
            provider_template_id='123',
            approval_status=WhatsAppTemplate.APPROVAL_APPROVED,
            is_active=True,
            created_by=self.user,
        )
        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            'dataObj': {'id': 42, 'orderNo': 'ANTCAM-42'},
            'isSuccess': True,
        }
        mock_post.return_value = provider_response

        response = self.client.post(
            '/api/auth/whatsapp/campaigns/send/',
            {
                'campaignName': 'Launch',
                'templateId': str(template.id),
                'contacts': [
                    {'contactName': 'Test User', 'contactNo': '919876543210', 'attribute1': 'Taylor'},
                    {'contactName': '', 'contactNo': '919876543211'},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(mock_post.call_args.args[0], 'https://apiv1.anantya.ai/api/Campaign/SendCampaign')
        self.assertEqual(mock_post.call_args.kwargs['params'], {'templateId': 123})
        provider_contacts = mock_post.call_args.kwargs['json']
        self.assertEqual(provider_contacts[0]['contactName'], 'Test User')
        self.assertEqual(provider_contacts[0]['contactNo'], '919876543210')
        self.assertEqual(provider_contacts[0]['attribute1'], 'Taylor')
        self.assertEqual(provider_contacts[0]['mediaFileName'], '')
        self.assertEqual(provider_contacts[0]['extraParams'], '')
        self.assertEqual(provider_contacts[1]['contactNo'], '919876543211')
        self.assertEqual(provider_contacts[1]['attribute13'], '')
        self.assertEqual(len(provider_contacts), 2)
        campaign = WhatsAppCampaign.objects.get()
        self.assertEqual(campaign.status, WhatsAppCampaign.STATUS_ACCEPTED)
        self.assertEqual(campaign.provider_campaign_id, '42')
        self.assertEqual(campaign.template_id, '123')
        self.assertEqual(campaign.messages.count(), 2)

    def test_user_whatsapp_template_request_starts_pending(self):
        response = self.client.post(
            '/api/auth/whatsapp/templates/',
            {
                'name': 'Requested greeting',
                'category': 'Greeting',
                'message_text': 'Hello there',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        template = WhatsAppTemplate.objects.get()
        self.assertEqual(template.approval_status, WhatsAppTemplate.APPROVAL_PENDING)
        self.assertFalse(template.is_active)

    @patch('accounts.views.requests.post')
    def test_pending_whatsapp_template_cannot_be_used_for_campaign(self, mock_post):
        template = WhatsAppTemplate.objects.create(
            name='Pending template',
            provider_template_id='789',
            approval_status=WhatsAppTemplate.APPROVAL_PENDING,
            is_active=False,
            created_by=self.user,
        )
        response = self.client.post(
            '/api/auth/whatsapp/campaigns/send/',
            {
                'templateId': str(template.id),
                'contacts': [{'contactName': 'Test User', 'contactNo': '919876543210'}],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        mock_post.assert_not_called()
        self.assertFalse(WhatsAppCampaign.objects.exists())

    @patch('accounts.views.requests.post')
    def test_admin_approval_grants_requester_campaign_use(self, mock_post):
        template = WhatsAppTemplate.objects.create(
            name='Requested template',
            provider_template_id='456',
            approval_status=WhatsAppTemplate.APPROVAL_PENDING,
            is_active=False,
            created_by=self.user,
        )
        admin = User.objects.create_user(username='whatsapp-admin', password='StrongPass123!', is_staff=True)
        self.client.force_authenticate(admin)
        review_response = self.client.patch(
            f'/api/auth/whatsapp/templates/{template.id}/',
            {'approval_status': 'approved'},
            format='json',
        )
        self.assertEqual(review_response.status_code, 200)

        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            'dataObj': {'id': 43, 'orderNo': 'ANTCAM-43'},
            'isSuccess': True,
        }
        mock_post.return_value = provider_response
        self.client.force_authenticate(self.user)
        send_response = self.client.post(
            '/api/auth/whatsapp/campaigns/send/',
            {
                'templateId': str(template.id),
                'contacts': [{'contactName': 'Test User', 'contactNo': '919876543210'}],
            },
            format='json',
        )

        self.assertEqual(send_response.status_code, 201)
        self.assertEqual(mock_post.call_args.kwargs['params'], {'templateId': 456})

    def test_user_sms_template_request_starts_pending_and_is_not_sendable(self):
        response = self.client.post(
            '/api/auth/sms/templates/',
            {
                'name': 'Requested SMS',
                'message_content': 'Hello there',
                'sms_type': 'transactional',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        template = SMSTemplate.objects.get()
        self.assertEqual(template.approval_status, SMSTemplate.APPROVAL_PENDING)
        self.assertFalse(template.is_active)

        serializer = SMSSendSerializer(
            data={'template_id': template.id, 'message_content': template.message_content},
            context={'request': type('Request', (), {'user': self.user})()},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('template_id', serializer.errors)

    def test_pending_sms_template_is_rejected_by_free_trial_send(self):
        template = SMSTemplate.objects.create(
            name='Pending SMS',
            message_content='Do not send before approval',
            is_active=False,
            approval_status=SMSTemplate.APPROVAL_PENDING,
            created_by=self.user,
        )

        response = self.client.post(
            '/api/auth/sms/free-trial/send/',
            {
                'template_id': template.id,
                'message_content': template.message_content,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(WHATSAPP_API='')
    @patch('accounts.views.requests.post')
    def test_missing_provider_key_records_failed_attempt_without_calling_provider(self, mock_post):
        response = self.client.post(
            '/api/auth/whatsapp/send/',
            {'contactNo': '919876543210', 'msgText': 'Hello Test'},
            format='json',
        )

        self.assertEqual(response.status_code, 503)
        mock_post.assert_not_called()
        self.assertEqual(WhatsAppMessage.objects.get().status, WhatsAppMessage.STATUS_FAILED)