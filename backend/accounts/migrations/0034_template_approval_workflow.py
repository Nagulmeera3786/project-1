from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('accounts', '0033_whatsapp_messaging'),
    ]

    operations = [
        migrations.AlterField(
            model_name='smstemplate',
            name='name',
            field=models.CharField(max_length=120),
        ),
        migrations.AddField(
            model_name='smstemplate',
            name='approval_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='approved', max_length=20),
        ),
        migrations.AddField(
            model_name='smstemplate',
            name='review_note',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='smstemplate',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='smstemplate',
            name='reviewed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_sms_templates', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='WhatsAppTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('category', models.CharField(blank=True, default='', max_length=100)),
                ('message_text', models.TextField(blank=True, default='')),
                ('provider_template_id', models.CharField(blank=True, default='', max_length=100)),
                ('is_active', models.BooleanField(default=False)),
                ('approval_status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('review_note', models.CharField(blank=True, default='', max_length=500)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='requested_whatsapp_templates', to=settings.AUTH_USER_MODEL)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_whatsapp_templates', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at', 'name']},
        ),
        migrations.AddField(
            model_name='whatsappcampaign',
            name='approved_template',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='campaigns', to='accounts.whatsapptemplate'),
        ),
        migrations.AddField(
            model_name='whatsappmessage',
            name='approved_template',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='messages', to='accounts.whatsapptemplate'),
        ),
    ]