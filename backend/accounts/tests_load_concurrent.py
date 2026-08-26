"""Concurrency / load tests for the mail validation platform.

Simulates:
  A) many users working at the same time (login -> validate -> status -> downloads)
  B) one user firing many requests simultaneously
  C) a burst of concurrent large CSV downloads (5000-row request)
  D) a mixed flood of validation submits + downloads at the same time

Run with:
    set RUN_LOAD_TESTS=1 && python manage.py test accounts.tests_load_concurrent -v 2

The live server is Django's threaded test server; SQLite is used for the test
DB (see USE_SQLITE_FOR_TESTS) with a raised busy timeout. Validation runs in
syntax-only mode so results measure application concurrency, not DNS/SMTP.
"""

import os
import re
import statistics
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import timedelta
from unittest import skipUnless

import requests
from django.contrib.auth import get_user_model
from django.test import LiveServerTestCase, override_settings
from django.utils import timezone

from .models import EmailValidationHistory, EmailValidationResult, UserWallet

USER_COUNT = 10
BIG_REQUEST_ID = 'BIGREQ001'
BIG_REQUEST_ROWS = 5000
PASSWORD = 'LoadTest@123'

REST_FRAMEWORK_OVERRIDE = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Effectively disable throttling so we measure raw capacity, not limits.
    'DEFAULT_THROTTLE_RATES': {'email_validation_download': '100000/min'},
}


def _percentile(sorted_values, percentile):
    if not sorted_values:
        return 0.0
    index = min(len(sorted_values) - 1, max(0, int(round((percentile / 100.0) * (len(sorted_values) - 1)))))
    return sorted_values[index]


@skipUnless(os.environ.get('RUN_LOAD_TESTS') == '1', 'Load test: set RUN_LOAD_TESTS=1 to run')
@override_settings(
    EMAIL_VALIDATION_SYNTAX_ONLY_MODE='true',
    EMAIL_VALIDATION_ASYNC_THRESHOLD=1000000,
    EMAIL_VALIDATION_PROGRESS_UPDATE_INTERVAL=100,
    REST_FRAMEWORK=REST_FRAMEWORK_OVERRIDE,
)
class ConcurrentLoadTests(LiveServerTestCase):
    """End-to-end concurrency tests over real HTTP against the threaded test server."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._seed_data()

    @classmethod
    def _seed_data(cls):
        """Create users/requests if absent. TransactionTestCase flushes tables
        between tests, so every scenario calls this before it starts."""
        User = get_user_model()
        if User.objects.filter(email='bulkowner@example.com').exists():
            return
        cls.user_credentials = []
        for index in range(USER_COUNT):
            email = f'loaduser{index}@example.com'
            user = User.objects.create_user(username=email, email=email, password=PASSWORD, is_active=True)
            UserWallet.objects.create(user=user, balance=100000, email_validation_balance=100000)
            cls.user_credentials.append(email)

        bulk_email = 'bulkowner@example.com'
        bulk_user = User.objects.create_user(username=bulk_email, email=bulk_email, password=PASSWORD, is_active=True)
        UserWallet.objects.create(user=bulk_user, balance=100000, email_validation_balance=100000)
        cls.user_credentials.append(bulk_email)
        cls.bulk_user_email = bulk_email

        # Each load user gets a pre-seeded completed request (500 rows) so
        # per-request download traffic can be exercised per owner.
        for index in range(USER_COUNT):
            owner = User.objects.get(email=cls.user_credentials[index])
            history = EmailValidationHistory.objects.create(
                user=owner,
                request_id=f'LOADREQ{index}',
                dlr_unique_id='DLRLOAD1',
                source='dashboard',
                status='completed',
                email_count=500,
                emails_requested=[],
                results_summary={'results_compacted': True, 'results_total_count': 500},
                completed_at=timezone.now(),
            )
            EmailValidationResult.objects.bulk_create(
                [
                    EmailValidationResult(
                        history=history,
                        email=f'u{index}row{row}@example.com',
                        request_id=f'LOADREQ{index}-{row}',
                        status='Valid (syntax only)',
                        status_code='SYNTAX_VALID_ONLY',
                        classification='Deliverable',
                        valid_syntax=True,
                        valid_mailbox=True,
                    )
                    for row in range(500)
                ],
                batch_size=1000,
            )

        big_history = EmailValidationHistory.objects.create(
            user=bulk_user,
            request_id=BIG_REQUEST_ID,
            dlr_unique_id='DLRBIG1',
            source='dashboard',
            status='completed',
            email_count=BIG_REQUEST_ROWS,
            emails_requested=[],
            results_summary={'results_compacted': True, 'results_total_count': BIG_REQUEST_ROWS},
            completed_at=timezone.now(),
        )
        EmailValidationResult.objects.bulk_create(
            [
                EmailValidationResult(
                    history=big_history,
                    email=f'bulkrow{i}@example.com',
                    request_id=f'{BIG_REQUEST_ID}-{i}',
                    status='Valid (syntax only)',
                    status_code='SYNTAX_VALID_ONLY',
                    classification='Deliverable',
                    valid_syntax=True,
                    valid_mailbox=True,
                )
                for i in range(BIG_REQUEST_ROWS)
            ],
            batch_size=1000,
        )

    # ------------------------------------------------------------------ utils

    def _login(self, session, email):
        response = session.post(
            f'{self.live_server_url}/api/auth/login/',
            json={'email': email, 'password': PASSWORD},
            timeout=60,
        )
        response.raise_for_status()
        token = response.json().get('access')
        if not token:
            raise RuntimeError('login did not return an access token')
        session.headers.update({'Authorization': f'Bearer {token}'})

    def _new_session(self, email):
        session = requests.Session()
        self._login(session, email)
        return session

    def _timed(self, label, fn):
        started = time.perf_counter()
        try:
            response = fn()
            content_length = len(response.content or b'')
            ok = 200 <= response.status_code < 300
            detail = '' if ok else f'HTTP {response.status_code}'
            if not ok:
                # In DEBUG the server returns a technical error page; keep a
                # snippet so the failure report shows the server exception.
                body_text = (response.text or '')[:4000]
                match = re.search(
                    r'(?:Exception Type|first-exception|traceback)[\s\S]{0,600}',
                    body_text,
                )
                summary = ''
                if match:
                    summary = re.sub(r'\s+', ' ', match.group(0))[:300]
                if not summary:
                    summary = re.sub(r'\s+', ' ', body_text)[:200]
                detail = f'{detail} | {summary}'
            response.close()
        except Exception as exc:  # noqa: BLE001 - record any client-side failure
            content_length = 0
            ok = False
            detail = f'{type(exc).__name__}: {exc}'[:200]
        return {
            'label': label,
            'ok': ok,
            'detail': detail,
            'latency': time.perf_counter() - started,
            'bytes': content_length,
        }

    def _run_concurrently(self, tasks, max_workers):
        results = []
        started = time.perf_counter()
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(task) for task in tasks]
            for future in as_completed(futures):
                results.append(future.result())
        wall_time = time.perf_counter() - started
        return results, wall_time

    def _report(self, scenario, results, wall_time):
        total = len(results)
        failures = [r for r in results if not r['ok']]
        latencies = sorted(r['latency'] for r in results)
        total_bytes = sum(r['bytes'] for r in results)
        throughput = total / wall_time if wall_time > 0 else 0
        p50 = _percentile(latencies, 50)
        p95 = _percentile(latencies, 95)
        peak = latencies[-1] if latencies else 0
        print(
            f'\n[LOADTEST] {scenario}: {total} requests in {wall_time:.2f}s '
            f'-> {throughput:.1f} req/s | ok={total - len(failures)} failed={len(failures)} '
            f'| p50={p50 * 1000:.0f}ms p95={p95 * 1000:.0f}ms max={peak * 1000:.0f}ms '
            f'| bytes={total_bytes}'
        )
        for failure in failures[:10]:
            print(f'[LOADTEST]   FAIL {failure["label"]}: {failure["detail"]}')
        return failures

    # ------------------------------------------------------------- operations

    def _op_validate(self, session, tag):
        holder = {}

        def call():
            response = session.post(
                f'{self.live_server_url}/api/auth/email-validation/validate/',
                json={'emails': [f'{tag}-{i}@example.com' for i in range(5)]},
                timeout=120,
            )
            try:
                holder['request_id'] = str(response.json().get('request_id') or '').strip()
            except Exception:
                holder['request_id'] = ''
            return response

        result = self._timed(f'validate:{tag}', call)
        return result, holder.get('request_id', '')

    def _op_history(self, session, tag):
        return self._timed(
            f'history:{tag}',
            lambda: session.get(f'{self.live_server_url}/api/auth/email-validation/history/', timeout=60),
        )

    def _op_status(self, session, tag, request_id):
        return self._timed(
            f'status:{tag}',
            lambda: session.get(
                f'{self.live_server_url}/api/auth/email-validation/history/{request_id}/status/',
                timeout=60,
            ),
        )

    def _op_download_one(self, session, tag, request_id):
        return self._timed(
            f'download-one:{tag}',
            lambda: session.get(
                f'{self.live_server_url}/api/auth/email-validation/history/{request_id}/download/?export_format=csv',
                timeout=180,
            ),
        )

    def _op_download_big(self, session, tag):
        return self._timed(
            f'download-big:{tag}',
            lambda: session.get(
                f'{self.live_server_url}/api/auth/email-validation/history/{BIG_REQUEST_ID}/download/?export_format=csv',
                timeout=180,
            ),
        )

    def _op_download_range(self, session, tag):
        today = timezone.now().date()
        params = {
            'from_date': (today - timedelta(days=1)).isoformat(),
            'to_date': today.isoformat(),
            'export_format': 'csv',
        }
        return self._timed(
            f'download-range:{tag}',
            lambda: session.get(
                f'{self.live_server_url}/api/auth/email-validation/reports/download/',
                params=params,
                timeout=180,
            ),
        )

    # ------------------------------------------------------------- scenarios

    def test_a_multiple_users_concurrently(self):
        """10 users, each running a full flow twice, all in parallel (120 requests)."""
        self._seed_data()

        def user_flow(user_index):
            flow_results = []
            session = self._new_session(self.user_credentials[user_index])
            for round_index in range(2):
                tag = f'u{user_index}r{round_index}'
                validate_result, request_id = self._op_validate(session, tag)
                flow_results.append(validate_result)
                flow_results.append(self._op_history(session, tag))
                if request_id:
                    flow_results.append(self._op_status(session, tag, request_id))
                    flow_results.append(self._op_download_one(session, tag, request_id))
                flow_results.append(self._op_download_one(session, tag, f'LOADREQ{user_index}'))
                flow_results.append(self._op_download_range(session, tag))
            session.close()
            return flow_results

        started = time.perf_counter()
        results = []
        with ThreadPoolExecutor(max_workers=USER_COUNT) as executor:
            for flow_results in executor.map(user_flow, range(USER_COUNT)):
                results.extend(flow_results)
        wall_time = time.perf_counter() - started
        failures = self._report('A multi-user concurrent (10 users x 12 ops)', results, wall_time)
        self.assertEqual(len(failures), 0, f'{len(failures)} requests failed')

    def test_b_single_user_simultaneous_requests(self):
        """One user firing 30 simultaneous requests (multi-tab / retry-storm shape)."""
        self._seed_data()
        session_pool = [self._new_session(self.user_credentials[0]) for _ in range(30)]

        def build_task(index):
            session = session_pool[index]
            kind = index % 4
            if kind == 0:
                return lambda: self._op_validate(session, f'b{index}')[0]
            if kind == 1:
                return lambda: self._op_download_one(session, f'b{index}', 'LOADREQ0')
            if kind == 2:
                return lambda: self._op_history(session, f'b{index}')
            return lambda: self._op_download_range(session, f'b{index}')

        tasks = [build_task(i) for i in range(30)]
        results, wall_time = self._run_concurrently(tasks, max_workers=30)
        for session in session_pool:
            session.close()
        failures = self._report('B single-user burst (30 simultaneous)', results, wall_time)
        self.assertEqual(len(failures), 0, f'{len(failures)} requests failed')

    def test_c_download_burst_large_request(self):
        """40 concurrent downloads of a 5000-row CSV report (streaming throughput)."""
        self._seed_data()
        sessions = [self._new_session(self.bulk_user_email) for _ in range(40)]
        counter = iter(range(40))

        def build_task():
            index = next(counter)
            return lambda: self._op_download_big(sessions[index], f'c{index}')

        tasks = [build_task() for _ in range(40)]
        results, wall_time = self._run_concurrently(tasks, max_workers=40)
        for session in sessions:
            session.close()
        failures = self._report('C download burst (40 x 5000-row CSV)', results, wall_time)
        self.assertEqual(len(failures), 0, f'{len(failures)} requests failed')
        for result in results:
            self.assertGreater(result['bytes'], 100000, 'download returned a suspiciously small body')

    def test_d_mixed_flood(self):
        """60 requests fired at once: validations + histories + downloads mixed."""
        self._seed_data()
        sessions = [self._new_session(self.user_credentials[i % USER_COUNT]) for i in range(60)]

        def build_task(index):
            session = sessions[index]
            kind = index % 4
            if kind == 0:
                return lambda: self._op_validate(session, f'd{index}')[0]
            if kind == 1:
                return lambda: self._op_history(session, f'd{index}')
            if kind == 2:
                return lambda: self._op_download_one(session, f'd{index}', f'LOADREQ{index % USER_COUNT}')
            return lambda: self._op_download_range(session, f'd{index}')

        tasks = [build_task(i) for i in range(60)]
        results, wall_time = self._run_concurrently(tasks, max_workers=60)
        for session in sessions:
            session.close()
        failures = self._report('D mixed flood (60 simultaneous)', results, wall_time)
        self.assertEqual(len(failures), 0, f'{len(failures)} requests failed')
