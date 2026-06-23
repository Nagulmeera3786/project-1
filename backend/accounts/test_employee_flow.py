from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Employee


User = get_user_model()


class EmployeeAuthFlowTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create(
            username='primary-admin',
            email='primary@example.com',
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )
        self.admin.set_password('AdminPass123!')
        self.admin.save()

    @override_settings(PRIMARY_ADMIN_EMAIL='primary@example.com')
    @patch('accounts.views.send_otp_via_email')
    def test_employee_signup_and_dual_otp_verify(self, mock_send_otp):
        mock_send_otp.return_value = True

        signup_resp = self.client.post(
            '/api/auth/employee/signup/',
            {
                'first_name': 'Emp',
                'email': 'employee@example.com',
                'phone_number': '9999999999',
                'password': 'EmployeePass123!',
                'department': 'Operations',
            },
            format='json',
        )
        self.assertEqual(signup_resp.status_code, status.HTTP_200_OK)

        user = User.objects.get(email='employee@example.com')
        employee = Employee.objects.get(user=user)

        verify_resp = self.client.post(
            '/api/auth/employee/verify-dual-otp/',
            {
                'email': 'employee@example.com',
                'employee_otp': user.otp_code,
                'admin_otp': employee.admin_otp,
            },
            format='json',
        )
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        employee.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertEqual(employee.status, Employee.STATUS_ACTIVE)
        self.assertTrue(employee.employee_otp_verified)
        self.assertTrue(employee.admin_otp_verified)

    def test_employee_login_requires_active_employee_profile(self):
        user = User.objects.create(
            username='employee@example.com',
            email='employee@example.com',
            is_active=True,
        )
        user.set_password('EmployeePass123!')
        user.save()

        Employee.objects.create(user=user, status=Employee.STATUS_PENDING)

        resp = self.client.post(
            '/api/auth/employee/login/',
            {'email': 'employee@example.com', 'password': 'EmployeePass123!'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
