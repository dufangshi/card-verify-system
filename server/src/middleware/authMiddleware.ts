import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => { // 明确声明返回类型为 void
  const authHeader = req.headers.authorization;

  // 使用非空断言和可选链操作符
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: '未提供有效的 Token' });
    return; // 终止执行但不返回任何值
  }

  const token = authHeader.split(' ')[1];

  try {
    // 验证并合并到请求体
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.body = decoded; // 合并解码数据
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Token 无效或已过期' });
  }
};