// server.js
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './src/common/middleware/errorHandler.js';

//모듈 라우터
import authRouter from './src/modules/auth/routes.js';
import exchangeRouter from './src/modules/exchange/routes.js';
import photoCardRouter from './src/modules/photoCard/routes.js';
import uploadRouter from './src/modules/photoCard/upload.js';
import pointRouter from './src/modules/point/routes.js';
import saleRouter from './src/modules/sale/routes.js';
import userRouter from './src/modules/user/routes.js';
import notificationRouter from './src/modules/notification/routes.js';
// import { verifyAccessToken } from './src/common/middleware/verifyAccessToken.js';

const app = express();

const __dirname = path.resolve();

// 개발 편의상 모든 Origin 허용 (배포 시 origin 설정 필요)
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('서버 실행 중');
});

app.use('/auth', authRouter);
app.use('/sales', saleRouter);

app.use('/api/sales', exchangeRouter); //KJS

app.use('/users', userRouter);

app.use('/api/photoCard', photoCardRouter);

app.use('/points', pointRouter);

//알림 라우터
app.use('/notifications', notificationRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중`);
});
