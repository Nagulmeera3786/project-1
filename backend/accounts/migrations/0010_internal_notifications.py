from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_smscredential_free_trial_default_sender_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='InternalNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('audience_filter', models.CharField(choices=[('all_users', 'All Users'), ('verified_users', 'Verified Users'), ('not_verified_users', 'Not Verified Users'), ('new_joiners', 'New Joiners'), ('active_users', 'Active Users'), ('inactive_users', 'Inactive Users'), ('free_trial_users', 'Free Trial Users'), ('non_free_trial_users', 'Non Free Trial Users')], default='all_users', max_length=50)),
                ('recipient_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='InternalNotificationRecipient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_read', models.BooleanField(default=False)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('notification', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipients', to='accounts.internalnotification')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='internal_notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('notification', 'user')},
            },
        ),
    ]

