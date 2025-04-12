// src/models/schemas.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  license_key: z.string().min(8),
  machine_code: z.string().min(6)
});