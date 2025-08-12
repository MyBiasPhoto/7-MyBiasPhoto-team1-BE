class PointController {
  constructor(pointService) {
    this.pointService = pointService;
  }

  postRandomPointEvent = async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const randomPoint = await this.pointService.postRandomPointEvent(userId);
      return res.status(200).json(randomPoint);
    } catch (error) {
      next(error);
    }
  };
}

export default PointController;
