// src/middleware/errorHandler.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { APIError } from '../utils/apiResponse';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. 处理Zod校验错误
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: '请求参数校验失败',
      errors: err.errors
    });
    return;
  }

  // 2. 处理自定义API错误
  if (err instanceof APIError) {
    res.status(err.status).json({
      status: 'error',
      message: err.message,
      code: err.code
    });
    return;
  }

  // 3. 处理其他错误
  console.error('[Server Error]', err);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && {
      detail: err instanceof Error ? err.message : undefined
    })
  });
};