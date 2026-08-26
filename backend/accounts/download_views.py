"""Streaming download endpoints for mail validation results.

Features:
- Download results of an individual validation request (single, bulk, or file).
  Accepts either the batch request_id or an individual per-mail request_id.
- Download a consolidated mail validation report for a chosen date range
  (from_date/to_date), optionally filtered by source (dashboard/api) and
  validation kind (single/bulk/file).
- CSV and JSON formats, streamed with constant memory usage so very large
  reports do not exhaust server memory.
- Scoped per-user rate limiting to protect the server from download floods.

Security notes:
- Every row is scoped to the requesting user; only support/admin users may
  read other users' data (or explicitly filter with user_id / all_users=1).
- CSV cells are sanitized against spreadsheet formula injection.
- Responses set X-Content-Type-Options: nosniff and attachment filenames.
"""

import csv
import io
import json
import re
from datetime import datetime, timedelta, time as dt_time

from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from .models import EmailValidationHistory, EmailValidationResult
from .views import (
    _DLR_UNKNOWN,
    _get_history_summary,
    _has_support_read_access,
    _resolve_email_validation_history,
)

MAX_REPORT_RANGE_DAYS = 366
DEFAULT_REPORT_RANGE_DAYS = 30
_DOWNLOAD_CHUNK_SIZE = 2000

# Characters that spreadsheet apps interpret as a formula prefix.
_CSV_DANGEROUS_PREFIXES = ('=', '+', '-', '@', '\t', '\r')
_SAFE_FILENAME_PART = re.compile(r'[^A-Za-z0-9_.-]+')

DETAIL_CSV_HEADER = [
    'Batch Request ID',
    'Mail Request ID',
    'DLR Unique ID',
    'Email',
    'Result',
    'Status',
    'Status Code',
    'Classification',
    'Valid Syntax',
    'Validation Type',
    'Source',
    'File Name',
    'Batch Status',
    'Requested At',
    'Completed At',
    'Provider Message ID',
]


class EmailValidationDownloadThrottle(SimpleRateThrottle):
    """Per-user (or per-IP for anonymous) scoped throttle for download endpoints.

    The rate is configured via REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
    ['email_validation_download'] and can be overridden with the
    EMAIL_VALIDATION_DOWNLOAD_RATE env var (e.g. '120/min').
    """

    scope = 'email_validation_download'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f'user-{request.user.pk}'
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


def _csv_safe(value):
    """Render a value as a spreadsheet-safe CSV cell (formula-injection guard)."""
    if value is None:
        return ''
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    text = str(value)
    if text.startswith(_CSV_DANGEROUS_PREFIXES):
        text = "'" + text
    return text


def _format_timestamp(value):
    if not value:
        return ''
    try:
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.utc)
        return value.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    except Exception:
        return str(value)


def _classify_history_kind(history):
    if str(getattr(history, 'file_name', '') or '').strip():
        return 'file'
    if int(getattr(history, 'email_count', 0) or 0) > 1:
        return 'bulk'
    return 'single'


def _history_meta(history):
    return {
        'batch_request_id': str(getattr(history, 'request_id', '') or '').strip(),
        'dlr_unique_id': str(getattr(history, 'dlr_unique_id', '') or '').strip() or _DLR_UNKNOWN,
        'source': str(getattr(history, 'source', '') or '').strip(),
        'batch_status': str(getattr(history, 'status', '') or '').strip(),
        'file_name': str(getattr(history, 'file_name', '') or '').strip(),
        'kind': _classify_history_kind(history),
        'requested_at': _format_timestamp(getattr(history, 'created_at', None)),
        'completed_at': _format_timestamp(getattr(history, 'completed_at', None)),
    }


def _detail_values_queryset(history_id, mail_request_id=''):
    queryset = (
        EmailValidationResult.objects
        .filter(history_id=history_id)
        .order_by('id')
    )
    if mail_request_id:
        queryset = queryset.filter(request_id=mail_request_id)
    return queryset.values(
        'email',
        'request_id',
        'status',
        'status_code',
        'classification',
        'valid_syntax',
        'valid_mailbox',
        'provider_message_id',
    )


def _summary_fallback_rows(history):
    """Per-mail rows from the compact JSON summary for legacy requests that
    predate the detail table (or were compacted). Pure ORM/JSON - safe on
    both PostgreSQL and SQLite."""
    summary = _get_history_summary(history)
    results = summary.get('results') if isinstance(summary.get('results'), list) else []
    request_items = summary.get('request_items') if isinstance(summary.get('request_items'), list) else []

    request_id_by_email = {}
    dlr_by_email = {}
    for item in request_items:
        if not isinstance(item, dict):
            continue
        email_key = str(item.get('email') or '').strip().lower()
        if not email_key:
            continue
        request_id_by_email.setdefault(email_key, str(item.get('request_id') or '').strip())
        dlr_by_email.setdefault(email_key, str(item.get('dlr_unique_id') or '').strip())

    rows = []
    for item in results:
        if not isinstance(item, dict):
            continue
        email = str(item.get('email') or '').strip().lower()
        rows.append({
            'email': email,
            'request_id': str(item.get('request_id') or '').strip() or request_id_by_email.get(email, ''),
            'dlr_unique_id': str(item.get('dlr_unique_id') or '').strip() or dlr_by_email.get(email, ''),
            'status': str(item.get('status') or '').strip(),
            'status_code': str(item.get('statusCode') or item.get('status_code') or '').strip(),
            'classification': str(item.get('classification') or '').strip(),
            'valid_syntax': bool(item.get('validSyntax') if item.get('validSyntax') is not None else item.get('valid_syntax')),
            'valid_mailbox': bool(item.get('validMailbox') if item.get('validMailbox') is not None else item.get('valid_mailbox')),
            'provider_message_id': str(item.get('providerMessageId') or item.get('provider_message_id') or '').strip(),
        })
    return rows


def _history_detail_row_count(history_id):
    return EmailValidationResult.objects.filter(history_id=history_id).count()


def _build_detail_csv_row(meta, row):
    valid_syntax = bool(row.get('valid_syntax'))
    valid_mailbox = bool(row.get('valid_mailbox'))
    return [
        meta['batch_request_id'],
        str(row.get('request_id') or '').strip() or meta['batch_request_id'],
        str(row.get('dlr_unique_id') or '').strip() or meta['dlr_unique_id'],
        str(row.get('email') or '').strip(),
        'valid' if (valid_syntax and valid_mailbox) else 'not valid',
        str(row.get('status') or '').strip(),
        str(row.get('status_code') or '').strip(),
        str(row.get('classification') or '').strip(),
        valid_syntax,
        meta['kind'],
        meta['source'],
        meta['file_name'],
        meta['batch_status'],
        meta['requested_at'],
        meta['completed_at'],
        str(row.get('provider_message_id') or '').strip(),
    ]


def _build_detail_json_row(meta, row):
    valid_syntax = bool(row.get('valid_syntax'))
    valid_mailbox = bool(row.get('valid_mailbox'))
    return {
        'batch_request_id': meta['batch_request_id'],
        'mail_request_id': str(row.get('request_id') or '').strip() or meta['batch_request_id'],
        'dlr_unique_id': str(row.get('dlr_unique_id') or '').strip() or meta['dlr_unique_id'],
        'email': str(row.get('email') or '').strip(),
        'result': 'valid' if (valid_syntax and valid_mailbox) else 'not valid',
        'status': str(row.get('status') or '').strip(),
        'status_code': str(row.get('status_code') or '').strip(),
        'classification': str(row.get('classification') or '').strip(),
        'valid_syntax': valid_syntax,
        'validation_type': meta['kind'],
        'source': meta['source'],
        'file_name': meta['file_name'],
        'batch_status': meta['batch_status'],
        'requested_at': meta['requested_at'],
        'completed_at': meta['completed_at'],
        'provider_message_id': str(row.get('provider_message_id') or '').strip(),
    }


class _CsvChunkWriter:
    """Adapter so csv.writer can emit strings that the streaming response yields."""

    def __init__(self):
        self._buffer = io.StringIO()

    def write(self, value):
        self._buffer.write(value)

    def flush_value(self):
        chunk = self._buffer.getvalue()
        self._buffer.seek(0)
        self._buffer.truncate(0)
        return chunk


def _stream_csv_rows(row_iterable):
    pseudo = _CsvChunkWriter()
    writer = csv.writer(pseudo, lineterminator='\n')
    writer.writerow(DETAIL_CSV_HEADER)
    header_chunk = pseudo.flush_value()
    if header_chunk:
        yield header_chunk
    pending = 0
    for row in row_iterable:
        writer.writerow([_csv_safe(cell) for cell in row])
        pending += 1
        if pending >= _DOWNLOAD_CHUNK_SIZE:
            chunk = pseudo.flush_value()
            if chunk:
                yield chunk
            pending = 0
    tail = pseudo.flush_value()
    if tail:
        yield tail


def _stream_json_rows(row_iterable, envelope):
    envelope = dict(envelope or {})
    envelope.pop('results', None)
    base = json.dumps(envelope, default=str)
    if base.endswith('}'):
        base = base[:-1]
    prefix = base + (', ' if len(base) > 1 else '') + '"results": ['
    yield prefix
    first = True
    for row in row_iterable:
        payload = json.dumps(row, default=str)
        if first:
            yield '\n' + payload
            first = False
        else:
            yield ',\n' + payload
    yield '\n]}'


def _make_attachment_response(row_iterable, filename_base, export_format, envelope=None):
    safe_base = _SAFE_FILENAME_PART.sub('-', str(filename_base or 'mail-validation')).strip('-') or 'mail-validation'
    if export_format == 'json':
        response = StreamingHttpResponse(
            _stream_json_rows(row_iterable, envelope or {}),
            content_type='application/json; charset=utf-8',
        )
        response['Content-Disposition'] = f'attachment; filename="{safe_base}.json"'
    else:
        response = StreamingHttpResponse(
            _stream_csv_rows(row_iterable),
            content_type='text/csv; charset=utf-8',
        )
        response['Content-Disposition'] = f'attachment; filename="{safe_base}.csv"'
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'no-store'
    return response


def _parse_report_date(value, is_end):
    text = str(value or '').strip()
    if not text:
        return None
    try:
        parsed = datetime.strptime(text, '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return None
    current_tz = timezone.get_current_timezone()
    boundary = dt_time.max if is_end else dt_time.min
    return timezone.make_aware(datetime.combine(parsed, boundary), current_tz)


def _iter_history_detail_csv_rows(history, mail_request_id=''):
    """Yield CSV-ready rows for one request: detail table first, summary fallback after."""
    meta = _history_meta(history)
    detail_qs = _detail_values_queryset(history.id, mail_request_id=mail_request_id)
    emitted = 0
    for row in detail_qs.iterator(chunk_size=_DOWNLOAD_CHUNK_SIZE):
        emitted += 1
        yield _build_detail_csv_row(meta, row)
    if emitted == 0 and not mail_request_id:
        for row in _summary_fallback_rows(history):
            yield _build_detail_csv_row(meta, row)


def _iter_history_detail_json_rows(history, mail_request_id=''):
    meta = _history_meta(history)
    detail_qs = _detail_values_queryset(history.id, mail_request_id=mail_request_id)
    emitted = 0
    for row in detail_qs.iterator(chunk_size=_DOWNLOAD_CHUNK_SIZE):
        emitted += 1
        yield _build_detail_json_row(meta, row)
    if emitted == 0 and not mail_request_id:
        for row in _summary_fallback_rows(history):
            yield _build_detail_json_row(meta, row)


class EmailValidationDownloadView(generics.GenericAPIView):
    """Download full per-mail validation results for one request.

    Works for single, bulk and file validations. ``request_id`` may be either
    the batch request id or an individual per-mail request id.

    GET /api/auth/email-validation/history/<request_id>/download/?export_format=csv|json
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [EmailValidationDownloadThrottle]

    def get(self, request, request_id):
        export_format = str(request.query_params.get('export_format') or 'csv').strip().lower()
        if export_format not in {'csv', 'json'}:
            return Response({'detail': "Invalid export_format. Use 'csv' or 'json'."}, status=status.HTTP_400_BAD_REQUEST)

        history = _resolve_email_validation_history(request_id, request.user)
        if not history:
            return Response({'detail': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        if not (_has_support_read_access(request.user) or history.user_id == request.user.id):
            return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        batch_request_id = str(history.request_id or '').strip()
        normalized_id = str(request_id or '').strip()
        mail_request_id = '' if normalized_id == batch_request_id else normalized_id

        timestamp = timezone.now().strftime('%Y%m%d-%H%M%S')
        filename_base = f'mail-validation-{batch_request_id or normalized_id}-{timestamp}'
        envelope = {
            'request_id': batch_request_id,
            'mail_request_id': mail_request_id,
            'dlr_unique_id': str(getattr(history, 'dlr_unique_id', '') or '').strip() or _DLR_UNKNOWN,
            'generated_at': _format_timestamp(timezone.now()),
        }

        if export_format == 'json':
            rows = _iter_history_detail_json_rows(history, mail_request_id=mail_request_id)
        else:
            rows = _iter_history_detail_csv_rows(history, mail_request_id=mail_request_id)
        return _make_attachment_response(rows, filename_base, export_format, envelope=envelope)


class EmailValidationReportDownloadView(generics.GenericAPIView):
    """Download a consolidated mail validation report for a date range.

    GET /api/auth/email-validation/reports/download/
        ?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&export_format=csv|json
        [&source=dashboard|api][&kind=single|bulk|file]
        [&user_id=<id>|&all_users=1]  (support/admin only)

    Dates are inclusive. Default range (when omitted) is the last 30 days.
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [EmailValidationDownloadThrottle]

    def get(self, request):
        export_format = str(request.query_params.get('export_format') or 'csv').strip().lower()
        if export_format not in {'csv', 'json'}:
            return Response({'detail': "Invalid export_format. Use 'csv' or 'json'."}, status=status.HTTP_400_BAD_REQUEST)

        raw_from = request.query_params.get('from_date')
        raw_to = request.query_params.get('to_date')
        now = timezone.now()

        if raw_from is None and raw_to is None:
            from_dt = now - timedelta(days=DEFAULT_REPORT_RANGE_DAYS)
            to_dt = now
        else:
            from_dt = _parse_report_date(raw_from, is_end=False) if raw_from else None
            to_dt = _parse_report_date(raw_to, is_end=True) if raw_to else None
            if raw_from and from_dt is None:
                return Response({'detail': 'Invalid from_date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
            if raw_to and to_dt is None:
                return Response({'detail': 'Invalid to_date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
            if from_dt is None:
                from_dt = to_dt - timedelta(days=DEFAULT_REPORT_RANGE_DAYS)
            if to_dt is None:
                to_dt = now

        if from_dt > to_dt:
            return Response({'detail': 'from_date must be on or before to_date.'}, status=status.HTTP_400_BAD_REQUEST)
        if (to_dt - from_dt) > timedelta(days=MAX_REPORT_RANGE_DAYS):
            return Response(
                {'detail': f'Date range too large. Maximum allowed range is {MAX_REPORT_RANGE_DAYS} days.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        source = str(request.query_params.get('source') or '').strip().lower()
        if source and source not in {'dashboard', 'api'}:
            return Response({'detail': "Invalid source. Use 'dashboard' or 'api'."}, status=status.HTTP_400_BAD_REQUEST)
        kind = str(request.query_params.get('kind') or '').strip().lower()
        if kind and kind not in {'single', 'bulk', 'file'}:
            return Response({'detail': "Invalid kind. Use 'single', 'bulk' or 'file'."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = EmailValidationHistory.objects.filter(
            created_at__gte=from_dt,
            created_at__lte=to_dt,
        ).order_by('created_at', 'id')

        is_support = _has_support_read_access(request.user)
        requested_user_id = str(request.query_params.get('user_id') or '').strip()
        all_users = str(request.query_params.get('all_users') or '').strip().lower() in {'1', 'true', 'yes', 'on'}
        if is_support:
            if requested_user_id:
                if not requested_user_id.isdigit():
                    return Response({'detail': 'user_id must be a numeric user id.'}, status=status.HTTP_400_BAD_REQUEST)
                queryset = queryset.filter(user_id=int(requested_user_id))
            elif not all_users:
                queryset = queryset.filter(user_id=request.user.id)
        else:
            if requested_user_id or all_users:
                return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            queryset = queryset.filter(user_id=request.user.id)

        if source:
            queryset = queryset.filter(source=source)
        if kind == 'file':
            queryset = queryset.exclude(file_name='')
        elif kind == 'bulk':
            queryset = queryset.filter(file_name='', email_count__gt=1)
        elif kind == 'single':
            queryset = queryset.filter(file_name='', email_count__lte=1)

        histories = queryset.only(
            'id',
            'request_id',
            'dlr_unique_id',
            'source',
            'status',
            'email_count',
            'file_name',
            'created_at',
            'completed_at',
            'results_summary',
        )

        def csv_rows():
            for history in histories.iterator(chunk_size=200):
                for row in _iter_history_detail_csv_rows(history):
                    yield row

        def json_rows():
            for history in histories.iterator(chunk_size=200):
                for row in _iter_history_detail_json_rows(history):
                    yield row

        from_label = from_dt.strftime('%Y%m%d')
        to_label = to_dt.strftime('%Y%m%d')
        filename_base = f'mail-validation-report-{from_label}-to-{to_label}'
        envelope = {
            'report': 'mail-validation',
            'from_date': from_dt.strftime('%Y-%m-%d'),
            'to_date': to_dt.strftime('%Y-%m-%d'),
            'source': source or 'all',
            'kind': kind or 'all',
            'generated_at': _format_timestamp(now),
        }

        row_iterable = json_rows() if export_format == 'json' else csv_rows()
        return _make_attachment_response(row_iterable, filename_base, export_format, envelope=envelope)
