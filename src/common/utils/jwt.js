import jwt from 'jsonwebtoken';

export const generateToken = (user, type) => {
  const payload = type === 'refresh' ? { id: user.id } : { id: user.id, nickname: user.nickname };
  const options = { expiresIn: type === 'refresh' ? '1w' : '1h' };
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
