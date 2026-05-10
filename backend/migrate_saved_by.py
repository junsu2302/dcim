import sqlite3
conn = sqlite3.connect('dcim.db')
try:
    conn.execute("ALTER TABLE snapshots ADD COLUMN saved_by TEXT DEFAULT ''")
    conn.commit()
    print("saved_by column added")
except Exception as e:
    print(f"Already exists or error: {e}")
conn.close()
