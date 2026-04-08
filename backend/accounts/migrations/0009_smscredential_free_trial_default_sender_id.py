from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_user_free_trial_sender_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='smscredential',
            name='free_trial_default_sender_id',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
    ]

