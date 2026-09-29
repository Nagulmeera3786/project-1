from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0035_whatsapp_delivery_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='whatsappmessage',
            name='delivery_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('sent', 'Sent'),
                    ('delivered', 'Delivered'),
                    ('seen', 'Seen'),
                    ('failed', 'Failed'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]