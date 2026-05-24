-- Users table
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE
);

-- Clothes table
CREATE TABLE clothes (
    cloth_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    color TEXT,
    size TEXT,
    purchase_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Usage stats table
CREATE TABLE outfit_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cloth_id INTEGER,
    date_used DATE,
    occasion TEXT,
    FOREIGN KEY (cloth_id) REFERENCES clothes(cloth_id)
);

-- Calendar info table
CREATE TABLE calendar_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_date DATE,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
