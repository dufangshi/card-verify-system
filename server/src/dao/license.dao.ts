// src/dao/license.dao.ts
import { pool } from "../config/db";

// 定义完整的License类型
interface LicenseRecord {
  key_id: string;
  key_value: string;
  app_id: number;
  type_id: number;
  creator_id: number;
  created_at: Date;
  activated_at: Date | null;
  expires_at: Date | null;
  remaining_uses: number | null;
  machine_code: string | null;
  last_login_ip: string | null;
  last_used: Date | null;
  is_ban: boolean;
  custom_data: any;
  validity_mode?: string; // 从关联表获取的字段
  deduction_mode?: string;
}

interface LicenseUpdate {
  machineCode: string;
  clientIp: string;
  lastUsed: Date;
}

interface UsageLog {
  keyId: string;
  userId?: number; // Optional, as it might not always be available
  eventType: string;
  clientIp: string;
  machineCode: string;
}

export class LicenseDAO {
  private static mapLicenseRow(row: any): LicenseRecord {
    return {
      ...row,
      created_at: new Date(row.created_at),
      activated_at: row.activated_at ? new Date(row.activated_at) : null,
      expires_at: row.expires_at ? new Date(row.expires_at) : null,
      last_used: row.last_used ? new Date(row.last_used) : null,
    };
  }

  // 新增：根据 typeId 获取卡类型信息
  static async getLicenseTypeById(typeId: number): Promise<{
    deduction_mode: string;
    validity_counts: number | null;
    validity_mode: string;
    validity_duration: string | null; // INTERVAL 类型在 PostgreSQL 中通常映射为字符串
  }> {
    const query = `
      SELECT deduction_mode, validity_counts, validity_mode, validity_duration
      FROM license_types
      WHERE type_id = $1
    `;
    const { rows } = await pool.query(query, [typeId]);
    if (!rows[0]) {
      throw new Error("License type not found");
    }
    return rows[0];
  }

  static async getLicenseByKey(key: string): Promise<LicenseRecord | null> {
    const query = `
      SELECT k.*, t.validity_mode, t.deduction_mode
      FROM license_keys k
      JOIN license_types t ON k.type_id = t.type_id
      WHERE key_value = $1
    `;
    const { rows } = await pool.query(query, [key]);
    return rows[0] ? this.mapLicenseRow(rows[0]) : null;
  }

  static async updateUsage(keyId: string, data: LicenseUpdate): Promise<void> {
    const query = `
      UPDATE license_keys
      SET 
        machine_code = $1,
        last_login_ip = $2,
        last_used = $3
      WHERE key_id = $4
    `;
    await pool.query(query, [
      data.machineCode,
      data.clientIp,
      data.lastUsed.toISOString(), // 明确转换为ISO格式
      keyId,
    ]);
  }

  static async insertUsageLog(log: UsageLog): Promise<void> {
    const query = `
      INSERT INTO usage_logs (key_id, user_id, event_type, client_ip, machine_code, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `;
    await pool.query(query, [
      log.keyId,
      log.userId || null, // Use null if userId is not provided
      log.eventType,
      log.clientIp,
      log.machineCode,
    ]);
  }

  static async createLicense(licenseData: {
    key_value: string;
    app_id: number;
    type_id: number;
    creator_id: number;
    expires_at?: Date | null;
    remaining_uses?: number | null;
    custom_data?: any;
  }): Promise<LicenseRecord> {
    const query = `
      INSERT INTO license_keys (key_value, app_id, type_id, creator_id, expires_at, remaining_uses, custom_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      licenseData.key_value,
      licenseData.app_id,
      licenseData.type_id,
      licenseData.creator_id,
      licenseData.expires_at ? licenseData.expires_at.toISOString() : null,
      licenseData.remaining_uses || null,
      licenseData.custom_data || {},
    ]);
    if (!rows[0]) {
      throw new Error("Create license failed");
    }
    return this.mapLicenseRow(rows[0]);
  }

  // 新增分页查询方法
  static async getAllKeys(
    page: number,
    pageSize: number
  ): Promise<{
    items: LicenseRecord[];
    total: number;
  }> {
    const offset = (page - 1) * pageSize;
    const query = `
    SELECT *, count(*) OVER() AS total_count 
    FROM license_keys 
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
    const { rows } = await pool.query(query, [pageSize, offset]);

    return {
      items: rows.map(this.mapLicenseRow),
      total: rows[0] ? Number(rows[0].total_count) : 0,
    };
  }

  static async getAllKeysByUser(
    userId: number,
    page: number,
    pageSize: number
  ): Promise<{
    items: LicenseRecord[];
    total: number;
  }> {
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT *, count(*) OVER() AS total_count 
      FROM license_keys 
      WHERE creator_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(query, [userId, pageSize, offset]);

    return {
      items: rows.map(this.mapLicenseRow),
      total: rows[0] ? Number(rows[0].total_count) : 0,
    };
  }

  static async deleteLicense(
    licenseKey: string,
    userId: number
  ): Promise<void> {
    const query = `
      DELETE FROM license_keys
      WHERE key_value = $1 AND creator_id = $2
    `;
    const result = await pool.query(query, [licenseKey, userId]);
    if (result.rowCount === 0) {
      throw new Error("未找到对应卡密或无删除权限");
    }
  }
  static async batchDeleteLicenses(
    userId: number,
    licenseKeys: string[]
  ): Promise<number> {
    const query = `
        DELETE FROM license_keys
        WHERE key_value = ANY($1) AND creator_id = $2
    `;
    const result = await pool.query(query, [licenseKeys, userId]);
    return result.rowCount ?? 0;
  }
}
