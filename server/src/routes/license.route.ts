// src/routes/license.route.ts
import { Router } from 'express';
import { LicenseController } from '../controllers/license.controller';

export const licenseRouter = Router();

licenseRouter.post('/login', LicenseController.login);

licenseRouter.post('/create', LicenseController.create);