import { prisma } from '../../common/utils/prisma.js';
class PointRepository {
  createLog = (data, client = prisma) => {
    return client.pointLog.create({
      data,
      select: { id: true },
    });
  };
}

export default PointRepository;
