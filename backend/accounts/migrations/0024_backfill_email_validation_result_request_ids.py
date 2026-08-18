import uuid

from django.db import migrations


def backfill_request_ids(apps, schema_editor):
    EmailValidationResult = apps.get_model('accounts', 'EmailValidationResult')
    queryset = EmailValidationResult.objects.filter(request_id='').only('id')
    pending = []

    for result in queryset.iterator(chunk_size=2000):
        result.request_id = str(uuid.uuid4())
        pending.append(result)
        if len(pending) >= 2000:
            EmailValidationResult.objects.bulk_update(pending, ['request_id'], batch_size=2000)
            pending = []

    if pending:
        EmailValidationResult.objects.bulk_update(pending, ['request_id'], batch_size=2000)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0023_rename_accounts_em_histori_18fbb8_idx_accounts_em_history_9f80d3_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_request_ids, noop),
    ]
