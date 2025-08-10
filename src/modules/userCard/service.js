import {
  gradeMap,
  genreMap,
  genreMapReverse,
  gradeMapReverse,
  CARD_GRADE_VALUES,
} from '../../common/constants/enum.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';

class UserCardService {
  constructor(userCardRepository, userCardTransaction, userRepository) {
    this.userCardRepository = userCardRepository;
    this.userCardTransaction = userCardTransaction;
    this.userRepository = userRepository;
  }

  getMyGalleryList = async (userId, userNickname, query) => {
    const { page, pageSize, search, grade, genre } = query;

    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throwApiError('USER_NOT_FOUND', '해당 유저를 찾을 수 없습니다.', 404);
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const mappedGrade = grade ? gradeMap[grade] : undefined;
    const mappedGenre = genre ? genreMap[genre] : undefined;

    // userCard에서 userId기준으로 status가 IDLE인것
    const where = {
      ownerId: userId,
      status: 'IDLE',
      photoCard: {
        ...(mappedGrade && { grade: mappedGrade }),
        ...(mappedGenre && { genre: mappedGenre }),
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
      },
    };
    const orderBy = { updatedAt: 'desc' };
    const include = {
      photoCard: {
        select: {
          name: true,
          description: true,
          imageUrl: true,
          grade: true,
          genre: true,
        },
      },
      owner: {
        select: { nickname: true },
      },
    };

    const [myGalleryList, totalCount, gradeCounts] =
      await this.userCardTransaction.getUserCardDataInTransaction({
        where,
        orderBy,
        skip,
        take,
        include,
        userId,
        statuses: ['IDLE'],
      });

    // console.log('myGalleryList : ', myGalleryList);
    // console.log(gradeCounts);

    const formattedMyGalleryList = myGalleryList.map((uc) => ({
      userCardId: uc.id,
      name: uc.photoCard.name,
      description: uc.photoCard.description,
      imageUrl: uc.photoCard.imageUrl,
      grade: gradeMapReverse[uc.photoCard.grade] || uc.photoCard.grade,
      genre: genreMapReverse[uc.photoCard.genre] || uc.photoCard.genre,
      ownerId: uc.ownerId,
      ownerNickName: uc.owner.nickname,
      updatedAt: uc.updatedAt,
    }));

    const by = Object.fromEntries(gradeCounts.map(({ grade, count }) => [grade, count]));
    const formattedGradeCounts = CARD_GRADE_VALUES.map((g) => ({
      grade: gradeMapReverse[g] ?? g,
      count: by[g] ?? 0,
    }));

    return {
      userNickname,
      MyGalleryList: formattedMyGalleryList,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      gradeCounts: formattedGradeCounts,
    };
  };

  getMyMarketList = async (userId, userNickname, query) => {
    const { page, pageSize, search, grade, genre, saleType } = query;

    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throwApiError('USER_NOT_FOUND', '해당 유저를 찾을 수 없습니다.', 404);
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const mappedGrade = grade ? gradeMap[grade] : undefined;
    const mappedGenre = genre ? genreMap[genre] : undefined;
    const statuses = saleType ? [saleType] : ['ON_SALE', 'PROPOSED'];
    const where = {
      ownerId: userId,
      status: { in: statuses },
      photoCard: {
        ...(mappedGrade && { grade: mappedGrade }),
        ...(mappedGenre && { genre: mappedGenre }),
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
    };
    const orderBy = { updatedAt: 'desc' };
    const include = {
      photoCard: {
        select: {
          name: true,
          description: true,
          imageUrl: true,
          grade: true,
          genre: true,
        },
      },
      owner: { select: { nickname: true } },
    };

    const [myMarketList, totalCount, gradeCounts] =
      await this.userCardTransaction.getUserCardDataInTransaction({
        where,
        orderBy,
        skip,
        take,
        include,
        userId,
        statuses,
      });
    // console.log('myMarketList : ', myMarketList);
    const formattedMySaleList = myMarketList.map((uc) => ({
      userCardId: uc.id,
      name: uc.photoCard.name,
      description: uc.photoCard.description,
      imageUrl: uc.photoCard.imageUrl,
      grade: gradeMapReverse[uc.photoCard.grade] || uc.photoCard.grade,
      genre: genreMapReverse[uc.photoCard.genre] || uc.photoCard.genre,
      status: uc.status,
      ownerId: uc.ownerId,
      ownerNickName: uc.owner.nickname,
      updatedAt: uc.updatedAt,
    }));

    const by = Object.fromEntries(gradeCounts.map(({ grade, count }) => [grade, count]));
    const formattedGradeCounts = CARD_GRADE_VALUES.map((g) => ({
      grade: gradeMapReverse[g] ?? g,
      count: by[g] ?? 0,
    }));

    return {
      userNickname,
      myMarketList: formattedMySaleList,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      gradeCounts: formattedGradeCounts,
    };
  };
}

export default UserCardService;
