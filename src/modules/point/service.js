import { pickPoints } from '../../common/utils/pickPoints.js';
import { EPOCH } from '../../common/constants/date.js';
class PointService {
  constructor(pointRepository, pointTransaction, cooldownRepository) {
    this.pointRepository = pointRepository;
    this.pointTransaction = pointTransaction;
    this.cooldownRepository = cooldownRepository;
  }

  postRandomPointEvent = async (userId) => {
    const reason = 'RANDOM';
    const COOLDOWN_MIN = 60;
    const now = new Date();
    const nextAllowedAt = new Date(now.getTime() + COOLDOWN_MIN * 60 * 1000);
    const points = pickPoints();

    const randomPoint = await this.pointTransaction.postRandomPointEvent(
      userId,
      reason,
      now,
      nextAllowedAt,
      points
    );

    return randomPoint;
  };

  getRandomPointStatus = async (userId) => {
    const reason = 'RANDOM';
    const now = new Date();

    await this.cooldownRepository.ensureRow({ userId, reason });
    const row = await this.cooldownRepository.getCooldown({ userId, reason });
    const next = row?.nextAllowedAt ?? EPOCH;
    const remainingSeconds = Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 1000));

    return {
      active: remainingSeconds > 0,
      remainingSeconds,
      nextAllowedAt: next.toISOString(),
      serverNow: now.toISOString(),
    };
  };
}

export default PointService;
