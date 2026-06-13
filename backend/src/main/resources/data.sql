-- Roles
INSERT INTO roles (id, name, description) VALUES (1, 'USER', 'Standard User')
ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, name, description) VALUES (2, 'ADMIN', 'Administrator')
ON CONFLICT (id) DO NOTHING;

-- User Status
INSERT INTO user_status (id, name) VALUES (1, 'ONLINE')
ON CONFLICT (id) DO NOTHING;
INSERT INTO user_status (id, name) VALUES (2, 'OFFLINE')
ON CONFLICT (id) DO NOTHING;

-- Chat Types
INSERT INTO chat_types (id, name) VALUES (1, 'PRIVATE')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_types (id, name) VALUES (2, 'GROUP')
ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_types (id, name) VALUES (3, 'ANNOUNCEMENT')
ON CONFLICT (id) DO NOTHING;

-- Message Types
INSERT INTO message_types (id, name) VALUES (1, 'TEXT')
ON CONFLICT (id) DO NOTHING;
INSERT INTO message_types (id, name) VALUES (2, 'IMAGE')
ON CONFLICT (id) DO NOTHING;
INSERT INTO message_types (id, name) VALUES (3, 'FILE')
ON CONFLICT (id) DO NOTHING;
INSERT INTO message_types (id, name) VALUES (4, 'SYSTEM')
ON CONFLICT (id) DO NOTHING;

-- Super Admin User
INSERT INTO users (full_name, username, email, password, role_id, status_id, created_at, updated_at) VALUES ('Rekshin', 'Rekshin', 'amalrekshin@gmail.com', '$2a$10$rekshin#01', 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;