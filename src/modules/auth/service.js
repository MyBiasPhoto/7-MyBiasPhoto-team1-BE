import bcrypt from 'bcryptjs';

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  createUser = async ({ email, password, nickname }) => {
    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      const error = new Error('이미 등록된 이메일 주소 입니다.');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 14);

    const newUser = await this.authRepository.createUser({
      email,
      password: hashedPassword,
      nickname,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  };
}

export default AuthService;
