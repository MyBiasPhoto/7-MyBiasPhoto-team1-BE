class UserCardController {
  constructor(userCardService) {
    this.userCardService = userCardService;
  }

  getMyGalleryList = async (req, res, next) => {
    try {
      const { id: userId, nickname: userNickname } = req.user;
      const query = req.query;
      // console.log(req.user);

      const myGalleryList = await this.userCardService.getMyGalleryList(
        userId,
        userNickname,
        query
      );

      return res.status(200).json(myGalleryList);
    } catch (error) {
      next(error);
    }
  };

  getMyMarketList = async (req, res, next) => {
    try {
      const { id: userId, nickname: userNickname } = req.user;
      const query = req.query;

      const myMarketList = await this.userCardService.getMyMarketList(userId, userNickname, query);

      return res.status(200).json(myMarketList);
    } catch (error) {
      next(error);
    }
  };

  getMyGroupedCards = async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const query = req.query;

      const myGroupedCardList = await this.userCardService.getMyGroupedCards(userId, query);

      return res.status(200).json(myGroupedCardList);
    } catch (error) {
      next(error);
    }
  };
}

export default UserCardController;
