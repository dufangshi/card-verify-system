import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export class TokenService {
  /**
   * 校验 JWT Token 是否有效
   * @param token - 待校验的 JWT Token
   * @returns 解码后的 Token 数据或抛出错误
   */
  static validateToken(token: string): { valid: boolean; data?: any; error?: string } {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      return {
        valid: true,
        data: decoded
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Token 无效或已过期'
      };
    }
  }
}