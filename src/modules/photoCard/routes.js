import PhotoCardController from './controller.js';
import PhotoCardService from './service.js';
import PhotoCardRepository from './repository.js';
import Router from 'express';
import PhotoCardTransaction from './transaction.js';
import { validate } from '../../common/middleware/validate.js';
import { postPhotoCardSchema } from './schema/postPhotoCardSchema.js';

const photoCardRouter = Router();

const photoCardRepository = new PhotoCardRepository();
const photoCardTransaction = new PhotoCardTransaction(photoCardRepository);
const photoCardService = new PhotoCardService(photoCardRepository, photoCardTransaction);
const photoCardController = new PhotoCardController(photoCardService);

photoCardRouter.post(
  '/',
  validate(postPhotoCardSchema, 'body'),
  photoCardController.createPhotoCard
);

export default photoCardRouter;
