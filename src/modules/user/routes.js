import { Router } from 'express';
import userCardRouter from '../userCard/routes.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import UserController from './controller.js';
import UserRepository from './repository.js';

const userRouter = Router();

const userRepository = new UserRepository();
const userController = new UserController(userRepository);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: 내 정보 조회
 *     description: 로그인된 사용자의 정보를 반환합니다.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 me:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                     points:
 *                       type: integer
 *       404:
 *         description: 사용자 정보 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 me:
 *                   type: "null"
 */

/**
 * @swagger
 * /users/points/charge:
 *   post:
 *     summary: 포인트 충전
 *     description: 사용자의 포인트를 충전합니다.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: 충전할 포인트 금액 (1 이상의 정수)
 *             required:
 *               - amount
 *     responses:
 *       200:
 *         description: 포인트 충전 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 balance:
 *                   type: integer
 *                 me:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                     points:
 *                       type: integer
 *       400:
 *         description: 잘못된 금액
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 */

userRouter.get('/me', verifyAccessToken, userController.me);
userRouter.post('/points/charge', verifyAccessToken, userController.chargePoints);
userRouter.use('/me/userCard', userCardRouter);

export default userRouter;
