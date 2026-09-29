from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0034_template_approval_workflow'),
    ]

    operations = [
        migrations.AddField(
            model_name='whatsappmessage',
            name='delivery_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('sent', 'Sent'),
                    ('delivered', 'Delivered'),
                    ('seen', 'Seen'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='whatsappmessage',
            name='provider_status_code',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]