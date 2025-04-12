DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS license_keys CASCADE;
DROP TABLE IF EXISTS license_types CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 角色权限表
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL CHECK (role_name IN ('super_admin', 'admin', 'agent')),
    permissions JSONB NOT NULL DEFAULT '{}'
);

-- 用户表（包含后台管理人员）
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role_id INT REFERENCES roles(role_id) NOT NULL,
    parent_id INT REFERENCES users(user_id), -- 用于代理层级关系
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 应用表
CREATE TABLE applications (
    app_id SERIAL PRIMARY KEY,
    app_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    api_key VARCHAR(64) UNIQUE NOT NULL, -- 用于应用接入验证 (传输时传该key解析出id)
    owner_id INT REFERENCES users(user_id) NOT NULL, -- 应用所属用户
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 卡类型表
CREATE TABLE license_types (
    type_id SERIAL PRIMARY KEY,
    app_id INT REFERENCES applications(app_id) NOT NULL,
    type_name VARCHAR(50) NOT NULL,
    deduction_mode VARCHAR(20) CHECK (deduction_mode IN ('time', 'count')), -- 扣费模式
    validity_mode VARCHAR(20) CHECK (validity_mode IN ('fixed', 'activation')), -- 有效期计算方式
    validity_duration INTERVAL, -- 有效天数（当deduction_mode=time时使用）
    validity_counts INT, -- 有效次数（当deduction_mode=count时使用）
    max_devices INT DEFAULT 1, -- 允许绑定的最大设备数
    extra_config JSONB DEFAULT '{}' -- 扩展配置
);

-- 卡密主表
CREATE TABLE license_keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_value VARCHAR(50) UNIQUE NOT NULL,
    app_id INT REFERENCES applications(app_id) NOT NULL,
    type_id INT REFERENCES license_types(type_id) NOT NULL,
    creator_id INT REFERENCES users(user_id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    remaining_uses INT, -- 剩余使用次数（当deduction_mode=count时使用）
    machine_code VARCHAR(100), -- 绑定的机器码
    last_login_ip INET,
    last_used TIMESTAMP,
    is_ban BOOLEAN DEFAULT false,  -- 是否禁用
    custom_data JSONB DEFAULT '{}' -- 扩展字段
);

-- 使用日志表
CREATE TABLE usage_logs (
    log_id BIGSERIAL PRIMARY KEY,
    key_id UUID REFERENCES license_keys(key_id) NOT NULL,
    user_id INT REFERENCES users(user_id),
    event_type VARCHAR(20) NOT NULL,
    client_ip INET,
    machine_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);