// src/common/middleware/errorHandler.js

import { ApiError } from '../utils/apiError.js';

export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const isApiError = err instanceof ApiError;

  const statusCode = isApiError ? err.status : err.statusCode || err.status || 500;
  const code = isApiError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isApiError ? err.message : (err.message || '서버 오류가 발생했습니다.');

  console.error('💥 에러 발생:', { statusCode, code, message });

  res.status(statusCode).json({
    success: false,
    code,
    message,
  });
};
