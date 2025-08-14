import { EPOCH } from '../../common/constants/date.js';
import { prisma } from '../../common/utils/prisma.js';
class CooldownRepository {
  ensureRow = async ({ userId, reason }, client = prisma) => {
    await client.pointCooldown.upsert({
      where: { userId_reason: { userId, reason } },
      create: { userId, reason, nextAllowedAt: EPOCH },
      update: {},
    });
  };

  conditionalReserve = async ({ userId, reason, now, nextAllowedAt }, client = prisma) => {
    const { count } = await client.pointCooldown.updateMany({
      where: {
        userId,
        reason,
        nextAllowedAt: { lte: now },
      },
      data: { nextAllowedAt },
    });
    return count;
  };

  getCooldown = async ({ userId, reason }, client = prisma) => {
    return client.pointCooldown.findUnique({
      where: { userId_reason: { userId, reason } },
      select: { nextAllowedAt: true, updatedAt: true },
    });
  };

  reset = async ({ userId, reason }, client = prisma) => {
    await client.pointCooldown.update({
      where: { userId_reason: { userId, reason } },
      data: { nextAllowedAt: EPOCH },
    });
  };
}
export default CooldownRepository;
