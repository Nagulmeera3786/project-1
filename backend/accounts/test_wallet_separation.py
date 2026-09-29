from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import PlatformSetting, UserWallet
from accounts.views import _deduct_email_validation_credits, _deduct_sms_credits


User = get_user_model()


class WalletSeparationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='wallet-user',
            email='wallet-user@example.test',
            password='UserPass123!',
            is_active=True,
        )
        self.admin = User.objects.create_user(
            username='wallet-admin',
            email='wallet-admin@example.test',
            password='AdminPass123!',
            is_active=True,
            is_staff=True,
        )
        self.wallet = UserWallet.objects.create(
            user=self.user,
            balance=Decimal('10'),
            email_validation_balance=Decimal('20'),
        )
        PlatformSetting.objects.create(
            key='email_validation_cost_per_request',
            value='1',
            description='Test wallet separation rate',
        )
        self.client = APIClient()

    def test_sms_debit_does_not_change_email_validation_balance(self):
        _deduct_sms_credits(self.user, 2)
        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.balance, Decimal('8.0000'))
        self.assertEqual(self.wallet.email_validation_balance, Decimal('20.0000'))

    def test_email_validation_debit_does_not_change_sms_balance(self):
        _deduct_email_validation_credits(self.user, 3)
        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.balance, Decimal('10.0000'))
        self.assertEqual(self.wallet.email_validation_balance, Decimal('17.0000'))

    def test_wallet_get_returns_independent_balances_without_mirroring(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/wallet/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['balance']), Decimal('10.0000'))
        self.assertEqual(Decimal(response.data['email_validation_balance']), Decimal('20.0000'))
        self.assertNotIn('provider_message_balance', response.data)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('10.0000'))
        self.assertEqual(self.wallet.email_validation_balance, Decimal('20.0000'))

    def test_admin_adds_credits_to_each_wallet_independently(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'/api/auth/admin/users/{self.user.id}/wallet/credits/',
            {
                'add_message_credits': '5',
                'add_email_validation_credits': '2',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('15.0000'))
        self.assertEqual(self.wallet.email_validation_balance, Decimal('22.0000'))
        self.assertEqual(response.data['message_credits'], '15.0000')
        self.assertEqual(response.data['email_validation_credits'], '22.0000')