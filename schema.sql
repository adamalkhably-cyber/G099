-- Users Table (identify user account)
CREATE TABLE users (
user_id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL
);

-- Clothes Table (identify user clothes)
CREATE TABLE clothes (
clothes_id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
name TEXT NOT NULL,
category TEXT,
image_path TEXT,
usage_count INTEGER DEFAULT 0,
FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Outfit usage table (tracks calendar + stats)
CREATE TABLE outfit_usage (
usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
clothes_id INTEGER NOT NULL,
date_used DATE NOT NULL,
planned BOOLEAN DEFAULT 0,
FOREIGN KEY (user_id) REFERENCES users(user_id),
FOREIGN KEY (clothes_id) REFERENCES clothes(clothes_id)
);
