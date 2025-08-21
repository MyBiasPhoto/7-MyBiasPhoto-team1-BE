import { Router } from 'express';
import ExchangeRepository from './repository.js';
import ExchangeService from './service.js';
import ExchangeController from './controller.js';
import { validate } from '../../common/middleware/validate.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import { exchangeProposalSchema } from './schema/exchangeProposalSchema.js';
import { getExchangeProposalsSchema } from './schema/getExchangeProposalSchema.js';
import notificationService from '../notification/index.js';

const exchangeRouter = Router();
const repo = new ExchangeRepository();
const service = new ExchangeService(repo, notificationService);
const controller = new ExchangeController(service);

/**
 * @swagger
 * tags:
 *   - name: Exchange
 *     description: 카드 교환 관련 API
 */

/**
 * @swagger
 * /exchange/{saleId}/proposals:
 *   post:
 *     summary: 교환 제시 생성 (구매자)
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 판매글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proposedCardId:
 *                 type: integer
 *               message:
 *                 type: string
 *             required:
 *               - proposedCardId
 *     responses:
 *       201:
 *         description: 교환 제안 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 code: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 */
exchangeRouter.post(
  '/:saleId/proposals',
  verifyAccessToken,
  validate(exchangeProposalSchema, 'body'),
  controller.postExchangeProposal
);

/**
 * @swagger
 * /exchange/exchange-proposals/{proposalId}/cancel:
 *   patch:
 *     summary: 교환 제시 취소 (구매자)
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 교환 제안 ID
 *     responses:
 *       200:
 *         description: 교환 제안 취소 성공
 */
exchangeRouter.patch(
  '/exchange-proposals/:proposalId/cancel',
  verifyAccessToken,
  controller.cancelExchangeProposal
);

/**
 * @swagger
 * /exchange/exchange-proposals/{proposalId}/accept:
 *   patch:
 *     summary: 교환 제시 승인 (판매자)
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 교환 제안 ID
 *     responses:
 *       200:
 *         description: 교환 제안 승인 성공
 */
exchangeRouter.patch(
  '/exchange-proposals/:proposalId/accept',
  verifyAccessToken,
  controller.acceptExchangeProposal
);

/**
 * @swagger
 * /exchange/exchange-proposals/{proposalId}/reject:
 *   patch:
 *     summary: 교환 제시 거절 (판매자)
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 교환 제안 ID
 *     responses:
 *       200:
 *         description: 교환 제안 거절 성공
 */
exchangeRouter.patch(
  '/exchange-proposals/:proposalId/reject',
  verifyAccessToken,
  controller.rejectExchangeProposal
);

/**
 * @swagger
 * /exchange/exchange-proposals/my:
 *   get:
 *     summary: 내 교환 제시 목록 조회 (구매자)
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 페이지 크기
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED]
 *         description: 필터할 상태
 *     responses:
 *       200:
 *         description: 내 교환 제시 목록
 */
exchangeRouter.get(
  '/exchange-proposals/my',
  verifyAccessToken,
  validate(getExchangeProposalsSchema, 'query'),
  controller.getMyExchangeProposals
);

/**
 * @swagger
 * /exchange/{saleId}/exchange-proposals/received:
 *   get:
 *     summary: 받은 교환 제시 목록 조회 (판매자)
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 판매글 ID
 *     responses:
 *       200:
 *         description: 받은 교환 제시 목록
 */
exchangeRouter.get(
  '/:saleId/exchange-proposals/received',
  verifyAccessToken,
  controller.getReceivedProposals
);

export default exchangeRouter;

/**
 * @swagger
 * components:
 *   schemas:
 *     ExchangeProposalRequest:
 *       type: object
 *       required:
 *         - proposedCardId
 *       properties:
 *         proposedCardId:
 *           type: integer
 *           description: 제안할 카드 ID
 *           example: 123
 *         message:
 *           type: string
 *           description: 교환 메시지
 *           example: "이 카드와 교환하고 싶습니다."
 *
 *     ExchangeProposalResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         code:
 *           type: string
 *           example: "EXCHANGE_PROPOSAL_CREATED"
 *         message:
 *           type: string
 *           example: "교환 제안이 생성되었습니다."
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             saleId:
 *               type: integer
 *               example: 456
 *             proposedCardId:
 *               type: integer
 *               example: 123
 *             status:
 *               type: string
 *               enum: [PENDING, ACCEPTED, REJECTED, CANCELLED]
 *               example: "PENDING"
 *             message:
 *               type: string
 *               example: "이 카드와 교환하고 싶습니다."
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2025-08-21T11:30:00.000Z"
 */
