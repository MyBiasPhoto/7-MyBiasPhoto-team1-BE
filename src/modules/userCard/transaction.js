import { CARD_GRADE_VALUES } from '../../common/constants/enum.js';
import { prisma } from '../../common/utils/prisma.js';
class UserCardTransaction {
  constructor(userCardRepository) {
    this.userCardRepository = userCardRepository;
  }

  getUserCardData = async ({ where, orderBy, skip, take, include, userId, statuses }) => {
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

  getGroupedUserCardData = async ({ userId, limit, offset, search, mappedGrade, mappedGenre }) => {
    return prisma.$transaction(async (tx) => {
      console.log('transaction에서 repository로 넘어가는 arguments');
      console.log('userId :', userId);
      console.log('limit: ', limit);
      console.log('offset: ', offset);
      console.log('search : ', search);
      console.log('maapedGrade :', mappedGrade);
      console.log('mappedGenre : ', mappedGenre);
      const MyGroupedCardsPromise = this.userCardRepository.getGroupedByPhoto(
        {
          userId,
          limit,
          offset,
          search,
          mappedGrade,
          mappedGenre,
        },
        tx
      );

      const totalCountsPromise = this.userCardRepository.countGroupedByPhoto(
        {
          userId,
          search,
          mappedGrade,
          mappedGenre,
        },
        tx
      );

      const [MyGroupedCards, totalCounts] = await Promise.all([
        MyGroupedCardsPromise,
        totalCountsPromise,
      ]);

      return [MyGroupedCards, totalCounts];
    });
  };
}

export default UserCardTransaction;
