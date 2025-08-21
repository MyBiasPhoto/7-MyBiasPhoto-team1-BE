import { Router } from 'express';
import PhotoCardController from './controller.js';
import PhotoCardService from './service.js';
import PhotoCardRepository from './repository.js';
import PhotoCardTransaction from './transaction.js';
import { validate } from '../../common/middleware/validate.js';
import { postPhotoCardSchema } from './schema/postPhotoCardSchema.js';
import uploadRouter from './upload.js';

const photoCardRouter = Router();

const photoCardRepository = new PhotoCardRepository();
const photoCardTransaction = new PhotoCardTransaction(photoCardRepository);
const photoCardService = new PhotoCardService(photoCardRepository, photoCardTransaction);
const photoCardController = new PhotoCardController(photoCardService);

photoCardRouter.use('/upload', uploadRouter);
/**
 * @swagger
 * /api/photoCard:
 *   post:
 *     summary: "포토카드 생성"
 *     description: "사용자가 포토카드를 생성합니다."
 *     tags: [PhotoCard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               creatorId:
 *                 type: number
 *                 description: "카드 생성자 ID"
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               grade:
 *                 type: string
 *               genre:
 *                 type: string
 *               initialPrice:
 *                 type: number
 *               totalQuantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: "생성 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photoCard:
 *                   type: object
 *                 createdUserCards:
 *                   type: number
 *                 monthly:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: number
 *                     remaining:
 *                       type: number
 *                     limit:
 *                       type: number
 *       400:
 *         description: "필요한 데이터 없음"
 *       409:
 *         description: "월별 한도 초과"
 */
photoCardRouter.post(
  '/',
  validate(postPhotoCardSchema, 'body'),
  photoCardController.createPhotoCard
);

export default photoCardRouter;
