import bcrypt from 'bcryptjs';
import { generateToken } from '../../common/utils/jwt.js';

class AuthService {
  constructor(authRepository, userRepository) {
    this.authRepository = authRepository;
    this.userRepository = userRepository;
  }

  createUser = async ({ email, password, nickname }) => {
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (existingUser) {
      const error = new Error('이미 등록된 이메일 주소 입니다.');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 14);

    const newUser = await this.userRepository.createUser({
      email,
      password: hashedPassword,
      nickname,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  };

  login = async ({ email, password: passwordInput }) => {
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (!existingUser) {
      const error = new Error('등록되지 않은 이메일 주소 입니다.');
      error.statusCode = 404;
      throw error;
    }

    const { password: storedPassword } = existingUser;
    const isMatch = await bcrypt.compare(passwordInput, storedPassword);
    if (!isMatch) {
      const error = new Error('비밀번호가 일치하지 않습니다.');
      error.statusCode = 401;
      throw error;
    }

    const user = {
      id: existingUser.id,
      nickname: existingUser.nickname,
      points: existingUser.points,
    };

    const accessToken = generateToken(user, 'access');
    const refreshToken = generateToken(user, 'refresh');

    return { user, accessToken, refreshToken };
  };
}

export default AuthService;
