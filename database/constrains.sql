-- Agents parent must exist and be agent

-- func to check agent have parent and parent must be admin
CREATE OR REPLACE FUNCTION validate_agent_parent() 
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR;
    parent_role VARCHAR;
BEGIN
    -- get curr role
    SELECT role_name INTO user_role 
    FROM roles 
    WHERE role_id = NEW.role_id;

    -- only when curr role is agent
    IF user_role = 'agent' THEN
        -- must exist parent
        IF NEW.parent_id IS NULL THEN
            RAISE EXCEPTION 'Agent must have a parent user';
        END IF;

        -- parent must be valid
        SELECT r.role_name INTO parent_role
        FROM users p
        JOIN roles r ON p.role_id = r.role_id
        WHERE p.user_id = NEW.parent_id;

        IF parent_role NOT IN ('super_admin', 'admin') THEN
            RAISE EXCEPTION 'Agent parent must be admin or super_admin';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_agent_parent
BEFORE INSERT OR UPDATE OF role_id, parent_id ON users
FOR EACH ROW EXECUTE FUNCTION validate_agent_parent();



-- func to check license app id must match type app id
CREATE FUNCTION check_app_consistency() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT app_id FROM license_types WHERE type_id = NEW.type_id) != NEW.app_id THEN
        RAISE EXCEPTION 'App ID mismatch between license key and license type';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_key_app_consistency
BEFORE INSERT OR UPDATE ON license_keys
FOR EACH ROW EXECUTE FUNCTION check_app_consistency();



-- func to set default expire date if card type is fixed
CREATE FUNCTION set_default_expires_at() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM license_types 
        WHERE type_id = NEW.type_id 
        AND deduction_mode = 'time' 
        AND validity_mode = 'fixed'
    ) THEN
        NEW.expires_at = NEW.created_at + (
            SELECT validity_duration 
            FROM license_types 
            WHERE type_id = NEW.type_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_expires_at
BEFORE INSERT ON license_keys
FOR EACH ROW EXECUTE FUNCTION set_default_expires_at();