from celery import shared_task


@shared_task(bind=True, name='accounts.process_email_validation_history_job')
def process_email_validation_history_job(self, history_id):
    # Import inside task body to avoid import-time side effects.
    from .views import _process_email_validation_history_job

    return _process_email_validation_history_job(history_id)
