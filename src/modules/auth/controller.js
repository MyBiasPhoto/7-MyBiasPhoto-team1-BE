import { verifyRefreshJWT } from '../../common/utils/jwt.js';

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
      const result = await this.authService.login({ email, password, ctx });

      // TODO: 배포 전 sameSite 설정을 'lax'로 변경
      res.cookie('accessToken', result.accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
      });

      const base = {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
      };
      res.cookie('refreshToken', result.refreshToken, { ...base, path: '/auth/refresh' });
      if (result.opaqueId) {
        res.cookie('opaqueId', result.opaqueId, { ...base, path: '/auth/refresh' });
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
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
      });

      // Rotation = refreshToken 교체 , Sliding = refreshToken 갱신
      const base = {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
      };
      res.cookie('refreshToken', newRT, { ...base, path: '/auth/refresh' });
      if (newOpaque) res.cookie('opaqueId', newOpaque, { ...base, path: '/auth/refresh' });

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

    res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: 'none', secure: true });
    res.clearCookie('refreshToken', {
      path: '/auth/refresh',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    res.clearCookie('opaqueId', {
      path: '/auth/refresh',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    return res.status(200).json({ message: '로그아웃 완료' });
  };
}

export default AuthController;
