// src/app.ts
import express from 'express';
import cors from 'cors';
import { licenseRouter } from './routes/license.route';
import { errorHandler } from './middleware/errorHandler';
import { ENV } from './config/env';

const app = express();

// 中间件
app.use(cors({
    origin: '*',  // 允许所有来源
    methods: ['GET', 'POST'],  // 允许的 HTTP 方法
    allowedHeaders: ['Content-Type']  // 允许的请求头
  }));
app.use(express.json());

// 路由
app.use('/api/licenses', licenseRouter);

// 错误处理
app.use(errorHandler);

const port = Number(ENV.PORT) || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});