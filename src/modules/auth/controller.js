import { verifyRefreshJWT } from '../../common/utils/jwt.js';

const isProd = process.env.NODE_ENV === 'production';

const cookieBase = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax', // 운영: none, 개발: lax
  secure: isProd, // 운영: true, 개발: false
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

      // 리프레쉬 토큰 코드 변경전 코드
      // res.cookie('refreshToken', refreshToken, {
      //   path: '/auth/refresh',
      //   httpOnly: true,
      //   maxAge: 7 * 24 * 60 * 60 * 1000,
      //   sameSite: 'none',
      //   secure: true,
      // });

      // Application/Cookies 에 refreshToken 보이게 하는 테스트 코드
      // res.cookie('refreshToken', refreshToken, {
      //   path: '/',
      //   httpOnly: true,
      //   maxAge: 7 * 24 * 60 * 60 * 1000,
      //   sameSite: 'lax',
      //   secure: false,
      // });

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

    // refresh token 수정 전 코드
    // res.clearCookie('accessToken', {
    //   path: '/',
    //   httpOnly: true,
    //   sameSite: 'none',
    //   secure: true,
    // });

    // res.clearCookie('refreshToken', {
    //   path: '/auth/refresh',
    //   httpOnly: true,
    //   sameSite: 'none',
    //   secure: true,
    // });

    // Application/Cookies 에 refreshToken 보이게 하는 테스트 코드
    // res.clearCookie('refreshToken', {
    //   path: '/',
    //   httpOnly: true,
    //   sameSite: 'lax',
    //   secure: false,
    // });

    res.clearCookie('accessToken', { ...cookieBase, path: '/' });
    res.clearCookie('refreshToken', { ...cookieBase, path: '/auth/refresh' });
    res.clearCookie('opaqueId', { ...cookieBase, path: '/auth/refresh' });

    return res.status(200).json({ message: '로그아웃 완료' });
  };
}

export default AuthController;
