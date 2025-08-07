import { prisma } from '../../common/utils/prisma.js';

class UserRepository {
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

  findUserById = async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  };
}

export default UserRepository;
