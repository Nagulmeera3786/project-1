import sqlite3, os
for p in [r'db.sqlite3', os.path.join('..', 'db.sqlite3')]:
    if not os.path.exists(p):
        print(p, 'NOT FOUND')
        continue
    try:
        con = sqlite3.connect(p)
        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%emailvalidation%'")
        tables = [r[0] for r in cur.fetchall()]
        print(p, '->', tables)
        for t in tables:
            try:
                cur.execute('SELECT COUNT(*) FROM ' + t)
                print('   ', t, cur.fetchone()[0], 'rows')
            except Exception as e:
                print('   ', t, 'ERR', e)
        con.close()
    except Exception as e:
        print(p, 'open err', e)
