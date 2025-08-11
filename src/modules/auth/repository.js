import bcrypt from 'bcryptjs';
import { prisma } from '../../common/utils/prisma.js';

class AuthRepository {
  async revokeById(id) {
    return prisma.refreshToken.update({ where: { id }, data: { revoked: true } });
  }
  async revokeByJti(jti) {
    return prisma.refreshToken.update({ where: { jti }, data: { revoked: true } });
  }
  async revokeAllByUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async isSameRawToken(hashed, raw) {
    return bcrypt.compare(raw, hashed);
  }

  // Rotation
  async saveRotationRT({ userId, jti, refreshToken, userAgent, ip, expiresAt }) {
    const hashed = await bcrypt.hash(refreshToken, 12);
    return prisma.refreshToken.create({
      data: { userId, jti, hashed, userAgent, ip, expiresAt },
    });
  }
  async findByJti(jti) {
    return prisma.refreshToken.findUnique({ where: { jti } });
  }

  // Sliding
  async saveSlidingRT({ userId, opaqueId, refreshToken, userAgent, ip, expiresAt }) {
    const hashed = await bcrypt.hash(refreshToken, 12);
    return prisma.refreshToken.create({
      data: { userId, opaqueId, hashed, userAgent, ip, expiresAt, lastUsedAt: new Date() },
    });
  }
  async findByOpaqueId(opaqueId) {
    return prisma.refreshToken.findUnique({ where: { opaqueId } });
  }
  async updateSlidingOnUse(id, { extendsMs }) {
    const now = Date.now();
    return prisma.refreshToken.update({
      where: { id },
      data: { lastUsedAt: new Date(now), expiresAt: new Date(now + extendsMs) },
    });
  }
}

export default AuthRepository;
