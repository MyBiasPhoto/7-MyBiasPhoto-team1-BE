import PointController from './controller.js';
import CooldownRepository from './CooldownRepository.js';
import UserRepository from '../user/repository.js';
import PointService from './service.js';
import PointRepository from './repository.js';
import { Router } from 'express';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import PointTransaction from './transaction.js';

const pointRepository = new PointRepository();
const cooldownRepository = new CooldownRepository();
const userRepository = new UserRepository();
const pointTransaction = new PointTransaction(pointRepository, cooldownRepository, userRepository);
const pointService = new PointService(pointRepository, pointTransaction, cooldownRepository);
const pointController = new PointController(pointService);

const pointRouter = Router();
/**
 * @swagger
 * tags:
 *   name: Point
 *   description: 포인트 이벤트 관련 API
 */

/**
 * @swagger
 * /points/events/random:
 *   post:
 *     summary: 랜덤 포인트 이벤트 참여
 *     tags: [Point]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 랜덤 포인트 지급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 points:
 *                   type: integer
 *                   description: 지급된 포인트
 *                 totalPoints:
 *                   type: integer
 *                   description: 사용자의 총 포인트
 *                 nextAllowedAt:
 *                   type: string
 *                   format: date-time
 *                   description: 다음 참여 가능 시간
 *       409:
 *         description: 이미 처리된 요청 (경쟁으로 인한 실패)
 *       429:
 *         description: 이벤트 쿨다운 중
 */
pointRouter.post('/events/random', verifyAccessToken, pointController.postRandomPointEvent);
/**
 * @swagger
 * /points/events/random/status:
 *   get:
 *     summary: 랜덤 포인트 이벤트 참여 상태 조회
 *     tags: [Point]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 현재 이벤트 참여 상태
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 active:
 *                   type: boolean
 *                   description: 이벤트 참여 가능 여부
 *                 remainingSeconds:
 *                   type: integer
 *                   description: 남은 쿨다운 시간(초)
 *                 nextAllowedAt:
 *                   type: string
 *                   format: date-time
 *                   description: 다음 참여 가능 시간
 *                 serverNow:
 *                   type: string
 *                   format: date-time
 *                   description: 서버 현재 시간
 */
pointRouter.get('/events/random/status', verifyAccessToken, pointController.getRandomPointStatus);

export default pointRouter;
