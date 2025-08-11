import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
export const ACCESS_TTL = process.env.ACCESS_TTL ?? '10s';
export const REFRESH_TTL = process.env.REFRESH_TTL ?? '7d';

export function generateAccessToken(user) {
  const payload = { id: user.id, nickname: user.nickname, points: user.points, type: 'access' };
  return jwt.sign(payload, process.env.ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function generateRefreshJWT(user, jti = randomUUID()) {
  const payload = {
    id: user.id,
    nickname: user.nickname,
    points: user.points,
    type: 'refresh',
    jti,
  };
  const token = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: REFRESH_TTL });
  return { token, jti, expiresIn: REFRESH_TTL };
}

export function verifyAccessJWT(token) {
  return jwt.verify(token, process.env.ACCESS_SECRET);
}

export function verifyRefreshJWT(token) {
  return jwt.verify(token, process.env.REFRESH_SECRET);
}

export function parseExpiresToMs(expr) {
  const m = String(expr).match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = { s: 1e3, m: 60e3, h: 3600e3, d: 86400e3 }[m[2]];
  return n * unit;
}
