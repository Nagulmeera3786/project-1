from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0021_update_emailvalidationhistory_dlr_unknown'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailValidationResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=320)),
                ('status', models.CharField(blank=True, default='', max_length=40)),
                ('status_code', models.CharField(blank=True, default='', max_length=80)),
                ('classification', models.CharField(blank=True, default='', max_length=80)),
                ('valid_syntax', models.BooleanField(default=False)),
                ('valid_mailbox', models.BooleanField(default=False)),
                ('provider_message_id', models.CharField(blank=True, default='', max_length=150)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('history', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='result_rows', to='accounts.emailvalidationhistory')),
            ],
            options={
                'ordering': ['id'],
            },
        ),
        migrations.AddIndex(
            model_name='emailvalidationresult',
            index=models.Index(fields=['history', 'id'], name='accounts_em_histori_18fbb8_idx'),
        ),
        migrations.AddIndex(
            model_name='emailvalidationresult',
            index=models.Index(fields=['history', 'email'], name='accounts_em_histori_0347ad_idx'),
        ),
    ]
