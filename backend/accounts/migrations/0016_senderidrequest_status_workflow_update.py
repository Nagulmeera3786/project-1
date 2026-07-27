from django.db import migrations, models


def forward_status_mapping(apps, schema_editor):
    SenderIdRequest = apps.get_model('accounts', 'SenderIdRequest')
    SenderIdRequest.objects.filter(status='in_progress').update(status='progress')
    SenderIdRequest.objects.filter(status='ignored').update(status='rejected')
    SenderIdRequest.objects.filter(status='failed').update(status='rejected')


def backward_status_mapping(apps, schema_editor):
    SenderIdRequest = apps.get_model('accounts', 'SenderIdRequest')
    SenderIdRequest.objects.filter(status='progress').update(status='in_progress')
    SenderIdRequest.objects.filter(status='rejected').update(status='failed')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0015_senderidrequest'),
    ]

    operations = [
        migrations.RunPython(forward_status_mapping, backward_status_mapping),
        migrations.AlterField(
            model_name='senderidrequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('progress', 'Progress'),
                    ('completed', 'Completed'),
                    ('rejected', 'Rejected'),
                ],
                default='progress',
                max_length=20,
            ),
        ),
    ]
