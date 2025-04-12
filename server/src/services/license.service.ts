// src/services/license.service.ts
import { LicenseDAO } from '../dao/license.dao';
import { APIResponse } from '../utils/apiResponse';

export class LicenseService {
  // 生成卡密 key 的辅助方法，根据 pattern 生成 key_value
  private static generateLicenseKey(pattern: string): string {
    if (!pattern.includes('*')) return pattern;
    const prefix = pattern.split('*')[0];
    // 随机部分长度（例如 10 个字符）
    const randomLength = 10;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < randomLength; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + randomPart;
  }

  static async verifyLicense(key: string, machineCode: string, clientIp: string) {
    const license = await LicenseDAO.getLicenseByKey(key);
    
    if (!license) throw APIResponse.error('卡密不存在', 404, 'LICENSE_NOT_FOUND');
    if (license.is_ban) throw APIResponse.error('卡密已被禁用', 403, 'LICENSE_BANNED');
    
    // 添加日期类型断言
    if (license.expires_at && new Date() > new Date(license.expires_at)) {
      throw APIResponse.error('卡密已过期', 403, 'LICENSE_EXPIRED');
    }

    await LicenseDAO.updateUsage(license.key_id, {
      machineCode,
      clientIp,
      lastUsed: new Date()
    });

// Log the usage
    await LicenseDAO.insertUsageLog({
      keyId: license.key_id,
      eventType: 'verify_license',
      clientIp,
      machineCode
    });

    return APIResponse.success({
      status: 'active',
      custom_data: license.custom_data
    });
  }

    // 辅助方法：解析 PostgreSQL INTERVAL 字符串为毫秒数 
    //TODO: 放进UTILS
  private static parseDuration(interval: string): number {
    const match = interval.match(/(\d+)\s*(day|hour|minute|second)s?/i);
    if (!match) throw new Error(`Invalid interval format: ${interval}`);

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'day':
        return value * 24 * 60 * 60 * 1000; // 天 -> 毫秒
      case 'hour':
        return value * 60 * 60 * 1000; // 小时 -> 毫秒
      case 'minute':
        return value * 60 * 1000; // 分钟 -> 毫秒
      case 'second':
        return value * 1000; // 秒 -> 毫秒
      default:
        throw new Error(`Unsupported interval unit: ${unit}`);
    }
  }

  static async createLicense(data: {
    pattern: string;
    appId: number;
    typeId: number;
    creatorId: number;
    customData?: any;
  }) {
    // 生成 key_value
    const key_value = this.generateLicenseKey(data.pattern);

    // 获取卡类型信息，判断扣费模式
    const licenseType = await LicenseDAO.getLicenseTypeById(data.typeId);
    const remainingUses = licenseType.deduction_mode === 'count' ? licenseType.validity_counts : null;
    const expiresAt =
    licenseType.validity_mode === 'fixed' && licenseType.validity_duration
      ? new Date(Date.now() + this.parseDuration(licenseType.validity_duration))
      : null;
    // 对于 activation 类型的卡密，始终设置 expires_at 为 null，
    // 即等待首次登录时计算实际的过期时间
    const newLicense = await LicenseDAO.createLicense({
      key_value,
      app_id: data.appId,
      type_id: data.typeId,
      creator_id: data.creatorId,
      expires_at: expiresAt, // 激活卡忽略 expires_at
      remaining_uses: remainingUses,
      custom_data: data.customData || {}
    });

    return APIResponse.success(newLicense);
  }
}