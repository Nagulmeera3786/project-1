from django.db import migrations, models


def set_unknown_dlr_for_empty_rows(apps, schema_editor):
    EmailValidationHistory = apps.get_model('accounts', 'EmailValidationHistory')
    for history in EmailValidationHistory.objects.all().order_by('id'):
        summary = history.results_summary if isinstance(history.results_summary, dict) else {}
        client_dlr_unique_id = str(summary.get('client_dlr_unique_id') or '').strip()
        target_dlr_unique_id = client_dlr_unique_id or 'UNKNOWN'
        if str(history.dlr_unique_id or '').strip() == target_dlr_unique_id:
            continue
        history.dlr_unique_id = target_dlr_unique_id
        history.save(update_fields=['dlr_unique_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0020_alter_emailvalidationhistory_dlr_unique_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='emailvalidationhistory',
            name='dlr_unique_id',
            field=models.CharField(blank=True, default='UNKNOWN', max_length=120),
        ),
        migrations.RunPython(set_unknown_dlr_for_empty_rows, migrations.RunPython.noop),
    ]
