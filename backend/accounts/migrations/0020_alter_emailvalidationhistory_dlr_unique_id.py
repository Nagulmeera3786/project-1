from django.db import migrations, models
import accounts.models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0019_emailvalidationhistory_dlr_unique_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='emailvalidationhistory',
            name='dlr_unique_id',
            field=models.CharField(blank=True, default=accounts.models.generate_email_validation_dlr_unique_id, max_length=8, unique=True),
        ),
    ]
