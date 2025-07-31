import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';

dotenv.config();
const app = express();

// 개발 편의상 모든 Origin 허용 (배포 시 origin 설정 필요)
app.use(
  cors({
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('서버 실행 중');
});

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  console.error('에러 메시지:', err.message);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '서버 오류가 발생했습니다.';

  res.status(statusCode).json({
    success: false,
    message: message,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('서버 실행됨');
});
