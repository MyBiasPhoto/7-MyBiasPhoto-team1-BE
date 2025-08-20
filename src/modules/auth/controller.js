import { verifyRefreshJWT } from '../../common/utils/jwt.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';

const isProd = process.env.NODE_ENV === 'production';

const cookieBase = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'none', // 운영: none, 개발: lax
  secure: true, //isProd, // 운영: true, 개발: false
};
class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  signup = async (req, res, next) => {
    try {
      const { email, password, nickname } = req.body;
      const newUser = await this.authService.createUser({ email, password, nickname });
      return res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const ctx = { userAgent: req.get('user-agent'), ip: req.ip };
      const preferredStrategy = (req.get('x-refresh-strategy') || '').toLowerCase();
      const result = await this.authService.login({ email, password, ctx, preferredStrategy });

      res.cookie('accessToken', result.accessToken, {
        ...cookieBase,
        path: '/',
        maxAge: 60 * 60 * 1000,
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...cookieBase,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (result.opaqueId) {
        res.cookie('opaqueId', result.opaqueId, {
          ...cookieBase,
          path: '/auth/refresh',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return res.status(200).json(result.user);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const opaqueId = req.cookies?.opaqueId;
      const ctx = { userAgent: req.get('user-agent'), ip: req.ip };

      const {
        user,
        accessToken,
        refreshToken: newRT,
        opaqueId: newOpaque,
      } = await this.authService.refresh({ refreshTokenRaw: refreshToken, opaqueId, ctx });

      // accessToken 교체
      res.cookie('accessToken', accessToken, {
        ...cookieBase,
        path: '/',
        maxAge: 60 * 60 * 1000,
      });

      res.cookie('refreshToken', newRT, {
        ...cookieBase,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (newOpaque) {
        res.cookie('opaqueId', newOpaque, {
          ...cookieBase,
          path: '/auth/refresh',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken ?? null;
      const opaqueId = req.cookies?.opaqueId ?? null;

      let jti = null;
      try {
        jti = verifyRefreshJWT(refreshToken)?.jti ?? null;
      } catch (_) {}

      await this.authService.logout({ refreshTokenRaw: refreshToken, jti, opaqueId });
    } catch (_) {}

    res.clearCookie('accessToken', { ...cookieBase, path: '/' });
    res.clearCookie('refreshToken', { ...cookieBase, path: '/auth/refresh' });
    res.clearCookie('opaqueId', { ...cookieBase, path: '/auth/refresh' });

    return res.status(200).json({ message: '로그아웃 완료' });
  };

  oauthCallback = async (req, res, next) => {
    try {
      const socialUser = req.user; // passport 전략에서 넘겨준 { id, nickname, points }
      if (!socialUser) {
        throwApiError('AUTH_OAUTH_USER_MISSING', '인증 실패', 401);
      }

      const preferredStrategy = (
        req.get('x-refresh-strategy') ||
        req.query?.startegy ||
        ''
      ).toLowerCase();
      const ctx = { userAgent: req.get('user-agent'), ip: req.ip };

      const issued = await this.authService.issueTokensForUser(socialUser, {
        ctx,
        preferredStrategy,
      });
      const { user, accessToken, refreshToken, opaqueId } = issued;

      res.cookie('accessToken', accessToken, { ...cookieBase, path: '/', maxAge: 60 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, {
        ...cookieBase,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      if (opaqueId) {
        res.cookie('opaqueId', opaqueId, {
          ...cookieBase,
          path: '/auth/refresh',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      const redirectTo = process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/marketPlace';
      return res.redirect(302, redirectTo);
    } catch (err) {
      next(err);
    }
  };
}

export default AuthController;
