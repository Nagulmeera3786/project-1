from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0036_whatsapp_delivery_failed'),
    ]

    operations = [
        migrations.AddField(
            model_name='whatsappmessage',
            name='provider_campaign_id',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
    ]