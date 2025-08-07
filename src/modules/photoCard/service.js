import { prisma } from '../../common/utils/prisma.js';

class PhotoCardService {
  constructor(photoCardRepository) {
    this.photoCardRepository = photoCardRepository;
  }

  async createPhotoCard(data, userId) {
    const { name, description, imageUrl, grade, genre, initialPrice, totalQuantity } = data;

    return await prisma.$transaction(async (transaction) => {
      const photoCard = await this.photoCardRepository.createPhotoCard(transaction, {
        name,
        description,
        imageUrl,
        grade,
        genre,
        initialPrice,
        totalQuantity,
        creator: { connect: { id: userId } },
      });

      const userCards = await this.photoCardRepository.createUserCards(
        transaction,
        Array.from({ length: totalQuantity }).map(() => ({
          ownerId: userId,
          photoCardId: photoCard.id,
        }))
      );

      return { photoCard, userCards };
    });
  }
}

export default PhotoCardService;
