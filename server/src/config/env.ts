// src/config/env.ts
import 'dotenv/config';

export const ENV = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'card',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password123',
  DB_NAME: process.env.DB_NAME || 'carddb',
  PORT: process.env.PORT || 5013
};