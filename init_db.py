import sqlite3

conn = sqlite3.connect('closet.db')
cursor = conn.cursor()


cursor.execute('''
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
)
''')


cursor.execute('''
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
)
''')


#Login log table (powers "live" login activity on the admin dashboard)
cursor.execute('''
CREATE TABLE login_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
''')

# Clothes table
cursor.execute('''
CREATE TABLE clothes (
    cloth_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    color TEXT,
    size TEXT,
    purchase_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
''')

# Usage stats table
cursor.execute('''
CREATE TABLE outfit_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cloth_id INTEGER,
    date_used DATE,
    occasion TEXT,
    FOREIGN KEY (cloth_id) REFERENCES clothes(cloth_id)
)
''');

#Calendar info table
cursor.execute('''
CREATE TABLE calendar_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_date DATE,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
''');