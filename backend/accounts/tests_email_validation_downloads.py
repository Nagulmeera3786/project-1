"""Unit tests for the mail validation download endpoints."""

import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import EmailValidationHistory, EmailValidationResult


def _make_user(email, password='DownloadTest@123', **extra):
    return get_user_model().objects.create_user(
        username=email,
        email=email,
        password=password,
        is_active=True,
        **extra,
    )


def _make_history(user, request_id, **overrides):
    defaults = {
        'request_id': request_id,
        'dlr_unique_id': 'DLR1234',
        'source': 'dashboard',
        'status': 'completed',
        'email_count': 2,
        'emails_requested': ['a@example.com', 'b@example.com'],
        'results_summary': {},
        'completed_at': timezone.now(),
    }
    defaults.update(overrides)
    return EmailValidationHistory.objects.create(user=user, **defaults)


def _make_result(history, email, request_id, status_text='OK', valid=True):
    return EmailValidationResult.objects.create(
        history=history,
        email=email,
        request_id=request_id,
        status=status_text,
        status_code='OK',
        classification='Deliverable' if valid else 'Invalid',
        valid_syntax=valid,
        valid_mailbox=valid,
    )


class EmailValidationDownloadViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = _make_user('owner@example.com')
        self.other = _make_user('other@example.com')
        self.staff = _make_user('staff@example.com', is_staff=True)

        self.history = _make_history(self.user, 'BATCH001')
        _make_result(self.history, 'a@example.com', 'MAIL-A')
        _make_result(self.history, 'b@example.com', 'MAIL-B', status_text='Bad', valid=False)

    def _stream_body(self, response):
        return b''.join(response.streaming_content).decode('utf-8')

    def test_requires_authentication(self):
        response = self.client.get('/api/auth/email-validation/history/BATCH001/download/')
        self.assertIn(response.status_code, (401, 403))

    def test_owner_downloads_csv_with_all_rows(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/history/BATCH001/download/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('.csv', response['Content-Disposition'])
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        body = self._stream_body(response)
        self.assertIn('Batch Request ID', body)
        self.assertIn('a@example.com', body)
        self.assertIn('b@example.com', body)
        self.assertIn('MAIL-A', body)
        # one valid + one not valid
        self.assertIn('valid', body)
        self.assertIn('not valid', body)

    def test_individual_mail_request_id_downloads_only_that_mail(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/history/MAIL-A/download/')
        self.assertEqual(response.status_code, 200)
        body = self._stream_body(response)
        self.assertIn('a@example.com', body)
        self.assertNotIn('b@example.com', body)

    def test_other_user_cannot_download(self):
        self.client.force_authenticate(self.other)
        response = self.client.get('/api/auth/email-validation/history/BATCH001/download/')
        self.assertEqual(response.status_code, 404)

    def test_staff_can_download_any_request(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/auth/email-validation/history/BATCH001/download/')
        self.assertEqual(response.status_code, 200)

    def test_unknown_request_returns_404(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/history/NOPE999/download/')
        self.assertEqual(response.status_code, 404)

    def test_json_format(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/history/BATCH001/download/?export_format=json')
        self.assertEqual(response.status_code, 200)
        payload = json.loads(self._stream_body(response))
        self.assertEqual(payload['request_id'], 'BATCH001')
        self.assertEqual(len(payload['results']), 2)
        self.assertEqual(payload['results'][0]['email'], 'a@example.com')

    def test_invalid_format_rejected(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/history/BATCH001/download/?export_format=exe')
        self.assertEqual(response.status_code, 400)

    def test_csv_formula_injection_is_escaped(self):
        _make_result(self.history, '=HYPERLINK("http://evil")@x.com', 'MAIL-E', status_text='=cmd')
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/history/BATCH001/download/')
        body = self._stream_body(response)
        self.assertIn("'=HYPERLINK", body)
        self.assertIn("'=cmd", body)

    def test_legacy_summary_fallback_when_no_detail_rows(self):
        legacy = _make_history(
            self.user,
            'LEGACY01',
            results_summary={
                'results': [
                    {'email': 'old@example.com', 'request_id': 'MAIL-OLD', 'validSyntax': True, 'validMailbox': True, 'status': 'OK', 'statusCode': 'OK', 'classification': 'Deliverable'},
                ],
                'request_items': [
                    {'email': 'old@example.com', 'request_id': 'MAIL-OLD', 'dlr_unique_id': 'DLR1234'},
                ],
            },
        )
        self.assertEqual(legacy.result_rows.count(), 0)
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/history/LEGACY01/download/')
        self.assertEqual(response.status_code, 200)
        body = self._stream_body(response)
        self.assertIn('old@example.com', body)
        self.assertIn('MAIL-OLD', body)


class EmailValidationReportDownloadViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = _make_user('range-owner@example.com')
        self.other = _make_user('range-other@example.com')

        self.in_range = _make_history(self.user, 'RANGE-IN')
        _make_result(self.in_range, 'in@example.com', 'MAIL-IN')

        self.other_user_history = _make_history(self.other, 'RANGE-OTHER')
        _make_result(self.other_user_history, 'someone@example.com', 'MAIL-OTHER')

        self.out_of_range = _make_history(self.user, 'RANGE-OUT')
        _make_result(self.out_of_range, 'out@example.com', 'MAIL-OUT')
        old_timestamp = timezone.now() - timedelta(days=120)
        EmailValidationHistory.objects.filter(id=self.out_of_range.id).update(created_at=old_timestamp)
        self.out_of_range.refresh_from_db()

    def _stream_body(self, response):
        return b''.join(response.streaming_content).decode('utf-8')

    def test_date_range_includes_only_in_range_requests(self):
        self.client.force_authenticate(self.user)
        today = timezone.now().date()
        params = {
            'from_date': (today - timedelta(days=1)).isoformat(),
            'to_date': today.isoformat(),
        }
        response = self.client.get('/api/auth/email-validation/reports/download/', params)
        self.assertEqual(response.status_code, 200)
        body = self._stream_body(response)
        self.assertIn('in@example.com', body)
        self.assertNotIn('out@example.com', body)
        # other users' data must never leak into a normal user's report
        self.assertNotIn('someone@example.com', body)

    def test_default_range_returns_recent_requests(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/reports/download/')
        self.assertEqual(response.status_code, 200)
        body = self._stream_body(response)
        self.assertIn('in@example.com', body)
        self.assertNotIn('out@example.com', body)

    def test_invalid_dates_rejected(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/reports/download/', {'from_date': 'not-a-date'})
        self.assertEqual(response.status_code, 400)
        response = self.client.get(
            '/api/auth/email-validation/reports/download/',
            {'from_date': '2026-08-20', 'to_date': '2026-08-01'},
        )
        self.assertEqual(response.status_code, 400)

    def test_oversized_range_rejected(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            '/api/auth/email-validation/reports/download/',
            {'from_date': '2020-01-01', 'to_date': '2026-08-23'},
        )
        self.assertEqual(response.status_code, 400)

    def test_json_report(self):
        self.client.force_authenticate(self.user)
        today = timezone.now().date()
        response = self.client.get(
            '/api/auth/email-validation/reports/download/',
            {'from_date': (today - timedelta(days=1)).isoformat(), 'to_date': today.isoformat(), 'export_format': 'json'},
        )
        self.assertEqual(response.status_code, 200)
        payload = json.loads(self._stream_body(response))
        self.assertEqual(payload['report'], 'mail-validation')
        emails = [row['email'] for row in payload['results']]
        self.assertIn('in@example.com', emails)
        self.assertNotIn('out@example.com', emails)

    def test_kind_filter(self):
        file_history = _make_history(self.user, 'FILE-HIST', file_name='emails.csv', email_count=5)
        _make_result(file_history, 'filemail@example.com', 'MAIL-FILE')
        self.client.force_authenticate(self.user)
        today = timezone.now().date()
        params = {
            'from_date': (today - timedelta(days=1)).isoformat(),
            'to_date': today.isoformat(),
            'kind': 'file',
        }
        response = self.client.get('/api/auth/email-validation/reports/download/', params)
        body = self._stream_body(response)
        self.assertIn('filemail@example.com', body)
        self.assertNotIn('in@example.com', body)

    def test_non_support_user_cannot_use_all_users(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/auth/email-validation/reports/download/', {'all_users': '1'})
        self.assertEqual(response.status_code, 403)
