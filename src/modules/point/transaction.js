import { throwApiError } from '../../common/utils/throwApiErrors.js';
import { prisma } from '../../common/utils/prisma.js';
class PointTransaction {
  constructor(pointRepository, cooldownRepository, userRepository) {
    this.pointRepository = pointRepository;
    this.cooldownRepository = cooldownRepository;
    this.userRepository = userRepository;
  }

  postRandomPointEvent = (userId, reason, now, nextAllowedAt, points) => {
    return prisma.$transaction(async (tx) => {
      // 1) 쿨다운 행 존재 보장
      await this.cooldownRepository.ensureRow({ userId, reason }, tx);

      // 3) 선점(조건부 업데이트)
      const count = await this.cooldownRepository.conditionalReserve(
        { userId, reason, now, nextAllowedAt },
        tx
      );

      if (count !== 1) {
        const row = await this.cooldownRepository.getCooldown({ userId, reason }, tx);
        const currentNext = row?.nextAllowedAt ?? new Date(0);

        if (currentNext <= now) {
          // ① 쿨다운은 끝났는데도 실패 → 경쟁(동시성)으로 다른 요청이 먼저 선점
          throwApiError(
            'EVENT_CONCURRENCY_CONFLICT',
            '이미 처리된 요청입니다.',
            409 // Conflict
          );
        } else {
          // ② 쿨다운 미종료
          const remainMs = Math.max(0, currentNext.getTime() - now.getTime());
          const sec = Math.ceil(remainMs / 1000); // 올림: 1초 남아도 1로 보장
          const mins = Math.floor(sec / 60);
          const secs = sec % 60;
          throwApiError(
            'EVENT_COOLDOWN_ACTIVE',
            `아직 해당 이벤트 보상 재참여 가능 시간이 되지 않았습니다. ${mins}분 ${secs}초 후에 다시 시도해주세요.`,
            429, // Too Many Requests
            {
              retryAfterSeconds: Math.ceil((currentNext - now) / 1000),
              nextAllowedAt: currentNext.toISOString(),
              serverNow: now.toISOString(),
            }
          );
        }
      }

      // 4) 비즈니스 처리
      const user = await this.userRepository.incrementPoints({ userId, points }, tx);
      await this.pointRepository.createLog({ userId, amount: points, reason }, tx);

      return { points, totalPoints: user.points, nextAllowedAt };
    });
  };
}

export default PointTransaction;
