/**
 * 기본 타입 정의
 * Phase 1.1: Mock 데이터 구조 정의
 */

// UUID 타입 (문자열로 처리)
export type UUID = string

// 공통 상태 타입
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'

// 날짜 타입 (ISO 8601 문자열 또는 Date 객체)
export type DateValue = string | Date

// 페이지네이션
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 도메인 타입 re-export
export * from './domain'

