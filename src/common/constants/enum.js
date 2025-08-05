export const genreMap = {
  앨범: 'ALBUM',
  특전: 'SPECIAL',
  팬싸: 'FANSIGN',
  시즌그리팅: 'SEASON_GREETING',
  팬미팅: 'FANMEETING',
  콘서트: 'CONCERT',
  MD: 'MD',
  콜라보: 'COLLAB',
  팬클럽: 'FANCLUB',
  기타: 'ETC',
};

export const gradeMap = {
  COMMON: 'COMMON',
  RARE: 'RARE',
  'SUPER RARE': 'SUPER_RARE',
  LEGENDARY: 'LEGENDARY',
};

// 역매핑 유틸 함수
export const createReverseMap = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([ko, en]) => [en, ko]));

export const genreMapReverse = createReverseMap(genreMap);
export const gradeMapReverse = createReverseMap(gradeMap);
