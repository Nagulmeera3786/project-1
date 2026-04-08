# Generated migration file for SMS models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_sms_enabled',
            field=models.BooleanField(default=False, help_text='User can receive SMS from admin'),
        ),
        migrations.CreateModel(
            name='SMSCredential',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', models.CharField(help_text='Profile ID from SMS provider', max_length=100)),
                ('password', models.CharField(help_text='Password from SMS provider', max_length=100)),
                ('sender_ids', models.JSONField(default=list, help_text='List of approved sender IDs')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name_plural': 'SMS Credentials',
            },
        ),
        migrations.CreateModel(
            name='SMSMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient_number', models.CharField(max_length=20)),
                ('display_sender_id', models.CharField(help_text='Sender ID displayed to recipient', max_length=50)),
                ('message_content', models.TextField()),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('sent', 'Sent'), ('delivered', 'Delivered'), ('failed', 'Failed')],
                    default='pending',
                    max_length=20
                )),
                ('message_id', models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ('delivery_time', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('recipient_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_sms', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_sms', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]

