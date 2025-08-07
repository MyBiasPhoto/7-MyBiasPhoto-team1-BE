import { CARD_GRADE_VALUES } from '../../common/constants/enum.js';
import { prisma } from '../../common/utils/prisma.js';
class UserCardTransaction {
  constructor(userCardRepository) {
    this.userCardRepository = userCardRepository;
  }
  // TODO: 성능 비교 후 하나의 방식(PromiseAll 또는 QueryRaw)으로 결정되면,
  //       status를 파라미터로 받아 처리하는 단일 트랜잭션 메서드로 리팩토링 필요.
  //       리팩토링 시 getGalleryDataInTransaction, getMarketDataInTransaction 통합하고
  //       사용하지 않는 Repository 메서드 삭제.

  getGalleryDataInTransaction = async ({ where, orderBy, skip, take, include, userId }) => {
    const gradeValues = CARD_GRADE_VALUES;

    return prisma.$transaction(async (tx) => {
      const myGalleryListPromise = this.userCardRepository.getUserCardList(
        { where, orderBy, skip, take, include },
        tx
      );

      const totalCountPromise = this.userCardRepository.getTotalCount({ where }, tx);

      const gradeCountPromises = gradeValues.map((grade) =>
        this.userCardRepository.getGradeCount({ ownerId: userId, status: 'IDLE', grade }, tx)
      );

      const [myGalleryList, totalCount, ...gradeCounts] = await Promise.all([
        myGalleryListPromise,
        totalCountPromise,
        ...gradeCountPromises,
      ]);

      return [myGalleryList, totalCount, gradeCounts];
    });
  };

  getMyMarketDataInTransaction = async ({ where, orderBy, skip, take, include, userId }) => {
    return prisma.$transaction(async (tx) => {
      const myMarketListPromise = this.userCardRepository.getUserCardList(
        { where, orderBy, skip, take, include },
        tx
      );

      const totalCountPromise = this.userCardRepository.getTotalCount({ where }, tx);

      const gradeCountsPromises = this.userCardRepository.getGradeCounts({ ownerId: userId }, tx);

      const [myGalleryList, totalCount, gradeCounts] = await Promise.all([
        myMarketListPromise,
        totalCountPromise,
        gradeCountsPromises,
      ]);

      return [myGalleryList, totalCount, gradeCounts];
    });
  };
}

export default UserCardTransaction;
