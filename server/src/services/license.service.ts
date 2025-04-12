// src/services/license.service.ts
import { LicenseDAO } from '../dao/license.dao';
import { APIResponse } from '../utils/apiResponse';

export class LicenseService {
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

    return APIResponse.success({
      status: 'active',
      custom_data: license.custom_data
    });
  }
}