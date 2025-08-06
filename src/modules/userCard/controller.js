class UserCardController {
  constructor(userCardService) {
    this.userCardService = userCardService;
  }

  getMyGalleryList = async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const query = req.query;
      console.log(req.user);

      const myGalleryList = await this.userCardService.getMyGalleryList(userId, query);

      return res.status(200).json(myGalleryList);
    } catch (error) {
      next(error);
    }
  };
}

export default UserCardController;
