import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', UserController.login);

// 需要登录验证的路由
router.get('/profile', authMiddleware, (req, res) => {
  const user = req.body; // 解码后的用户信息
  res.json({
    status: 'success',
    data: user
  });
});

// 新增：通过 token 查询用户数据
router.get("/getUserData", UserController.getUserData);


export default router;