import UserCardController from './controller.js';
import UserCardService from './service.js';
import UserCardRepository from './repository.js';
import UserRepository from '../user/repository.js';
import UserCardTransaction from './transaction.js';
import { Router } from 'express';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import { getMyGalleryListSchema } from './schema/getMyGalleryListSchema.js';
import { validate } from '../../common/middleware/validate.js';

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

userCardRouter.get(
  '/gallery',
  verifyAccessToken,
  validate(getMyGalleryListSchema, 'query'),
  userCardController.getMyGalleryList
);

userCardRouter.get(
  '/market',
  verifyAccessToken,
  validate(getMyGalleryListSchema, 'query'),
  userCardController.getMyMarketList
);
export default userCardRouter;
