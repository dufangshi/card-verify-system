// src/dao/license.dao.ts
import { pool } from '../config/db';

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
  validity_mode?: string;  // 从关联表获取的字段
  deduction_mode?: string;
}

interface LicenseUpdate {
  machineCode: string;
  clientIp: string;
  lastUsed: Date;
}

export class LicenseDAO {
  private static mapLicenseRow(row: any): LicenseRecord {
    return {
      ...row,
      created_at: new Date(row.created_at),
      activated_at: row.activated_at ? new Date(row.activated_at) : null,
      expires_at: row.expires_at ? new Date(row.expires_at) : null,
      last_used: row.last_used ? new Date(row.last_used) : null
    };
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
      keyId
    ]);
  }
}