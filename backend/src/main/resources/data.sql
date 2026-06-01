-- Roles
INSERT IGNORE INTO roles (id, name, description) VALUES (1, 'USER', 'Standard User');
INSERT IGNORE INTO roles (id, name, description) VALUES (2, 'ADMIN', 'Administrator');

-- User Status
INSERT IGNORE INTO user_status (id, name) VALUES (1, 'ONLINE');
INSERT IGNORE INTO user_status (id, name) VALUES (2, 'OFFLINE');

-- Chat Types
INSERT IGNORE INTO chat_types (id, name) VALUES (1, 'PRIVATE');
INSERT IGNORE INTO chat_types (id, name) VALUES (2, 'GROUP');
INSERT IGNORE INTO chat_types (id, name) VALUES (3, 'ANNOUNCEMENT');

-- Message Types
INSERT IGNORE INTO message_types (id, name) VALUES (1, 'TEXT');
INSERT IGNORE INTO message_types (id, name) VALUES (2, 'IMAGE');
INSERT IGNORE INTO message_types (id, name) VALUES (3, 'FILE');
INSERT IGNORE INTO message_types (id, name) VALUES (4, 'SYSTEM');

-- Reset Auto Increment to 10
ALTER TABLE roles AUTO_INCREMENT = 10;
ALTER TABLE user_status AUTO_INCREMENT = 10;
ALTER TABLE chat_types AUTO_INCREMENT = 10;
ALTER TABLE message_types AUTO_INCREMENT = 10;

-- Super Admin User
INSERT IGNORE INTO users (full_name, username, email, password, role_id, status_id, created_at, updated_at) VALUES ('Roriri', 'Roriri', 'roriri@gmail.com', '$2a$10$dB70s3mZx/Lm7EXY35XRRu7yNgzY7PBBogamFuUfmlCoO9NHcQUmK', 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);