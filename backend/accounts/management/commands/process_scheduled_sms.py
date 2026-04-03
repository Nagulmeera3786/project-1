import time
from django.core.management.base import BaseCommand
from accounts.views import SMSSendView


class Command(BaseCommand):
    help = "Process due scheduled SMS messages"

    def add_arguments(self, parser):
        parser.add_argument(
            '--loop',
            action='store_true',
            help='Continuously process due scheduled SMS in a loop',
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='Polling interval in seconds when --loop is used (default: 30)',
        )

    def handle(self, *args, **options):
        view = SMSSendView()

        if options['loop']:
            interval = max(5, int(options['interval']))
            self.stdout.write(self.style.SUCCESS(f'Scheduled SMS processor running every {interval}s. Press Ctrl+C to stop.'))
            try:
                while True:
                    view._process_due_scheduled_messages()
                    time.sleep(interval)
            except KeyboardInterrupt:
                self.stdout.write(self.style.WARNING('Scheduled SMS processor stopped.'))
            return

        view._process_due_scheduled_messages()
        self.stdout.write(self.style.SUCCESS('Processed due scheduled SMS messages.'))
