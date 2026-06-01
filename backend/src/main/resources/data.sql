-- Roles
INSERT INTO roles (id, name, description) VALUES (1, 'USER', 'Standard User') ON CONFLICT DO NOTHING;
INSERT INTO roles (id, name, description) VALUES (2, 'ADMIN', 'Administrator') ON CONFLICT DO NOTHING;

-- User Status
INSERT INTO user_status (id, name) VALUES (1, 'ONLINE') ON CONFLICT DO NOTHING;
INSERT INTO user_status (id, name) VALUES (2, 'OFFLINE') ON CONFLICT DO NOTHING;

-- Chat Types
INSERT INTO chat_types (id, name) VALUES (1, 'PRIVATE') ON CONFLICT DO NOTHING;
INSERT INTO chat_types (id, name) VALUES (2, 'GROUP') ON CONFLICT DO NOTHING;
INSERT INTO chat_types (id, name) VALUES (3, 'ANNOUNCEMENT') ON CONFLICT DO NOTHING;

-- Message Types
INSERT INTO message_types (id, name) VALUES (1, 'TEXT') ON CONFLICT DO NOTHING;
INSERT INTO message_types (id, name) VALUES (2, 'IMAGE') ON CONFLICT DO NOTHING;
INSERT INTO message_types (id, name) VALUES (3, 'FILE') ON CONFLICT DO NOTHING;
INSERT INTO message_types (id, name) VALUES (4, 'SYSTEM') ON CONFLICT DO NOTHING;

-- Reset Sequences to 10
ALTER SEQUENCE roles_id_seq RESTART WITH 10;
ALTER SEQUENCE user_status_id_seq RESTART WITH 10;
ALTER SEQUENCE chat_types_id_seq RESTART WITH 10;
ALTER SEQUENCE message_types_id_seq RESTART WITH 10;

-- Super Admin User
INSERT INTO users (full_name, username, email, password, role_id, status_id, created_at, updated_at) VALUES ('Roriri', 'Roriri', 'roriri@gmail.com', '$2a$10$dB70s3mZx/Lm7EXY35XRRu7yNgzY7PBBogamFuUfmlCoO9NHcQUmK', 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
ON CONFLICT (username) DO NOTHING;