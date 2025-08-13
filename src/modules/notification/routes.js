// src/modules/notification/routes.js

import { Router } from 'express';
import NotificationController from './controller.js';
import NotificationService from './service.js';
import NotificationRepository from './repository.js';

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

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

// 목록 조회 (기본 10개)
notificationRouter.get(
  '/',
  verifyAccessToken,
  validate(listNotificationsQuerySchema, 'query'),
  notificationController.list
);

// 미확인 개수
notificationRouter.get(
  '/unread-count',
  verifyAccessToken,
  validate(unreadCountQuerySchema, 'query'),
  notificationController.unreadCount
);

// 단건 읽음 처리
notificationRouter.patch(
  '/:id/read',
  verifyAccessToken,
  validate(markReadParamsSchema, 'params'),
  notificationController.markRead
);

// 일괄 읽음 처리
notificationRouter.patch(
  '/read-all',
  verifyAccessToken,
  validate(markAllReadBodySchema, 'body'),
  notificationController.markAllRead
);

// SSE 스트림
notificationRouter.get(
  '/stream',
  verifyAccessToken,
  validate(streamQuerySchema, 'query'),
  notificationController.stream
);

export default notificationRouter;
