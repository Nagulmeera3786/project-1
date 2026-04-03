from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = "Run raw SQL queries and print results in table format."

    def add_arguments(self, parser):
        parser.add_argument("query", type=str, help="SQL query to execute")

    def handle(self, *args, **options):
        query = (options.get("query") or "").strip().rstrip(";")
        if not query:
            raise CommandError("Query cannot be empty.")

        first_word = query.split(None, 1)[0].upper() if query else ""
        is_read_query = first_word in {"SELECT", "PRAGMA", "WITH", "EXPLAIN"}

        if not is_read_query:
            raise CommandError(
                "Only read-only queries are allowed (SELECT/PRAGMA/WITH/EXPLAIN)."
            )

        try:
            with connection.cursor() as cursor:
                cursor.execute(query)
                rows = cursor.fetchall()
                headers = [col[0] for col in (cursor.description or [])]
                self.stdout.write(self._format_table(headers, rows))
                self.stdout.write(self.style.SUCCESS(f"Rows: {len(rows)}"))
        except Exception as exc:
            raise CommandError(str(exc))

    def _format_table(self, headers, rows):
        if not headers:
            return "(No columns returned)"

        normalized_rows = [tuple("NULL" if value is None else str(value) for value in row) for row in rows]
        widths = []
        for index, header in enumerate(headers):
            max_row_len = max((len(row[index]) for row in normalized_rows), default=0)
            widths.append(max(len(str(header)), max_row_len))

        def border():
            return "+" + "+".join("-" * (width + 2) for width in widths) + "+"

        def render_row(values):
            cells = [f" {str(value).ljust(widths[idx])} " for idx, value in enumerate(values)]
            return "|" + "|".join(cells) + "|"

        lines = [border(), render_row(headers), border()]
        for row in normalized_rows:
            lines.append(render_row(row))
        lines.append(border())
        return "\n".join(lines)
