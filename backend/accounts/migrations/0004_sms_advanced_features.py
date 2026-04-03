from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_sender_id_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='smsmessage',
            name='batch_reference',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='smsmessage',
            name='failure_reason',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='smsmessage',
            name='schedule_type',
            field=models.CharField(choices=[('instant', 'Instant'), ('scheduled', 'Scheduled')], default='instant', max_length=20),
        ),
        migrations.AddField(
            model_name='smsmessage',
            name='scheduled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='smsmessage',
            name='send_mode',
            field=models.CharField(choices=[('single', 'Single'), ('file_numbers', 'File Numbers'), ('personalized_file', 'Personalized File'), ('group', 'Group')], default='single', max_length=30),
        ),
        migrations.AddField(
            model_name='smsmessage',
            name='sms_type',
            field=models.CharField(choices=[('transactional', 'Transactional'), ('promotional', 'Promotional'), ('service', 'Service')], default='transactional', max_length=20),
        ),
        migrations.AddField(
            model_name='smsmessage',
            name='source_file_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='smsmessage',
            name='timezone_name',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.CreateModel(
            name='SMSContactGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sms_contact_groups', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
                'unique_together': {('owner', 'name')},
            },
        ),
        migrations.CreateModel(
            name='SMSShortURL',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('link_name', models.CharField(max_length=120)),
                ('short_code', models.CharField(max_length=12, unique=True)),
                ('redirect_url', models.URLField(max_length=1000)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sms_short_urls', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SMSContact',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, default='', max_length=120)),
                ('phone_number', models.CharField(max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contacts', to='accounts.smscontactgroup')),
            ],
            options={
                'ordering': ['id'],
                'unique_together': {('group', 'phone_number')},
            },
        ),
    ]
