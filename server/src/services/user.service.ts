import jwt from "jsonwebtoken";
import { UserDAO } from "../dao/user.dao";
import { APIResponse } from "../utils/apiResponse";
import { ENV } from "../config/env";

export class UserService {
  static async login(username: string, password: string) {
    const user = await UserDAO.getUserByUsername(username);
    if (!user) {
      throw APIResponse.error("用户不存在", 404, "USER_NOT_FOUND");
    }

    const isPasswordValid = await UserDAO.verifyPassword(
      password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw APIResponse.error("密码错误", 401, "INVALID_PASSWORD");
    }

    // 更新最后登录时间
    await UserDAO.updateLastLogin(user.user_id);

    // 生成 JWT Token
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        roleId: user.role_id,
      },
      ENV.JWT_SECRET,
      { expiresIn: "30m" }
    );

    // 返回用户信息和 Token
    return APIResponse.success({
      userId: user.user_id,
      username: user.username,
      roleId: user.role_id,
      token,
    });
  }

  static async getUserByToken(token: string) {
    try {
      // 验证并解码 Token
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: number };

      // 根据解码后的 userId 查询用户数据
      const user = await UserDAO.getUserById(decoded.userId);
      if (!user) {
        throw APIResponse.error("用户不存在", 404, "USER_NOT_FOUND");
      }

      // 返回用户数据（过滤敏感字段，如 password_hash）
      const { password_hash, ...userData } = user;
      return APIResponse.success(userData);
    } catch (error) {
      throw APIResponse.error("Token 无效或已过期", 401, "INVALID_TOKEN");
    }
  }
}
