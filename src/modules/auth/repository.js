import { prisma } from '../../common/utils/prisma.js';

class AuthRepository {
  findUserByEmail = async (email) => {
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    return existingEmail;
  };

  createUser = async (userData) => {
    const newUser = await prisma.user.create({
      data: userData,
    });

    return newUser;
  };
}

export default AuthRepository;
