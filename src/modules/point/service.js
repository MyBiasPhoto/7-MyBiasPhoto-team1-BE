import { pickPoints } from '../../common/utils/pickPoints.js';
class PointService {
  constructor(pointRepository, pointTransaction) {
    this.pointRepository = pointRepository;
    this.pointTransaction = pointTransaction;
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
}

export default PointService;
