import { Router } from 'express';
import AuthController from './controller.js';
import UserRepository from '../user/repository.js';
import AuthService from './service.js';
import AuthRepository from './repository.js';
import { validate } from '../../common/middleware/validate.js';
import { signupSchema } from './schema/signupSchema.js';
import { loginSchema } from './schema/loginSchema.js';
import { verifyAccessToken } from '../../common/middleware/verifyAccessToken.js';
import passport from 'passport';

const authRouter = Router();

const authRepository = new AuthRepository();
const userRepository = new UserRepository();
const authService = new AuthService(authRepository, userRepository);
const authController = new AuthController(authService);

authRouter.post('/signup', validate(signupSchema, 'body'), authController.signup);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', verifyAccessToken, authController.logout);

authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure', session: false }),
  authController.oauthCallback
);

authRouter.get('/kakao', passport.authenticate('kakao', { session: false }));
authRouter.get(
  '/kakao/callback',
  passport.authenticate('kakao', { failureRedirect: '/auth/failure', session: false }),
  authController.oauthCallback
);

authRouter.get('/failure', (req, res) => res.status(401).json({ message: 'OAuth failed' }));

export default authRouter;
