class PhotoCardService {
  constructor(photoCardRepository, photoCardTransaction) {
    this.photoCardRepository = photoCardRepository;
    this.photoCardTransaction = photoCardTransaction;
  }

  async createPhotoCard(dto, userId) {
    const { photoCard, userCards, monthly } =
      await this.photoCardTransaction.createPhotoCardInTransaction(dto, userId);
    return { photoCard, userCards, monthly };
  }
}

export default PhotoCardService;
