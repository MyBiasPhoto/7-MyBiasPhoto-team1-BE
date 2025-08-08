import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import authRouter from './src/modules/auth/routes.js';
import saleRouter from './src/modules/sale/routes.js';
import userRouter from './src/modules/user/routes.js';
import photoCardRouter from './src/modules/photoCard/routes.js';
import uploadRouter from './src/modules/photoCard/upload.js';
import { errorHandler } from './src/common/middleware/errorHandler.js';

dotenv.config();
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

// 테스트용으로 upload 폴더만 만들고 배포때는 다른 방식 사용(사진 저장)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('서버 실행 중');
});

app.use('/auth', authRouter);
app.use('/sales', saleRouter);

app.use('/users', userRouter);

app.use('/api/photoCard', photoCardRouter);
// 테스트용으로 upload 폴더만 만들고 배포때는 다른 방식 사용
app.use('/api/upload', uploadRouter);

app.use(errorHandler);

// app.use((err, req, res, next) => {
//   if (process.env.NODE_ENV === 'development') {
//     console.error(err.stack);
//   }

//   console.error('에러 메시지:', err.message);

//   const statusCode = err.statusCode || err.status || 500;
//   const message = err.message || '서버 오류가 발생했습니다.';
//   const code = err.code || 'INTERNAL_SERVER_ERROR';

//   res.status(statusCode).json({
//     success: false,
//     error: code,
//     message: message,
//   });
// });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중`);
});
