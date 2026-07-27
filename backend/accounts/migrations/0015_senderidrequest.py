from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0014_emailvalidationhistory_completed_at_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='SenderIdRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=150)),
                ('email', models.EmailField(max_length=254)),
                ('contact_number', models.CharField(max_length=25)),
                ('required_sender_id', models.CharField(max_length=20)),
                ('destination_country', models.CharField(max_length=100)),
                ('primary_use_case', models.CharField(choices=[('otp', 'OTP'), ('two_factor_authentication', 'Two-Factor authentication'), ('transactional_notifications', 'Transactional Notifications'), ('critical_alerts', 'Critical alerts'), ('customer_service', 'Customer service'), ('marketing_promotions', 'Marketing promotions')], max_length=60)),
                ('company_name', models.CharField(max_length=200)),
                ('industry_sector_type', models.CharField(choices=[('fintech', 'Fintech'), ('healthcare', 'Healthcare'), ('education', 'Education'), ('ecommerce', 'E-commerce'), ('telecom', 'Telecom'), ('logistics', 'Logistics'), ('government', 'Government'), ('retail', 'Retail'), ('manufacturing', 'Manufacturing'), ('travel', 'Travel'), ('other', 'Other')], max_length=50)),
                ('company_website', models.URLField(max_length=500)),
                ('message_content', models.TextField()),
                ('company_documentation', models.FileField(upload_to='sender_id_requests/')),
                ('status', models.CharField(choices=[('in_progress', 'In Progress'), ('completed', 'Completed'), ('ignored', 'Ignored'), ('failed', 'Failed')], default='in_progress', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sender_id_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]