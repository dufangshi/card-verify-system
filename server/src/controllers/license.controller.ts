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
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}