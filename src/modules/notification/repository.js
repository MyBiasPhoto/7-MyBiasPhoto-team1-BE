// src/modules/notification/repository.js

import { prisma } from '../../common/utils/prisma.js';

class NotificationRepository {
  // 목록 조회: 최신순(DESC), 커서 기반( id < cursor )
  // 이 유저의 최근 N개 가져오기
  async findManyByUser({ userId, cursor, limit, unreadOnly, types }, client = prisma) {
    return client.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
        ...(types?.length ? { type: { in: types } } : {}),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  //트랜잭션 직후 에 생긴 알림만 sse로 밀게 하기위함
  findManyByIds = async (ids) => {
    return prisma.notification.findMany({
      where: { id: { in: ids } },
      orderBy: { id: 'desc' },
    });
  };

  async countUnread({ userId, types }, client = prisma) {
    return client.notification.count({
      where: {
        userId,
        read: false,
        ...(types?.length ? { type: { in: types } } : {}),
      },
    });
  }

  // 멱등/경합 안전: updateMany
  async markRead({ userId, id }, client = prisma) {
    const { count } = await client.notification.updateMany({
      where: { id, userId, read: false },
      data: { read: true },
    });
    return { count };
  }

  async markAllRead({ userId, beforeId, beforeDate, types, unreadOnly = true }, client = prisma) {
    const where = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
      ...(beforeId ? { id: { lte: beforeId } } : {}),
      ...(beforeDate ? { createdAt: { lte: new Date(beforeDate) } } : {}),
      ...(types?.length ? { type: { in: types } } : {}),
    };
    const { count } = await client.notification.updateMany({
      where,
      data: { read: true },
    });
    return { count };
  }

  // SSE backfill: Last-Event-ID 이후(ASC로 보내기 좋게 정렬)
  async findSinceId({ userId, sinceId, limit, types }, client = prisma) {
    return client.notification.findMany({
      where: {
        userId,
        id: { gt: sinceId },
        ...(types?.length ? { type: { in: types } } : {}),
      },
      orderBy: { id: 'asc' },
      take: limit,
    });
  }
}

export default NotificationRepository;
