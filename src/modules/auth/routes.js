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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nickname
 *             properties:
 *               email:
 *                 type: string
 *                 example: user30@test.com
 *               password:
 *                 type: string
 *                 example: password30!
 *               nickname:
 *                 type: string
 *                 example: user30
 *               confirmPassword:
 *                 type: string
 *                 example: password30!
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       409:
 *         description: 이메일 중복
 */
authRouter.post('/signup', validate(signupSchema, 'body'), authController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user30@test.com
 *               password:
 *                 type: string
 *                 example: password30!
 *     responses:
 *       200:
 *         description: 로그인 성공, 토큰은 쿠키로 전달됨
 *         headers:
 *           Set-Cookie:
 *             description: 액세스/리프레시 토큰 쿠키
 *             schema:
 *               type: string
 *       401:
 *         description: 인증 실패
 */

authRouter.post('/login', validate(loginSchema, 'body'), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *       401:
 *         description: refreshToken 없음 또는 유효하지 않음
 */
authRouter.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 로그아웃 완료
 */
authRouter.post('/logout', verifyAccessToken, authController.logout);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: 구글 OAuth 로그인
 *     tags: [Auth]
 */

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: 구글 OAuth 콜백
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 인증 성공 후 리다이렉트
 *       401:
 *         description: OAuth 실패
 */
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure', session: false }),
  authController.oauthCallback
);

/**
 * @swagger
 * /auth/kakao:
 *   get:
 *     summary: 카카오 OAuth 로그인
 *     tags: [Auth]
 */

/**
 * @swagger
 * /auth/kakao/callback:
 *   get:
 *     summary: 카카오 OAuth 콜백
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 인증 성공 후 리다이렉트
 *       401:
 *         description: OAuth 실패
 */
authRouter.get('/kakao', passport.authenticate('kakao', { session: false }));
authRouter.get(
  '/kakao/callback',
  passport.authenticate('kakao', { failureRedirect: '/auth/failure', session: false }),
  authController.oauthCallback
);

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: OAuth 실패
 *     tags: [Auth]
 *     responses:
 *       401:
 *         description: OAuth 실패
 */
authRouter.get('/failure', (req, res) => res.status(401).json({ message: 'OAuth failed' }));

export default authRouter;

/**
 * @swagger
 * components:
 *   schemas:
 *     SignupRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - nickname
 *       properties:
 *         email:
 *           type: string
 *           example: test@example.com
 *         password:
 *           type: string
 *           example: password123
 *         nickname:
 *           type: string
 *           example: myNickname
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: test@example.com
 *         password:
 *           type: string
 *           example: password123
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "uuid-1234"
 *         nickname:
 *           type: string
 *           example: myNickname
 *         points:
 *           type: number
 *           example: 100
 *
 *     OAuthFailureResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "OAuth failed"
 */
