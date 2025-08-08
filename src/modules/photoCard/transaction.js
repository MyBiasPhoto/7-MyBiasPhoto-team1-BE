import { prisma } from '../../common/utils/prisma.js';

class PhotoCardTransaction {
  constructor(photoCardRepository) {
    this.photoCardRepository = photoCardRepository;
  }

  async createPhotoCardInTransaction(data, userId) {
    const { name, description, imageUrl, grade, genre, initialPrice, totalQuantity } = data;

    return await prisma.$transaction(async (tx) => {
      const photoCard = await this.photoCardRepository.createPhotoCard(tx, {
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
        tx,
        Array.from({ length: totalQuantity }).map(() => ({
          ownerId: userId,
          photoCardId: photoCard.id,
        }))
      );

      return { photoCard, userCards };
    });
  }
}

export default PhotoCardTransaction;
