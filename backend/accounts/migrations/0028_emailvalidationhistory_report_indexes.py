# Adds composite/lookup indexes used by mail validation report downloads
# (per-user date-range scans on EmailValidationHistory).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0027_repair_login_lockout_column'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='emailvalidationhistory',
            index=models.Index(fields=['user', 'created_at'], name='accounts_evh_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='emailvalidationhistory',
            index=models.Index(fields=['created_at'], name='accounts_evh_created_idx'),
        ),
    ]
