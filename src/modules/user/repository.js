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
      select: { id: true, nickname: true, points: true },
    });

    return user;
  };

  addPoints = async (userId, amount) => {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
        select: { id: true, nickname: true, points: true },
      });
      return updated;
    });
  };
}

export default UserRepository;
