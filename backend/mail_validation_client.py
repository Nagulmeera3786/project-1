#!/usr/bin/env python3
"""
Bulk and file mail validation client for the Bhisha Mail Validation API.

Uses:
    - API-key or whitelisted-IP authentication (no account login required)
  - Bulk validation (inline email list)
  - File validation (.csv/.txt/.xls/.xlsx/.xlsv upload)
  - Polling status for large/async jobs
  - Fetching every individual mail's validation status (unique per-mail
    request_id), not just the batch summary
  - Optional pause/resume/stop/cancel control actions

Usage:
    python mail_validation_client.py --api-key YOUR_API_KEY \
        --base-url https://your-domain.com/api/auth --bulk one@x.com two@x.com

    python mail_validation_client.py --api-key YOUR_API_KEY \
        --base-url https://your-domain.com/api/auth --file emails.xlsx
"""

import argparse
import sys
import time

import requests


class MailValidationClient:
    def __init__(self, base_url, timeout=90):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.api_key = None

    def _headers(self):
        return {'X-API-Key': self.api_key} if self.api_key else {}

    def set_api_key(self, api_key):
        self.api_key = str(api_key or '').strip() or None

    def validate_bulk(self, emails, dlr_unique_id=''):
        """Submit a list of emails for bulk validation. Each email gets its own
        unique request_id inside the batch; the returned request_id is the
        batch/control handle used for status polling."""
        response = self.session.post(
            f'{self.base_url}/email-validation/api/validate/',
            json={'emails': emails, **({'dlr_unique_id': dlr_unique_id} if dlr_unique_id else {})},
            headers=self._headers(),
            timeout=max(self.timeout, 900),
        )
        response.raise_for_status()
        return response.json(), response.status_code

    def validate_file(self, file_path, defer_start=False, dlr_unique_id=''):
        """Upload a .csv/.txt/.xls/.xlsx/.xlsv file for validation."""
        with open(file_path, 'rb') as fh:
            files = {'source_file': (file_path, fh)}
            data = {'defer_start': 'true'} if defer_start else {}
            if dlr_unique_id:
                data['dlr_unique_id'] = dlr_unique_id
            response = self.session.post(
                f'{self.base_url}/email-validation/api/validate/',
                files=files,
                data=data,
                headers=self._headers(),
                timeout=max(self.timeout, 900),
            )
        response.raise_for_status()
        return response.json(), response.status_code

    def get_status(self, request_id):
        response = self.session.post(
            f'{self.base_url}/email-validation/api/status/',
            headers=self._headers(),
            json={'request_id': request_id},
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def control(self, request_id, action):
        """action: start | pause | resume | stop | cancel"""
        response = self.session.patch(
            f'{self.base_url}/email-validation/history/{request_id}/control/',
            json={'action': action},
            headers=self._headers(),
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_results_page(self, request_id, page=1, page_size=500, order='oldest'):
        """Fetch a page of individual mail results, each with its own
        unique request_id and validation status."""
        response = self.session.get(
            f'{self.base_url}/email-validation/history/{request_id}/results/',
            params={'page': page, 'page_size': page_size, 'order': order},
            headers=self._headers(),
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def iter_all_results(self, request_id, page_size=500):
        """Yield every individual mail result row across all pages."""
        page = 1
        while True:
            payload = self.get_results_page(request_id, page=page, page_size=page_size)
            rows = payload.get('rows') or []
            for row in rows:
                yield row
            total = int(payload.get('total') or 0)
            if page * page_size >= total or not rows:
                break
            page += 1

    def wait_until_complete(self, request_id, poll_seconds=3, max_wait_seconds=3600):
        waited = 0
        while waited <= max_wait_seconds:
            status_payload = self.get_status(request_id)
            if isinstance(status_payload, list):
                print(f'[{request_id}] completed; received {len(status_payload)} mail results')
                return status_payload

            state = str(status_payload.get('status') or '').lower()
            print(f'[{request_id}] state={state}')
            if state != 'queued':
                return status_payload
            time.sleep(poll_seconds)
            waited += poll_seconds
        raise TimeoutError(f'Validation {request_id} did not finish within {max_wait_seconds}s')


def run_bulk(client, emails, dlr_unique_id=''):
    payload, status_code = client.validate_bulk(emails, dlr_unique_id=dlr_unique_id)
    request_id = payload.get('request_id') or payload.get('batch_id')
    print(f'Submitted {len(emails)} emails. Batch request_id={request_id}, status={status_code}')

    if status_code == 202:
        client.wait_until_complete(request_id)

    print_all_mail_statuses(client, request_id)


def run_file(client, file_path, dlr_unique_id=''):
    payload, status_code = client.validate_file(file_path, dlr_unique_id=dlr_unique_id)
    request_id = payload.get('request_id') or payload.get('batch_id')
    print(f'Uploaded {file_path}. Batch request_id={request_id}, status={status_code}')

    if status_code == 202:
        client.wait_until_complete(request_id)

    print_all_mail_statuses(client, request_id)


def print_all_mail_statuses(client, request_id):
    print(f'\nIndividual mail results for batch {request_id}:')
    print(f'{"request_id":<40} {"email":<35} {"result":<10} status')
    payload = client.get_status(request_id)
    rows = payload if isinstance(payload, list) else [payload]
    count = 0
    for row in rows:
        print(f'{row.get("request_id", ""):<40} {row.get("email", ""):<35} {row.get("status", "")}')
        count += 1
    print(f'\nTotal mails: {count}')


def main():
    parser = argparse.ArgumentParser(description='Bulk/file mail validation client')
    parser.add_argument('--base-url', required=True, help='e.g. https://your-domain.com/api/auth')
    parser.add_argument('--api-key', help='API key sent as X-API-Key; omit when caller IP is whitelisted')
    parser.add_argument('--bulk', nargs='+', help='List of emails to validate in bulk')
    parser.add_argument('--file', help='Path to .csv/.txt/.xls/.xlsx/.xlsv file to validate')
    parser.add_argument('--dlr-unique-id', default='', help='Optional alphanumeric DLR ID, max 10 characters')
    args = parser.parse_args()

    if not args.bulk and not args.file:
        parser.error('Provide --bulk EMAIL1 EMAIL2 ... or --file PATH')

    client = MailValidationClient(args.base_url)
    if not args.api_key:
        print('No API key supplied; using the caller IP whitelist.')
    client.set_api_key(args.api_key)

    if args.bulk:
        run_bulk(client, args.bulk, args.dlr_unique_id)

    if args.file:
        run_file(client, args.file, args.dlr_unique_id)


if __name__ == '__main__':
    try:
        main()
    except requests.HTTPError as exc:
        detail = ''
        try:
            detail = exc.response.json()
        except Exception:
            detail = exc.response.text if exc.response is not None else ''
        print(f'API error: {exc}\nDetail: {detail}', file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f'Error: {exc}', file=sys.stderr)
        sys.exit(1)
