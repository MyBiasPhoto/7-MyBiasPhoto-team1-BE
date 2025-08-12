// src/common/utils/apiError.js

export class ApiError extends Error {
  constructor(code, message, status = 400, meta) {
    super(message); // 부모클래스 생성자 호출
    this.name = 'ApiError';
    this.code = code; // 예: 'SALE_NOT_FOUND'
    this.status = status; // 예: 404
    this.meta = meta;
  }
}
