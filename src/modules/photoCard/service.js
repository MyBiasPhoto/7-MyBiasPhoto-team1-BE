class PhotoCardService {
  constructor(photoCardRepository, photoCardTransaction) {
    this.photoCardRepository = photoCardRepository;
    this.photoCardTransaction = photoCardTransaction;
  }

  async createPhotoCard(data, userId) {
    return await this.photoCardTransaction.createPhotoCardInTransaction(data, userId);
  }
}

export default PhotoCardService;
