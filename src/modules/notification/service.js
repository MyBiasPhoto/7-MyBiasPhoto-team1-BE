// src/modules/notification/service.js

import { throwApiError } from '../../common/utils/throwApiErrors.js';

class NotificationService {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;

    // user별 sse연결 userId -> Set<res>
    this.streams = new Map();

    // heartbeat 간격(ms) : 프록시/로드밸런서의 idle timeout보다 짧게
    this.heartbeatMs = 25_000;
  }

  // --- REST 유스케이스 ---
  // list(userId, { cursor, limit, unreadOnly, types }) : 목록/커서 페이징
  // unreadCount(userId, { types }) : 안 읽은 개수
  // markRead(userId, id) / markAllRead(userId, …) : 읽음 처리
  // publishMany(notificationIds) : DB에서 알림들 조회 후 각각 SSE 브로드캐스트

  async list(userId, { cursor, limit = 10, unreadOnly = false, types }) {
    const rows = await this.notificationRepository.findManyByUser({
      userId,
      cursor,
      limit: Number(limit),
      unreadOnly,
      types,
    });

    // nextCursor/hasMore 계산을 위해 10+1 전략을 쓰고 싶으면 레포에서 +1로 가져오게 설계해도 됨.
    // 여기서는 간단히 rows 길이로 처리(엄밀한 페이징이면 +1 전략 추천)
    const nextCursor = rows.length ? rows[rows.length - 1].id : null;
    const hasMore = rows.length === Number(limit);

    return {
      items: rows,
      nextCursor,
      hasMore,
    };
  }

  async unreadCount(userId, { types }) {
    const count = await this.notificationRepository.countUnread({ userId, types });
    return count;
  }

  async markRead(userId, id) {
    const { count } = await this.notificationRepository.markRead({ userId, id });
    return { updated: count === 1 };
  }

  async markAllRead(userId, { beforeId, beforeDate, types, unreadOnly = true }) {
    const { count } = await this.notificationRepository.markAllRead({
      userId,
      beforeId,
      beforeDate,
      types,
      unreadOnly,
    });
    return { updated: count };
  }

  // --- SSE 스트림 ---
  // lastEventId이후의 알림을 backfill 로 누락 복구
  // heartbeat로 연결 유지

  openStream(userId, res, { lastEventId, backfillLimit = 10, types }) {
    // 구독 등록
    if (!this.streams.has(userId)) this.streams.set(userId, new Set());
    const set = this.streams.get(userId);
    set.add(res);

    // 연결 직후 comment라인(옵션)으로 핑
    res.write(':\n\n');

    // 초기 backfill
    const doBackfill = async () => {
      try {
        if (lastEventId && Number.isFinite(lastEventId)) {
          const rows = await this.notificationRepository.findSinceId({
            userId,
            sinceId: Number(lastEventId),
            limit: Number(backfillLimit),
            types,
          });
          for (const n of rows) {
            this.writeEvent(res, n);
          }
        }
      } catch (_e) {
        // backfill 실패는 스트림 종료 사유는 아님 (로그만 남기고 계속 진행되게)
      }
    };
    void doBackfill();

    // heartbeat
    const hb = setInterval(() => {
      if (!res.writableEnded) res.write(':\n\n'); //주기적 ping
    }, this.heartbeatMs);

    // 연결 측에서 close 이벤트 발생시  정리
    res.on('close', () => {
      clearInterval(hb);
      this.closeStream(userId, res);
    });
  }

  //sse연결 해제
  closeStream(userId, res) {
    const set = this.streams.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) this.streams.delete(userId);
  }

  //단건 퍼블리시 : 해당 user의 모든 연결(res들)로 전송
  // 외부 도메인(구매/교환)에서 알림 생성 후 호출할 메서드
  publishToUser(userId, notification) {
    const set = this.streams.get(userId); // 현재 sse 연결된 브라우저들 - 알림창 켜놓은애들
    if (!set || set.size === 0) return;
    for (const res of set) {
      this.writeEvent(res, notification);
    }
  }

  //다건알림을 한번에 퍼블리시
  // db에서 id들로 조회 - 각 유저 연결로 브로드캐스트
  // 외부 도메인(구매/교환)에서 알림 생성 후 호출할 메서드
  async publishMany(notificationIds) {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) return;
    if (!this.notificationRepository?.findManyByIds) {
      throw new Error('NotificationRepository not injected (findManyByIds missing)');
    }

    const rows = await this.notificationRepository.findManyByIds(notificationIds);

    for (const n of rows) {
      this.publishToUser(n.userId, n);
    }
  }

  // SSE event 전송 포맷
  writeEvent(res, notification) {
    // 표준 필드: id / event(type) / data
    const payload = {
      id: notification.id,
      type: notification.type,
      content: notification.content,
      read: notification.read,
      createdAt: notification.createdAt,
      link: notification.link ?? null,
      // 필요한 경우 메타 필드 추가 가능
    };

    res.write(`id: ${notification.id}\n`);
    res.write(`event: ${notification.type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

export default NotificationService;
