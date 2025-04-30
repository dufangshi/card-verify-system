import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { UserService } from '../services/user.service';
import { ENV } from '../config/env';

export class UserController {
  static login: RequestHandler = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        status: 'error',
        message: '用户名和密码不能为空'
      });
      return; // 提前结束函数执行
    }

    try {
      const result = await UserService.login(username, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  static getUserData: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "error",
        message: "未提供有效的 Token",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      const result = await UserService.getUserByToken(token);
      res.json(result);
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
}