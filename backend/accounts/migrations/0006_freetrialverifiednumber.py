from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_smsshorturl_click_tracking'),
    ]

    operations = [
        migrations.CreateModel(
            name='FreeTrialVerifiedNumber',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone_number', models.CharField(max_length=20)),
                ('otp_code', models.CharField(blank=True, default='', max_length=6)),
                ('otp_created', models.DateTimeField(blank=True, null=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='free_trial_numbers', to='accounts.user')),
            ],
            options={
                'ordering': ['-updated_at'],
                'unique_together': {('owner', 'phone_number')},
            },
        ),
    ]
