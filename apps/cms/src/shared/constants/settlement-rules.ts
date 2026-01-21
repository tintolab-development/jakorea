/**
 * 정산 규칙 상수 정의
 * Phase 0.4.1: 강사 정산 신청 (FR-G01)
 * §별첨2 강사료 산식 기준
 */

/**
 * 강사료 지급기준 테이블
 * §별첨2: 차시별 기본/장거리 강사료
 * 기준: 편도 100km = 파주시청 ↔ 용인시청
 */
export const INSTRUCTOR_FEE_TABLE = {
  1: { base: 120000, longDistance: 140000 },
  2: { base: 170000, longDistance: 190000 },
  3: { base: 220000, longDistance: 240000 },
  4: { base: 270000, longDistance: 290000 },
  5: { base: 320000, longDistance: 340000 },
  6: { base: 370000, longDistance: 390000 },
} as const

/**
 * 장거리 기준: 편도 100km 이상
 */
export const LONG_DISTANCE_THRESHOLD_KM = 100

/**
 * 교통비 지급 기준
 * §별첨2: 교통비 지급 기준
 * - 자택 ↔ 학교 간 주유비, 통행비 산출
 * - 통행료는 강사가 직접 숫자 기입 + 증빙자료 업로드
 * - 자택과 학교 간 거리 60km 이하인 경우 교통비 미지급
 */
export const TRANSPORT_FEE_POLICY = {
  minimumDistanceForTransport: 60, // km (이하 미지급)
  requiresReceipt: true, // 증빙자료 필수
} as const

/**
 * 숙박비
 * §별첨2: 해당자 일괄 80,000원
 */
export const ACCOMMODATION_FEE = 80000

/**
 * 원천징수율
 * FR-G01: 사업소득자 여부 확인
 */
export const TAX_RATES = {
  BUSINESS_INCOME: 0.033, // 사업소득자: 3.3%
  NON_BUSINESS_INCOME: 0.088, // 비사업소득자: 8.8%
} as const
