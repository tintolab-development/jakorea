/**
 * Mock 데이터 서비스 레이어
 * Phase 1.1: Mock API 함수 구조 설계
 *
 * 향후 백엔드 연동 시 최소 변경으로 전환 가능하도록 인터페이스 설계
 */

// 각 도메인별 Mock 서비스
export * from './instructorService'
export * from './sponsorService'
export * from './programService'
export * from './applicationService'
export * from './scheduleService'
export * from './matchingService'
export * from './settlementService'
// TODO: 나머지 도메인별 Mock 서비스 구현
// - mockApplicationService
// - mockScheduleService
// - mockMatchingService
// - mockSettlementService

// API 응답 타입 (향후 백엔드와 호환)
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  message: string
  code?: string
}

// 학교 서비스
export * as schoolService from './schoolService'
