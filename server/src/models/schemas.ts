// src/models/schemas.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  license_key: z.string().min(8),
  machine_code: z.string().min(6)
});

// 分页参数校验
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(30)
});