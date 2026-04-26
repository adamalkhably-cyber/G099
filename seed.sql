-- Add sample users
INSERT INTO users (username, password_hash)
VALUES ('rare', 'hashedpassword'),
       ('alex', 'anotherhash');

-- Add sample clothes
INSERT INTO clothes (user_id, name, category, image_path, usage_count)
VALUES (1, 'Blue Jeans', 'Jeans', '/images/bluejeans.jpg', 0),
       (1, 'White T-Shirt', 'Shirt', '/images/whitetshirt.jpg', 0);

-- Add sample outfit usage
INSERT INTO outfit_usage (user_id, clothes_id, date_used, planned)
VALUES (1, 1, '2026-04-20', 0),
       (1, 2, '2026-04-21', 1);
