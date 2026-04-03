from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_alter_smsmessage_send_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='free_trial_sender_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
