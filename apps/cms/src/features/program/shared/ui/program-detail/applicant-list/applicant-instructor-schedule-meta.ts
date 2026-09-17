import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { LONG_DISTANCE_THRESHOLD_KM as SETTLEMENT_LONG_DISTANCE_KM } from '@/shared/constants/settlement-rules'

/** Notion/시드·정산 컬럼 기준 100km. API `longDistanceYn`이 있으면 그 값을 우선한다. */
export const LONG_DISTANCE_THRESHOLD_KM = SETTLEMENT_LONG_DISTANCE_KM

/** 캘린더 우측 목록 — 기관·자택 편도 거리 이하일 때 거리 태그 민트 테두리 */
export const INSTRUCTOR_NEAR_DISTANCE_THRESHOLD_KM = 30

export function isInstructorNearDistanceKm(distanceKm: number): boolean {
  return distanceKm <= INSTRUCTOR_NEAR_DISTANCE_THRESHOLD_KM
}

/**
 * Admin API `distanceKm`만 사용. 없으면 null (해시 mock 거리 제거).
 */
export function getInstructorScheduleDistanceKm(
  _schoolName: string,
  _instructorName: string,
  _instructorAddress?: string,
  apiDistanceKm?: number
): number | null {
  if (apiDistanceKm != null && Number.isFinite(apiDistanceKm)) return apiDistanceKm
  return null
}

export function isInstructorLongDistance(params: {
  distanceKm: number | null
  longDistanceYn?: boolean | null
}): boolean {
  if (params.longDistanceYn != null) return params.longDistanceYn
  if (params.distanceKm == null) return false
  return params.distanceKm >= LONG_DISTANCE_THRESHOLD_KM
}

/** mock 기반 출강 통계 제거 — API 집계 전까지 0 */
export function getInstructorScheduleDispatchStats(_instructorName: string): {
  dispatchCount: number
  longDistanceCount: number
} {
  return {
    dispatchCount: 0,
    longDistanceCount: 0,
  }
}

export type { ApplicantInstructorRow }
