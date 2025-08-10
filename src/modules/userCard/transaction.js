import { CARD_GRADE_VALUES } from '../../common/constants/enum.js';
import { prisma } from '../../common/utils/prisma.js';
class UserCardTransaction {
  constructor(userCardRepository) {
    this.userCardRepository = userCardRepository;
  }

  getUserCardDataInTransaction = async ({
    where,
    orderBy,
    skip,
    take,
    include,
    userId,
    statuses,
  }) => {
    return prisma.$transaction(async (tx) => {
      const myGalleryListPromise = this.userCardRepository.getUserCardList(
        { where, orderBy, skip, take, include },
        tx
      );

      const totalCountPromise = this.userCardRepository.getTotalCount({ where }, tx);

      const gradeCountsPromises = this.userCardRepository.getGradeCounts(
        { ownerId: userId, statuses },
        tx
      );

      const [myGalleryList, totalCount, gradeCounts] = await Promise.all([
        myGalleryListPromise,
        totalCountPromise,
        gradeCountsPromises,
      ]);

      return [myGalleryList, totalCount, gradeCounts];
    });
  };
}

export default UserCardTransaction;
