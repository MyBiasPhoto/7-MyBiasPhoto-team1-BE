class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  signup = async (req, res, next) => {
    try {
      const { email, password, nickname } = req.body;
      const newUser = await this.authService.createUser({ email, password, nickname });
      return res.status(201).json({ newUser });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
