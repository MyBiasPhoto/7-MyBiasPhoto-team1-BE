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
      const { user, accessToken, refreshToken } = await this.authService.login({ email, password });

      // TODO: 배포 전 sameSite 설정을 'lax'로 변경
      res.cookie('accessToken', accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
      });

      res.cookie('refreshToken', refreshToken, {
        path: '/auth/refresh',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
      });

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    res.clearCookie('accessToken', {
      path: '/',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    res.clearCookie('refreshToken', {
      path: '/auth/refresh',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    return res.status(200).json({ message: '로그아웃 완료' });
  };
}

export default AuthController;
