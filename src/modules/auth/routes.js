import { Router } from 'express';
import AuthController from './controller.js';
import AuthService from './service.js';
import AuthRepository from './repository.js';
import { validate } from '../../common/middleware/validate.js';
import { signupSchema } from './schema/signupSchema.js';
import { loginSchema } from './schema/loginSchema.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';

const authRouter = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

authRouter.post('/signup', validate(signupSchema, 'body'), authController.signup);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);
authRouter.post('/logout', verifyAccessToken, authController.logout);

export default authRouter;
