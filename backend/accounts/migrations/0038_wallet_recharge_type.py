from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0037_whatsapp_template_tracking_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='walletrechargepayment',
            name='wallet_type',
            field=models.CharField(
                choices=[('sms', 'SMS'), ('email_validation', 'Email validation')],
                default='sms',
                max_length=30,
            ),
        ),
    ]