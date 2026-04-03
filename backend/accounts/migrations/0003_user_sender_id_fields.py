from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_sms_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='sender_id',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='user',
            name='sender_id_type',
            field=models.CharField(choices=[('numeric', 'Numeric'), ('alphanumeric', 'Alphanumeric')], default='alphanumeric', max_length=20),
        ),
    ]
