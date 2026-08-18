from django.db import migrations


def repair_login_lockout_column(apps, schema_editor):
    user_model = apps.get_model('accounts', 'User')
    table_name = user_model._meta.db_table
    expected_column = 'login_locked_until'
    legacy_column = 'failed_login_locked_until'

    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    quoted_table = schema_editor.quote_name(table_name)
    quoted_expected = schema_editor.quote_name(expected_column)
    quoted_legacy = schema_editor.quote_name(legacy_column)

    if expected_column not in existing_columns and legacy_column in existing_columns:
        schema_editor.execute(
            f'ALTER TABLE {quoted_table} RENAME COLUMN {quoted_legacy} TO {quoted_expected}'
        )
        return

    if expected_column not in existing_columns:
        field = user_model._meta.get_field(expected_column)
        schema_editor.add_field(user_model, field)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0026_user_login_lockout'),
    ]

    operations = [
        migrations.RunPython(
            repair_login_lockout_column,
            migrations.RunPython.noop,
        ),
    ]