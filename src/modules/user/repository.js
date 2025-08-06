import { prisma } from '../../common/utils/prisma.js';

class UserRepository {
  findUserById = async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  };
}

export default UserRepository;
