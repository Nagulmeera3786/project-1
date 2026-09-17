from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from accounts.models import PlatformSetting, User


class Command(BaseCommand):
    """Auto-disable user accounts that have not logged in for longer than the
    admin-configured ``account_auto_disable_days`` setting (Admin Security Settings page).

    Intended to be run on a schedule (e.g. a daily cron job / Plesk scheduled task):
        python manage.py disable_inactive_users
    """

    help = 'Disable user accounts that have not logged in within the admin-configured threshold'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='List the accounts that would be disabled without changing anything',
        )

    def handle(self, *args, **options):
        setting = PlatformSetting.objects.filter(key='account_auto_disable_days').first()
        try:
            threshold_days = int(setting.value) if setting else 0
        except (TypeError, ValueError):
            threshold_days = 0

        if threshold_days <= 0:
            self.stdout.write(self.style.WARNING('account_auto_disable_days is not configured (0/disabled). Nothing to do.'))
            return

        cutoff = timezone.now() - timedelta(days=threshold_days)

        candidates = User.objects.filter(
            is_active=True,
            is_staff=False,
            is_superuser=False,
        ).filter(
            Q(last_login__lt=cutoff) | Q(last_login__isnull=True, date_joined__lt=cutoff)
        )

        count = candidates.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No inactive accounts found beyond the configured threshold.'))
            return

        if options['dry_run']:
            for user in candidates:
                self.stdout.write(f'Would disable: {user.email or user.username} (id={user.id})')
            self.stdout.write(self.style.SUCCESS(f'{count} account(s) would be disabled (dry run).'))
            return

        updated = candidates.update(is_active=False)
        self.stdout.write(self.style.SUCCESS(f'Disabled {updated} inactive account(s) (no login for {threshold_days}+ days).'))
