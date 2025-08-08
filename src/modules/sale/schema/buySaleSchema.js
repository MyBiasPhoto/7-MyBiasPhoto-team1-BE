// src/modules/sale/schema/buySaleSchema.js
import { z } from 'zod';

export const buySaleSchema = z.object({
  quantity: z.coerce.number().int().positive().max(10).default(1),
});


//1 buySaleSchema.js 작성 (quantity가 optional or default 1)
//2 router.js에 POST /sales/:saleId/buy 등록
//3 controller.js에 buySale(req, res) 메서드 추가
//4 service.js에 buySale(userId, saleId, quantity) 작성
//5 transaction.js에 핵심 구매 로직 작성
//6 repository.js에 필요한 쿼리 메서드들 정의 (e.g., findAvailableUserCards(saleId) 등)
//7 에러 핸들링 및 응답 구성

//판매자 돈 안올라감 