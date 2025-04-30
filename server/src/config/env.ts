// src/config/env.ts
import 'dotenv/config';

export const ENV = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'kami_admin',
  DB_PASSWORD: process.env.DB_PASSWORD || '123',
  DB_NAME: process.env.DB_NAME || 'kami_system',
  PORT: process.env.PORT || 5013,

  JWT_SECRET: process.env.JWT_SECRET || 'test',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
};