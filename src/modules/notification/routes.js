// src/modules/notification/routes.js

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: 사용자 알림 관련 API
 */

import { Router } from 'express';
import NotificationController from './controller.js';
import notificationService from './index.js';
import { validate } from '../../common/middleware/validate.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import {
  listNotificationsQuerySchema,
  unreadCountQuerySchema,
  markReadParamsSchema,
  markAllReadBodySchema,
  streamQuerySchema,
} from './schema/notificationSchema.js';

const notificationRouter = Router();
const notificationController = new NotificationController(notificationService);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     description: 커서 기반 페이징 및 필터링 가능
 *     tags: [Notifications]
 *     parameters:
 *       - name: cursor
 *         in: query
 *         description: 마지막 알림 ID (커서)
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         description: 가져올 알림 개수 (기본 10)
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: unreadOnly
 *         in: query
 *         description: 미확인 알림만 조회 여부
 *         schema:
 *           type: boolean
 *       - name: types
 *         in: query
 *         description: 알림 타입 필터 (배열)
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: integer
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     nextCursor:
 *                       type: integer
 *                       nullable: true
 *                     hasMore:
 *                       type: boolean
 */
notificationRouter.get(
  '/',
  verifyAccessToken,
  validate(listNotificationsQuerySchema, 'query'),
  notificationController.list
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: 미확인 알림 개수 조회
 *     description: 특정 타입 필터 가능
 *     tags: [Notifications]
 *     parameters:
 *       - name: types
 *         in: query
 *         description: 알림 타입 필터
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: integer
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 */
notificationRouter.get(
  '/unread-count',
  verifyAccessToken,
  validate(unreadCountQuerySchema, 'query'),
  notificationController.unreadCount
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: 단건 알림 읽음 처리
 *     description: 이미 읽음 처리된 경우 false 반환
 *     tags: [Notifications]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 처리 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: integer
 *                   nullable: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: boolean
 */
notificationRouter.patch(
  '/:id/read',
  verifyAccessToken,
  validate(markReadParamsSchema, 'params'),
  notificationController.markRead
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: 일괄 알림 읽음 처리
 *     description: 조건에 맞는 알림 모두 읽음 처리
 *     tags: [Notifications]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               beforeId:
 *                 type: integer
 *                 nullable: true
 *               beforeDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *               unreadOnly:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: 처리 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: integer
 *                   nullable: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: integer
 */
notificationRouter.patch(
  '/read-all',
  verifyAccessToken,
  validate(markAllReadBodySchema, 'body'),
  notificationController.markAllRead
);

/**
 * @swagger
 * /notifications/stream:
 *   get:
 *     summary: SSE 알림 스트림 구독
 *     description: 실시간 알림 수신
 *     tags: [Notifications]
 *     parameters:
 *       - name: lastEventId
 *         in: query
 *         description: 마지막 이벤트 ID (백필 시작점)
 *         schema:
 *           type: integer
 *       - name: backfillLimit
 *         in: query
 *         description: 초기 백필 최대 개수
 *         schema:
 *           type: integer
 *       - name: types
 *         in: query
 *         description: 구독할 알림 타입 필터
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: SSE 연결
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
notificationRouter.get(
  '/stream',
  verifyAccessToken,
  validate(streamQuerySchema, 'query'),
  notificationController.stream
);

export default notificationRouter;

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         type:
 *           type: string
 *         content:
 *           type: string
 *         read:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         link:
 *           type: string
 *           nullable: true
 */
