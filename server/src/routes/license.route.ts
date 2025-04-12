// src/routes/license.route.ts
import { Router } from 'express';
import { LicenseController } from '../controllers/license.controller';

export const licenseRouter = Router();

// 直接使用控制器方法
licenseRouter.post('/login', LicenseController.login);