// src/modules/notification/schema/notificationSchema.js

import { z } from 'zod';

export const notificationTypeValues = [
  'EXCHANGE_PROPOSAL_RECEIVED',
  'EXCHANGE_PROPOSAL_DECIDED',
  'CARD_PURCHASED',
  'CARD_SOLD_OUT',
  'RANDOM_BOX',
];

export const NotificationTypeZ = z.enum(notificationTypeValues);

// 공통: 쿼리 불린/숫자 파싱 도우미
const CoercedBool = z.coerce.boolean();
const CoercedInt = z.coerce.number().int();

// 1) 목록 조회 (REST 백필)
export const listNotificationsQuerySchema = z.object({
  // 커서 기반 페이지네이션: 커서가 없으면 최신부터
  cursor: CoercedInt.positive().optional(),
  // 한 번에 가져올 개수
  limit: CoercedInt.min(1).max(50).default(10),
  // 안 읽은 것만 필터링
  unreadOnly: CoercedBool.default(false),
  // (선택) 타입 필터링: 다중 선택 가능
  types: z
    .union([NotificationTypeZ, z.array(NotificationTypeZ)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
});

// 2) 미확인 개수
export const unreadCountQuerySchema = z.object({
  // (선택) 특정 타입만 카운트
  types: z
    .union([NotificationTypeZ, z.array(NotificationTypeZ)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
});

// 3) 단건 읽음 처리
export const markReadParamsSchema = z.object({
  id: CoercedInt.positive(),
});

// 4) 일괄 읽음 처리
export const markAllReadBodySchema = z
  .object({
    // beforeId 또는 beforeDate 중 하나로 범위 지정(둘 다 없으면 전부)
    beforeId: z.number().int().positive().optional(),
    beforeDate: z.coerce.date().optional(),
    // 특정 타입만 일괄 처리
    types: z.array(NotificationTypeZ).min(1).optional(),
    // 기본은 unread만 대상으로 처리
    unreadOnly: CoercedBool.default(true),
  })
  .refine((v) => v.beforeId || v.beforeDate || v.types || v.unreadOnly, {
    message: '대상 조건이 없습니다. 전체 읽음 처리 시 최소 한 가지 조건을 지정하세요.',
  });

// 5) SSE 스트림 (초기 백필/복구 제어용 쿼리)
// 실제 Last-Event-ID는 헤더로도 오므로, 여기 값이 있으면 우선 사용
export const streamQuerySchema = z.object({
  lastEventId: CoercedInt.positive().optional(),
  backfillLimit: CoercedInt.min(1).max(100).default(10),
  // (선택) 특정 타입만 실시간 구독 (필요 시)
  types: z
    .union([NotificationTypeZ, z.array(NotificationTypeZ)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
});
