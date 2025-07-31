import { verifyToken } from '../utils/jwt.js';

export const verifyRefreshToken = (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: 'refreshToken이 존재하지 않습니다.' });
  }

  try {
    const decoded = verifyToken(refreshToken);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'refreshToken이 만료되었습니다.'
        : '유효하지 않은 refreshToken입니다.';

    res.status(401).json({ message });
  }
};
