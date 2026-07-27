from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0016_senderidrequest_status_workflow_update'),
    ]

    operations = [
        migrations.CreateModel(
            name='WalletRechargePayment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entered_amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('service_charge_percentage', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('tax_percentage', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('service_charge_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('currency', models.CharField(default='INR', max_length=10)),
                ('razorpay_order_id', models.CharField(max_length=100, unique=True)),
                ('razorpay_payment_id', models.CharField(blank=True, default='', max_length=100)),
                ('razorpay_signature', models.CharField(blank=True, default='', max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('successful', 'Successful'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('failure_reason', models.TextField(blank=True, default='')),
                ('credited_amount', models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ('credited_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wallet_recharge_payments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
