from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_freetrialverifiednumber'),
    ]

    operations = [
        migrations.AlterField(
            model_name='smsmessage',
            name='send_mode',
            field=models.CharField(
                choices=[
                    ('single', 'Single'),
                    ('file_numbers', 'File Numbers'),
                    ('personalized_file', 'Personalized File'),
                    ('group', 'Group'),
                    ('free_trial', 'Free Trial'),
                ],
                default='single',
                max_length=30,
            ),
        ),
    ]
