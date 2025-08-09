// src/common/utils/throwApiErrors.js

import { ApiError } from './apiError.js';

export const throwApiError = (code, message, status = 400) => {
  throw new ApiError(code, message, status);
  //code NOT_ENOUGH_MINERALS
  // message : 프론트에서 보여질 내용 돈이부족하여 구매에 실패했습니다
  // 400 (bad request)
};
