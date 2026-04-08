from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_sms_advanced_features'),
    ]

    operations = [
        migrations.AddField(
            model_name='smsshorturl',
            name='last_clicked_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='smsshorturl',
            name='total_clicks',
            field=models.PositiveIntegerField(default=0),
        ),
    ]

