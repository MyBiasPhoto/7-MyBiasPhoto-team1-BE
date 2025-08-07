class PhotoCardController {
  constructor(photoCardService) {
    this.photoCardService = photoCardService;
  }

  createPhotoCard = async (req, res, next) => {
    try {
      console.log(req.body);
      const userId = req.body.creatorId;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId(creatorId)가 필요합니다.' });
      }
      const photoCard = await this.photoCardService.createPhotoCard(req.body, userId);
      return res.status(201).json(photoCard);
    } catch (error) {
      next(error);
    }
  };
}

export default PhotoCardController;
