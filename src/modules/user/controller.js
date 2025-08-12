import { throwApiError } from '../../common/utils/throwApiErrors.js';

class UserController {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  me = async (req, res, next) => {
    try {
      const me = await this.userRepository.findUserById(req.user.id);
      if (!me) return res.status(404).json({ me: null });
      return res.status(200).json({ me });
    } catch (err) {
      next(err);
    }
  };

  chargePoints = async (req, res, next) => {
    try {
      const { amount } = req.body ?? {};
      const n = Number(amount);

      if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
        throwApiError('POINTS_INVALID_AMOUNT', '충전 금액은 1 이상의 정수여야 합니다.', 400);
      }

      const updated = await this.userRepository.addPoints(req.user.id, n);

      return res.status(200).json({ success: true, balance: updated.points, me: updated });
    } catch (err) {
      next(err);
    }
  };
}

export default UserController;
