from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('accounts', '0032_merge_whatsapp_sms'),
    ]

    operations = [
        migrations.CreateModel(
            name='WhatsAppCampaign',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, default='', max_length=150)),
                ('template_id', models.CharField(max_length=100)),
                ('recipient_count', models.PositiveIntegerField(default=0)),
                ('status', models.CharField(choices=[('accepted', 'Accepted'), ('failed', 'Failed')], default='failed', max_length=20)),
                ('provider_campaign_id', models.CharField(blank=True, default='', max_length=150)),
                ('provider_response', models.JSONField(blank=True, default=dict)),
                ('error_message', models.CharField(blank=True, default='', max_length=500)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='whatsapp_campaigns', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='WhatsAppMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mode', models.CharField(choices=[('text', 'Text'), ('campaign', 'Campaign')], max_length=20)),
                ('contact_name', models.CharField(blank=True, default='', max_length=150)),
                ('contact_no', models.CharField(max_length=30)),
                ('message_text', models.TextField(blank=True, default='')),
                ('template_id', models.CharField(blank=True, default='', max_length=100)),
                ('status', models.CharField(choices=[('accepted', 'Accepted by provider'), ('failed', 'Failed')], default='failed', max_length=20)),
                ('provider_message_id', models.CharField(blank=True, default='', max_length=150)),
                ('provider_response', models.JSONField(blank=True, default=dict)),
                ('error_message', models.CharField(blank=True, default='', max_length=500)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('campaign', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='messages', to='accounts.whatsappcampaign')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='whatsapp_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='whatsappmessage',
            index=models.Index(fields=['user', 'created_at'], name='accounts_wa_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='whatsappmessage',
            index=models.Index(fields=['status', 'created_at'], name='accounts_wa_status_created_idx'),
        ),
    ]