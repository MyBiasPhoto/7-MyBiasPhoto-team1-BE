import { verifyToken } from '../utils/jwt.js';

export const verifyAccessToken = (req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) {
      throw new Error('accessToken이 존재하지 않습니다.');
    }

    const decoded = verifyToken(accessToken);

    req.user = {
      id: decoded.id,
      nickname: decoded.nickname,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'accessToken이 만료되었습니다.' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '유효하지 않은 accessToken입니다.' });
    }

    res.status(401).json({ message: error.message || 'accessToken 오류' });
  }
};
