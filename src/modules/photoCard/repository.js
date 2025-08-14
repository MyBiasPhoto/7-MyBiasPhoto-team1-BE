import { prisma } from '../../common/utils/prisma.js';

class PhotoCardRepository {
  createPhotoCard = async (transaction, data) => {
    return await transaction.photoCard.create({ data });
  };

  createUserCards = async (transaction, userCards) => {
    return await transaction.userCard.createMany({ data: userCards });
  };

  findPhotoCardById = async (photoCardId, client = prisma) => {
    const photoCard = await client.photoCard.findUnique({
      where: {
        id: photoCardId,
      },
    });
    return photoCard;
  };
}

export default PhotoCardRepository;
