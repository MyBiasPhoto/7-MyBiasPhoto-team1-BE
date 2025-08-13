// src/modules/notification/controller.js
class NotificationController {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }
  //@TODO 에러코드 에러메시지 처리

  list = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { cursor, limit, unreadOnly, types } = req.query;
      const result = await this.notificationService.list(userId, {
        cursor: cursor ? Number(cursor) : undefined,
        limit: Number(limit),
        unreadOnly,
        types,
      });
      return res.status(200).json({
        success: true,
        code: null,
        message: null,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  unreadCount = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { types } = req.query;
      const count = await this.notificationService.unreadCount(userId, { types });
      return res.status(200).json({
        success: true,
        code: null,
        message: null,
        data: { count },
      });
    } catch (err) {
      next(err);
    }
  };

  markRead = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const id = Number(req.params.id);
      const { updated } = await this.notificationService.markRead(userId, id);
      return res.status(200).json({
        success: true,
        code: null,
        message: updated ? '읽음 처리되었습니다.' : '이미 읽음이거나 권한이 없습니다.',
        data: { updated },
      });
    } catch (err) {
      next(err);
    }
  };

  markAllRead = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { beforeId, beforeDate, types, unreadOnly } = req.body;
      const { updated } = await this.notificationService.markAllRead(userId, {
        beforeId,
        beforeDate,
        types,
        unreadOnly,
      });
      return res.status(200).json({
        success: true,
        code: null,
        message: `총 ${updated}건 읽음 처리되었습니다.`,
        data: { updated },
      });
    } catch (err) {
      next(err);
    }
  };

  /***
   * SSE 헤더 세팅 후 서비스의 openStream에 구독 등록.
   * 재연결용 lastEventId와 초기 백필 크기 backfillLimit 전달.
   * 연결 종료 시 closeStream 호출.
   */
  stream = async (req, res, next) => {
    try {
      const userId = req.user.id;

      // SSE 필수 헤더
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      // CORS 프록시/중간단에서 버퍼링 막기용(환경에 따라)
      res.flushHeaders?.();

      // 헤더/쿼리에서 lastEventId 취합 (헤더/쿼리 모두 지원)
      const headerLastId = req.headers['last-event-id'];
      const queryLastId = req.query.lastEventId;
      const lastEventId =
        (typeof headerLastId === 'string' ? Number(headerLastId) : undefined) ??
        (queryLastId ? Number(queryLastId) : undefined);

      //초기 백필 크기
      const backfillLimit = Number(req.query.backfillLimit);
      const types = req.query.types;

      // 서비스에 위임 (구독 등록 + backfill + heartbeat)
      this.notificationService.openStream(userId, res, {
        lastEventId,
        backfillLimit,
        types,
      });

      // 연결 종료 시 구독 해제
      req.on('close', () => {
        this.notificationService.closeStream(userId, res);
      });
    } catch (err) {
      // 스트림 중간 오류 시에도 구독 정리 시도
      // try { this.notificationService.closeStream(req.user?.id, res); } catch {}
      next(err);
    }
  };
}

export default NotificationController;
