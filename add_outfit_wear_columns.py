"""
One-time migration: adds the `avatar` column to the existing
`user_settings` table without wiping any data.

Run this once from your project root (same place you run app.py):
    python add_user_settings_avatar_column.py

Safe to run more than once - it checks whether the column already
exists before trying to add it.
"""
import sqlite3
import os
import glob

candidates = glob.glob('*.db') + glob.glob('*.sqlite') + glob.glob('*.sqlite3') \
    + glob.glob(os.path.join('instance', '*.db')) \
    + glob.glob(os.path.join('instance', '*.sqlite')) \
    + glob.glob(os.path.join('instance', '*.sqlite3'))

if not candidates:
    raise SystemExit(
        "Couldn't find a .db/.sqlite file automatically. "
        "Open this script and set DB_PATH manually to your database file "
        "(e.g. the path from SQLALCHEMY_DATABASE_URI in app.py)."
    )

DB_PATH = candidates[0]
print(f"Using database: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(user_settings)")
columns = [row[1] for row in cur.fetchall()]

if 'avatar' in columns:
    print("Column 'avatar' already exists - skipping.")
else:
    cur.execute("ALTER TABLE user_settings ADD COLUMN avatar TEXT")
    print("Added 'avatar' column to user_settings table.")

conn.commit()
conn.close()
print("Done.")