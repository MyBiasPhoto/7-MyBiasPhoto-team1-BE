import {
  gradeMap,
  genreMap,
  genreMapReverse,
  gradeMapReverse,
  CARD_GRADE,
} from '../../common/constants/enum.js';

class UserCardService {
  constructor(userCardRepository) {
    this.userCardRepository = userCardRepository;
  }

  getMyGalleryList = async (userId, query) => {
    const { page, pageSize, search, grade, genre } = query;

    const user = await this.userCardRepository.findUserById(userId);
    if (!user) {
      const error = new Error('존재하지 않는 유저 id 입니다');
      error.statusCode = 401;
      throw error;
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

    const orderBy = { createdAt: 'desc' };

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
    };

    //  [버전 1] Promise.all 방식
    // - 각 쿼리를 병렬 실행하지만, 트랜잭션은 사용하지 않음.
    // - 속도는 빠르지만, 도중에 데이터가 변경되면 일관성이 깨질 수 있음.
    /*
     const [myGalleryList, totalCount, common, rare, superRare, legendary] = await Promise.all([
       this.userCardRepository.getUserCardList({ where, orderBy, skip, take, include }),
       this.userCardRepository.getTotalCount({ where }),
       this.userCardRepository.getGradeCount({ ownerId: userId, status: 'IDLE', grade: 'COMMON' }),
       this.userCardRepository.getGradeCount({ ownerId: userId, status: 'IDLE', grade: 'RARE' }),
       this.userCardRepository.getGradeCount({ ownerId: userId, status: 'IDLE', grade: 'SUPER_RARE' }),
       this.userCardRepository.getGradeCount({ ownerId: userId, status: 'IDLE', grade: 'LEGENDARY' }),
     ]); */

    /// [버전 2] 트랜잭션 방식
    // - 모든 쿼리를 한 트랜잭션 안에서 실행 → 데이터 일관성 보장
    // - 등급별 카운트는 enum에서 가져온 값 기반으로 동적 처리
    const [myGalleryList, totalCount, gradeCountMap] =
      await this.userCardRepository.getGalleryDataInTransaction({
        where,
        orderBy,
        skip,
        take,
        include,
        userId,
      });

    const formattedMyGalleryList = myGalleryList.map((myGallery) => ({
      userCardId: myGallery.id,
      name: myGallery.photoCard.name,
      description: myGallery.photoCard.description,
      imageUrl: myGallery.photoCard.imageUrl,
      grade: gradeMapReverse[myGallery.photoCard.grade] || myGallery.photoCard.grade,
      genre: genreMapReverse[myGallery.photoCard.genre] || myGallery.photoCard.genre,
      owner: myGallery.ownerId,
      updatedAt: myGallery.updatedAt,
    }));

    // Promise.all 방식을 사용할 경우 데이터 포맷이 필요하다.
    // const formattedGradeCounts = {
    //   COMMON: common,
    //   RARE: rare,
    //   SUPER_RARE: superRare,
    //   LEGENDARY: legendary,
    // };

    return {
      MyGalleryList: formattedMyGalleryList,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      // gradeCount: formattedGradeCounts,
      gradeCount: gradeCountMap,
    };
  };
}

export default UserCardService;
