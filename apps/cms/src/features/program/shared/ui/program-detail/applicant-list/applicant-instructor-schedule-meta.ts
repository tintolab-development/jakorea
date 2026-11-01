import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

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

/**
 * 장거리 표기 — BE `longDistance` / `longDistanceYn`만 따른다.
 * 값 없으면 false. FE에서 km로 판정하지 않는다.
 */
export function isInstructorLongDistance(params: {
  longDistanceYn?: boolean | null
}): boolean {
  return params.longDistanceYn === true
}

/**
 * 출강·장거리 횟수 — InstructorApplicationListItemResponse 집계 필드.
 * 없으면 0.
 */
export function getInstructorScheduleDispatchStats(params?: {
  programDispatchCount?: number | null
  programLongDistanceDispatchCount?: number | null
}): {
  dispatchCount: number
  longDistanceCount: number
} {
  const dispatch =
    params?.programDispatchCount != null && Number.isFinite(params.programDispatchCount)
      ? params.programDispatchCount
      : 0
  const longDistance =
    params?.programLongDistanceDispatchCount != null &&
    Number.isFinite(params.programLongDistanceDispatchCount)
      ? params.programLongDistanceDispatchCount
      : 0
  return {
    dispatchCount: dispatch,
    longDistanceCount: longDistance,
  }
}

export type { ApplicantInstructorRow }
