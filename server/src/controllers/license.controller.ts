// src/controllers/license.controller.ts
import { RequestHandler } from "express";
import { LicenseService } from "../services/license.service";
import { LoginSchema, PaginationSchema } from "../models/schemas";
import { TokenService } from "../services/token.service";

export class LicenseController {
  static login: RequestHandler = async (req, res, next) => {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: "error",
        message: "参数校验失败",
        errors: validation.error.errors,
      });
      return;
    }

    try {
      const clientIp = req.ip ?? req.socket.remoteAddress ?? "unknown";
      const result = await LicenseService.verifyLicense(
        validation.data.license_key,
        validation.data.machine_code,
        clientIp
      );
      console.log(result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  static create: RequestHandler = async (req, res, next) => {
    /* 
      制作卡密 API 的请求示例：
      {
        "pattern": "AAA*",
        "appId": 1,
        "typeId": 2,
        "customData": {"info": "测试卡密"},
        "quantity": 5, // 生成卡密数量
        "expiresAt": "2025-12-31T23:59:59Z"  // 对 activation 类型该参数会被忽略
      }
    */
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          status: "error",
          message: "未提供有效的 Token",
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      const TokenResult = TokenService.validateToken(token);
      if (!TokenResult.valid) {
        res.status(401).json({
          status: "error",
          message: TokenResult.error,
        });
        return;
      }

      // 从解码后的 Token 中获取 user_id
      const userId = TokenResult.data?.userId;
      if (!userId) {
        res.status(401).json({
          status: "error",
          message: "Token 无效，无法获取用户信息",
        });
        return;
      }

      const { pattern, appId, typeId, customData, quantity } = req.body;
      // 默认数量为1
      const qty = Number(quantity) > 0 ? Number(quantity) : 1;

      // 调用服务层方法，生成多个卡密
      const result = await LicenseService.createLicenses({
        pattern,
        appId,
        typeId,
        creatorId: userId,
        customData,
        quantity: qty
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  static getInfo: RequestHandler = async (req, res, next) => {
    try {
      const { key } = req.query;
      // console.log(key);

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          status: "error",
          message: "未提供有效的 Token",
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      const TokenResult = TokenService.validateToken(token);

      if (!TokenResult.valid) {
        res.status(401).json({
          status: "error",
          message: TokenResult.error,
        });
        return;
      }

      if (typeof key !== "string") {
        res.status(400).json({
          status: "error",
          message: "Invalid key parameter",
        });
        return;
      }

      const result = await LicenseService.getLicenseInfo(key);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // 修改方法名和参数处理
  static getAllKey: RequestHandler = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          status: "error",
          message: "未提供有效的 Token",
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      const TokenResult = TokenService.validateToken(token);

      if (!TokenResult.valid) {
        res.status(401).json({
          status: "error",
          message: TokenResult.error,
        });
        return;
      }

      // 从解码后的 Token 中获取 user_id
      const userId = TokenResult.data?.userId;
      if (!userId) {
        res.status(401).json({
          status: "error",
          message: "Token 无效，无法获取用户信息",
        });
        return;
      }

      // 添加 Zod 校验
      const pagination = PaginationSchema.parse({
        page: Number(req.query.page) || 1,
        pageSize: Number(req.query.pageSize) || 30,
      });

      // 调用服务层方法，传入 userId
      const result = await LicenseService.getAllKeyByUser(
        userId,
        pagination.page,
        pagination.pageSize
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  static deleteLicense: RequestHandler = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          status: "error",
          message: "未提供有效的 Token",
        });
        return;
      }
      const token = authHeader.split(" ")[1];
      const TokenResult = TokenService.validateToken(token);
      if (!TokenResult.valid) {
        res.status(401).json({
          status: "error",
          message: TokenResult.error,
        });
        return;
      }

      // 从解码后的 Token 中获取 user_id
      const userId = TokenResult.data?.userId;
      if (!userId) {
        res.status(401).json({
          status: "error",
          message: "Token 无效，无法获取用户信息",
        });
        return;
      }

      // 从请求 body 获取待删除的卡密 licenseKeys（数组形式）
      const { licenseKeys } = req.body;
      if (!Array.isArray(licenseKeys) || !licenseKeys.every((key) => typeof key === "string")) {
        res.status(400).json({
          status: "error",
          message: "无效的 licenseKeys 参数，必须为字符串数组",
        });
        return;
      }

      const result = await LicenseService.batchDeleteLicenses(userId, licenseKeys);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
