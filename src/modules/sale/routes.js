// src/modules/sale/routes.js
import { Router } from 'express';
import SaleController from './controller.js';
import SaleService from './service.js';
import SaleRepository from './repository.js';
import SaleTransaction from './saleTransaction.js';
import UserCardRepository from '../userCard/repository.js';
import PhotoCardRepository from '../photoCard/repository.js';
import UserRepository from '../user/repository.js';
import notificationService from '../notification/index.js';
import { validate } from '../../common/middleware/validate.js';
import { getSaleListSchema } from './schema/getSaleListSchema.js';
import { buySaleSchema } from './schema/buySaleSchema.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import { createSaleBodySchema, createSaleParamSchema } from './schema/createSaleSchema.js';

const saleRouter = Router();

// Repository & Transaction 인스턴스 생성
const saleRepository = new SaleRepository();
const userCardRepository = new UserCardRepository();
const photoCardRepository = new PhotoCardRepository();
const userRepository = new UserRepository();
const saleTransaction = new SaleTransaction(saleRepository, userCardRepository);

// Service 인스턴스 생성 (Controller에 주입)
const saleService = new SaleService(
  saleRepository,
  notificationService,
  photoCardRepository,
  userRepository,
  userCardRepository,
  saleTransaction
);

// Controller 인스턴스 생성
const saleController = new SaleController(saleService);

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: 판매 리스트 조회
 *     tags: [Sale]
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
 *     responses:
 *       200:
 *         description: 판매 리스트 조회 성공
 */
saleRouter.get('/', validate(getSaleListSchema, 'query'), saleController.getSaleList);

/**
 * @swagger
 * /sales/photo-card/{photoCardId}:
 *   post:
 *     summary: 카드 판매 등록
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoCardId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: integer
 *               initialQuantity:
 *                 type: integer
 *               desiredGrade:
 *                 type: string
 *               desiredGenre:
 *                 type: string
 *               desiredDesc:
 *                 type: string
 *     responses:
 *       201:
 *         description: 카드 판매 등록 성공
 */
saleRouter.post(
  '/photo-card/:photoCardId',
  validate(createSaleParamSchema, 'params'),
  validate(createSaleBodySchema, 'body'),
  verifyAccessToken,
  saleController.createSale
);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: 판매 카드 상세 조회
 *     tags: [Sale]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 카드 상세 조회 성공
 */
saleRouter.get('/:id', saleController.getSaleCardById);

/**
 * @swagger
 * /sales/{id}:
 *   patch:
 *     summary: 판매 카드 정보 수정
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: 수정할 필드
 *     responses:
 *       200:
 *         description: 카드 정보 수정 성공
 */
saleRouter.patch('/:id', verifyAccessToken, saleController.patchSaleCardById);

/**
 * @swagger
 * /sales/{id}/delete:
 *   patch:
 *     summary: 판매 취소
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deletedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 판매 취소 성공
 */
saleRouter.patch('/:id/delete', verifyAccessToken, saleController.patchSaleListById);

/**
 * @swagger
 * /sales/{id}/buy:
 *   post:
 *     summary: 판매 카드 구매
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 구매 완료
 */
saleRouter.post(
  '/:id/buy',
  validate(buySaleSchema, 'body'),
  verifyAccessToken,
  saleController.buySale
);

export default saleRouter;
