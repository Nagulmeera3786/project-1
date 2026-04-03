"""Project package initialization."""

try:
	import MySQLdb  # noqa: F401
except Exception:
	try:
		import pymysql
	except Exception:
		pass
	else:
		pymysql.version_info = (2, 2, 1, "final", 0)
		pymysql.__version__ = "2.2.1"
		pymysql.install_as_MySQLdb()
