import PhotoCardController from './controller.js';
import PhotoCardService from './service.js';
import PhotoCardRepository from './repository.js';
import Router from 'express';
import { validate } from '../../common/middleware/validate.js';
import { postPhotoCardSchema } from './schema/postPhotoCardSchema.js';

const photoCardRouter = Router();

const photoCardRepository = new PhotoCardRepository();
const photoCardService = new PhotoCardService(photoCardRepository);
const photoCardController = new PhotoCardController(photoCardService);

photoCardRouter.post(
  '/',
  validate(postPhotoCardSchema, 'body'),
  photoCardController.createPhotoCard
);

export default photoCardRouter;
