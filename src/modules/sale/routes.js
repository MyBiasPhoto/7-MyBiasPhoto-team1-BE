// src/modules/sale/routes.js
import SaleController from './controller.js';
import SaleService from './service.js';
import SaleRepository from './repository.js';
import SaleTransaction from './saleTransaction.js';
import UserCardRepository from '../userCard/repository.js';
import PhotoCardRepository from '../photoCard/repository.js';
import { Router } from 'express';
import { validate } from '../../common/middleware/validate.js';
import { getSaleListSchema } from './schema/getSaleListSchema.js';
import { buySaleSchema } from './schema/buySaleSchema.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import { createSaleBodySchema, createSaleParamSchema } from './schema/createSaleSchema.js';
// import NotificationService from '../notification/service.js';
import notificationService from '../notification/index.js';
import UserRepository from '../user/repository.js';

const saleRouter = Router();

// const notificationService = new NotificationService();
const saleRepository = new SaleRepository();
const userCardRepository = new UserCardRepository();
const photoCardRepository = new PhotoCardRepository();
const userRepository = new UserRepository();
const saleTransaction = new SaleTransaction(saleRepository, userCardRepository);

const saleService = new SaleService(
  saleRepository,
  notificationService,
  photoCardRepository,
  userRepository,
  userCardRepository,
  saleTransaction
);
const saleController = new SaleController(saleService);

saleRouter.get('/', validate(getSaleListSchema, 'query'), saleController.getSaleList);
saleRouter.post(
  '/photo-card/:photoCardId',
  validate(createSaleParamSchema, 'params'),
  validate(createSaleBodySchema, 'body'),
  verifyAccessToken,
  saleController.createSale
);
saleRouter.patch('/:id/delete', saleController.patchSaleListById);
saleRouter.get('/:id', saleController.getSaleCardById);
saleRouter.patch(`/:id`, saleController.patchSaleCardById); //라우터 중복
saleRouter.post(
  '/:id/buy',
  validate(buySaleSchema, 'body'),
  verifyAccessToken,
  saleController.buySale
);
export default saleRouter;
