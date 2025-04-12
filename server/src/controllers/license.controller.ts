// src/controllers/license.controller.ts
import { RequestHandler } from 'express';
import { LicenseService } from '../services/license.service';
import { LoginSchema } from '../models/schemas'; 

export class LicenseController {
  static login: RequestHandler = async (req, res, next) => {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        message: '参数校验失败',
        errors: validation.error.errors
      });
      return;
    }

    try {
      const clientIp = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const result = await LicenseService.verifyLicense(
        validation.data.license_key,
        validation.data.machine_code,
        clientIp
      );
      console.log(result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  static create: RequestHandler = async (req, res, next) => {
    /* 
      制作卡密 API 的请求示例：
      {
        "pattern": "AAA*",
        "appId": 1,
        "typeId": 2,
        "creatorId": 3,
        "customData": {"info": "测试卡密"},
        "expiresAt": "2025-12-31T23:59:59Z"  // 对 activation 类型该参数会被忽略
      }
    */
    try {
      const {
        pattern,
        appId,
        typeId,
        creatorId,
        customData
      } = req.body;

      // 可添加必要的参数校验（如通过 zod 或 Joi 等）

      const result = await LicenseService.createLicense({
        pattern,
        appId,
        typeId,
        creatorId,
        customData
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}