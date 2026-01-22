/**
 * 정산 규칙 상수 정의
 * Phase 0.4.1: 강사 정산 신청 (FR-G01)
 * §별첨2 강사료 산식 기준
 * V3 Phase 4: 일사일교 사업 특수성 반영
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
 * 
 * V3 Phase 4: 일사일교 사업 특수성
 * - 거주지 기준 60km 초과 시 거리 기준 계산
 * - 룰 문서 존재 여부 → 텍스트로 정리해 받을 수 있음
 */
export const TRANSPORT_FEE_POLICY = {
  minimumDistanceForTransport: 60, // km (이하 미지급)
  requiresReceipt: true, // 증빙자료 필수
  // 일사일교 사업 특수성
  distanceBasedCalculation: true, // 거리 기준 계산 여부
} as const

/**
 * 숙박비
 * §별첨2: 해당자 일괄 80,000원
 * 
 * V3 Phase 4: 일사일교 사업 특수성
 * - 타지역 이동 시 실비
 * - 기본값: 80,000원 (일괄)
 */
export const ACCOMMODATION_FEE = 80000

/**
 * 일사일교 사업 특수성 설정
 * V3 Phase 4: 일사일교 사업 특수성 반영
 */
export const SPECIAL_PROGRAM_POLICY = {
  // 일사일교 사업 여부
  isSpecialProgram: false, // TODO: 프로그램별로 설정 가능하도록 확장
  
  // 숙박비 정책
  accommodationFeeType: 'fixed' as 'fixed' | 'actual', // 'fixed': 80,000원 고정, 'actual': 실비
  
  // 교통비 정책
  transportFeeCalculation: 'distance' as 'distance' | 'receipt', // 'distance': 거리 기준, 'receipt': 증빙 기준
} as const

/**
 * 원천징수율
 * FR-G01: 사업소득자 여부 확인
 */
export const TAX_RATES = {
  BUSINESS_INCOME: 0.033, // 사업소득자: 3.3%
  NON_BUSINESS_INCOME: 0.088, // 비사업소득자: 8.8%
} as const
