// src/common/utils/throwApiErrors.js

import { ApiError } from './apiError.js';

export const throwApiError = (code, message, status = 400) => {
  throw new ApiError(code, message, status);
};
