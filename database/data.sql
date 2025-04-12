-- 必须首先单独执行（不能在事务块内）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 阶段1：基础数据（角色 + 超级管理员）
BEGIN;
-- 清空旧数据（可选，首次部署时不需要）
TRUNCATE TABLE license_keys, license_types, applications, users, roles CASCADE;

-- 插入角色
INSERT INTO roles (role_name, permissions) VALUES 
('super_admin', '{"*": true}'),
('admin', '{"keys.create": true, "keys.view": true}'),
('agent', '{"keys.view": true}');

-- 插入超级管理员（无父用户）
INSERT INTO users (username, password_hash, role_id) VALUES (
    'root_admin', 
    crypt('admin123', gen_salt('bf')), 
    (SELECT role_id FROM roles WHERE role_name = 'super_admin')
);
COMMIT;

-- 阶段2：代理用户（依赖超级管理员）
BEGIN;
INSERT INTO users (username, password_hash, role_id, parent_id) VALUES (
    'agent01',
    crypt('agent123', gen_salt('bf')),
    (SELECT role_id FROM roles WHERE role_name = 'agent'),
    (SELECT user_id FROM users WHERE username = 'root_admin')
);
COMMIT;

-- 阶段3：应用（依赖用户）
BEGIN;
INSERT INTO applications (app_name, description, api_key, owner_id) VALUES (
    'App1', 
    'First application', 
    gen_random_uuid(), 
    (SELECT user_id FROM users WHERE username = 'root_admin')
);
COMMIT;

-- 阶段4：卡类型（依赖应用）
BEGIN;
INSERT INTO license_types (app_id, type_name, deduction_mode, validity_mode, validity_duration) VALUES (
    (SELECT app_id FROM applications WHERE app_name = 'App1'),
    '7天激活卡',
    'time',
    'activation',
    '7 days'::INTERVAL
);
COMMIT;

-- 阶段5：卡密（依赖所有前置数据）
BEGIN;
INSERT INTO license_keys (key_value, app_id, type_id, creator_id) VALUES (
    'ABCD-EFGH-IJKL',
    (SELECT app_id FROM applications WHERE app_name = 'App1'),
    (SELECT type_id FROM license_types WHERE type_name = '7天激活卡'),
    (SELECT user_id FROM users WHERE username = 'root_admin')
);
COMMIT;

-- 阶段6：验证数据（可选）
BEGIN;
-- 查看所有用户
SELECT u.username, r.role_name, p.username AS parent 
FROM users u
JOIN roles r ON u.role_id = r.role_id
LEFT JOIN users p ON u.parent_id = p.user_id;

-- 查看应用和卡类型
SELECT a.app_name, t.type_name, t.validity_duration 
FROM applications a
JOIN license_types t ON a.app_id = t.app_id;

-- 查看卡密信息
SELECT k.key_value, a.app_name, t.type_name, u.username AS creator
FROM license_keys k
JOIN applications a ON k.app_id = a.app_id
JOIN license_types t ON k.type_id = t.type_id
JOIN users u ON k.creator_id = u.user_id;
COMMIT;


CREATE OR REPLACE FUNCTION validate_agent_parent() 
RETURNS TRIGGER AS $$
DECLARE
    parent_rec RECORD;
BEGIN
    -- 只检查新插入或更新的代理用户
    IF (SELECT role_name FROM roles WHERE role_id = NEW.role_id) = 'agent' THEN
        -- 检查父用户是否存在（包含未提交数据）
        SELECT u.*, r.role_name 
        INTO parent_rec
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = NEW.parent_id
        FOR UPDATE; -- 关键：允许访问未提交数据

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Parent user not found for agent';
        ELSIF parent_rec.role_name NOT IN ('super_admin', 'admin') THEN
            RAISE EXCEPTION 'Invalid parent role: %', parent_rec.role_name;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;