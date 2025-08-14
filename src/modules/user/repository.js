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

  incrementPoints = ({ userId, points }, client = prisma) => {
    return client.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
      select: { id: true, points: true },
    });
  };

  findByProvider = async (provider, providerId) => {
    return prisma.user.findFirst({
      where: { provider, providerId },
      select: {
        id: true,
        nickname: true,
        points: true,
        email: true,
        provider: true,
        providerId: true,
      },
    });
  };

  linkProvider = async (userId, { provider, providerId }) => {
    return prisma.user.update({
      where: { id: userId },
      data: { provider, providerId },
      select: {
        id: true,
        nickname: true,
        points: true,
        email: true,
        provider: true,
        providerId: true,
      },
    });
  };
}

export default UserRepository;
