import UserCardController from './controller.js';
import UserCardService from './service.js';
import UserCardRepository from './repository.js';
import UserRepository from '../user/repository.js';
import UserCardTransaction from './transaction.js';
import { Router } from 'express';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import { getMyGalleryListSchema } from './schema/getMyGalleryListSchema.js';
import { validate } from '../../common/middleware/validate.js';
import { getMySaleListSchema } from './schema/getMySaleListSchema.js';
import { getMyGroupedCards } from './schema/getMyGroupedCards.js';

const userCardRouter = Router({ mergeParams: true });

const userCardRepository = new UserCardRepository();
const userRepository = new UserRepository();
const userCardTransaction = new UserCardTransaction(userCardRepository);
const userCardService = new UserCardService(
  userCardRepository,
  userCardTransaction,
  userRepository
);
const userCardController = new UserCardController(userCardService);

/**
 * @swagger
 * tags:
 *   name: UserCard
 *   description: 유저 카드 관련 API
 */

/**
 * @swagger
 * /users/me/userCard/gallery:
 *   get:
 *     summary: 내 갤러리 카드 목록 조회
 *     description: 로그인한 유저의 갤러리 카드 목록과 등급별 통계를 가져옵니다.
 *     tags: [UserCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 아이템 수
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 카드 이름 검색
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *         description: 카드 등급 필터
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: 카드 장르 필터
 *     responses:
 *       200:
 *         description: 갤러리 카드 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userNickname:
 *                   type: string
 *                 MyGalleryList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userCardId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       price:
 *                         type: number
 *                       grade:
 *                         type: string
 *                       genre:
 *                         type: string
 *                       ownerId:
 *                         type: string
 *                       ownerNickName:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                 totalCount:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 gradeCounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       grade:
 *                         type: string
 *                       count:
 *                         type: integer
 */
userCardRouter.get(
  '/gallery',
  verifyAccessToken,
  validate(getMyGalleryListSchema, 'query'),
  userCardController.getMyGalleryList
);

/**
 * @swagger
 * /users/me/userCard/market:
 *   get:
 *     summary: 내 마켓 카드 목록 조회
 *     description: 로그인한 유저의 판매/제안 중인 카드 목록과 등급별 통계를 가져옵니다.
 *     tags: [UserCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: saleType
 *         schema:
 *           type: string
 *         description: 카드 상태 필터 (ON_SALE, PROPOSED)
 *     responses:
 *       200:
 *         description: 마켓 카드 목록 조회 성공
 */
userCardRouter.get(
  '/market',
  verifyAccessToken,
  validate(getMySaleListSchema, 'query'),
  userCardController.getMyMarketList
);

/**
 * @swagger
 * /users/me/userCard/grouped:
 *   get:
 *     summary: 카드 그룹 조회
 *     description: 로그인한 유저의 카드들을 photoCard 기준으로 그룹화하여 조회합니다.
 *     tags: [UserCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 그룹 카드 조회 성공
 */
userCardRouter.get(
  '/grouped',
  validate(getMyGroupedCards, 'query'),
  verifyAccessToken,
  userCardController.getMyGroupedCards
);

export default userCardRouter;
