import { z } from 'zod';

/**
 * Zod 스키마를 사용하여 특정 요청 부분(body, params, query)의 유효성을 검사하는 미들웨어 팩토리 함수.
 * @param {object} schema - 유효성을 검사할 Zod 스키마.
 * @param {'body' | 'params' | 'query'} [type='body'] - 검사할 요청 부분의 타입 (기본값: 'body').
 * @returns {function(req, res, next): void} Express.js 미들웨어 함수.
 */
export const validate =
  (schema, type = 'body') =>
  (req, res, next) => {
    try {
      let dataToValidate;
      if (type === 'params') {
        dataToValidate = req.params;
      } else if (type === 'query') {
        dataToValidate = req.query;
      } else {
        dataToValidate = req.body;
      }
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: '유효성 검사 실패',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
