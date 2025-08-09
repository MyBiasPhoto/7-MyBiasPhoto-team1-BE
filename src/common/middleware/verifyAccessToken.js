import { verifyAccessJWT } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

export const verifyAccessToken = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return next(new ApiError('AUTH_AT_MISSING', 'accessToken이 존재하지 않습니다.', 401));
    }

    const decoded = verifyAccessJWT(token);

    req.user = {
      id: decoded.id,
      nickname: decoded.nickname,
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError('AUTH_AT_EXPIRED', 'accessToken이 만료되었습니다.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError('AUTH_AT_INVALID', '유효하지 않은 accessToken입니다.', 401));
    }
    return next(new ApiError('AUTH_AT_ERROR', err.message || 'accessToken 오류', 401));
  }
};
