/**
 * API 필터링 유틸리티
 * Phase 4.2.2: 권한별 데이터 필터링
 * Phase 0.1.1: 역할 체계 재정의 (STUDENT → INDIVIDUAL, SCHOOL 추가)
 */

import type { UserRole } from '@/types/user'

/**
 * 권한별 쿼리 파라미터 생성
 * @param userRole 사용자 권한
 * @param userId 사용자 ID (강사/봉사자/수강자일 경우)
 * @returns 쿼리 파라미터 객체
 */
export function buildQueryParamsByRole(
  userRole: UserRole | null,
  userId?: string
): Record<string, string | number> {
  const params: Record<string, string | number> = {}

  if (!userRole) {
    return params
  }

  // 관리자는 전체 데이터 조회 (필터링 없음)
  if (userRole === 'ADMIN') {
    return params
  }

  // Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
  // 강사는 instructorId로 필터링
  if (userRole === 'INSTRUCTOR') {
    if (userId) {
      params.instructorId = userId
    }
  } else if (userRole === 'INDIVIDUAL' || userRole === 'SCHOOL') {
    // 개인(참여자), 학교는 userId로 필터링
    if (userId) {
      params.userId = userId
    }
  }
  // 하위 호환성: STUDENT, VOLUNTEER
  else if (userRole === 'STUDENT') {
    if (userId) {
      params.userId = userId
    }
  } else if (userRole === 'VOLUNTEER') {
    if (userId) {
      params.instructorId = userId
    }
  }

  return params
}

/**
 * 목록 데이터를 권한에 따라 필터링
 * @param data 목록 데이터
 * @param userRole 사용자 권한
 * @param userId 사용자 ID
 * @param filterFn 필터링 함수 (데이터 타입별로 다름)
 * @returns 필터링된 데이터
 */
export function filterDataByRole<T>(
  data: T[],
  userRole: UserRole | null,
  userId?: string,
  filterFn?: (item: T, userRole: UserRole, userId?: string) => boolean
): T[] {
  if (!userRole) {
    return []
  }

  // 관리자는 전체 데이터 반환
  if (userRole === 'ADMIN') {
    return data
  }

  // 필터링 함수가 제공된 경우 사용
  if (filterFn) {
    return data.filter(item => filterFn(item, userRole, userId))
  }

  // 기본 필터링 로직
  return data
}

/**
 * 강사/봉사자 데이터 필터링 함수
 * @param item 데이터 아이템
 * @param userRole 사용자 권한
 * @param userId 사용자 ID (instructorId)
 * @returns 필터링 여부
 */
export function filterByInstructorId<T extends { instructorId?: string }>(
  item: T,
  userRole: UserRole,
  userId?: string
): boolean {
  if (userRole === 'ADMIN') {
    return true
  }

  // Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
  if (userRole === 'INSTRUCTOR') {
    return item.instructorId === userId
  }
  // 하위 호환성
  if (userRole === 'VOLUNTEER') {
    return item.instructorId === userId
  }

  return false
}

/**
 * 개인(참여자)/학교 데이터 필터링 함수
 * Phase 0.1.1: INDIVIDUAL, SCHOOL 지원
 * @param item 데이터 아이템
 * @param userRole 사용자 권한
 * @param userId 사용자 ID
 * @returns 필터링 여부
 */
export function filterByUserId<T extends { userId?: string }>(
  item: T,
  userRole: UserRole,
  userId?: string
): boolean {
  if (userRole === 'ADMIN') {
    return true
  }

  // Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
  if (userRole === 'INDIVIDUAL' || userRole === 'SCHOOL') {
    return item.userId === userId
  }
  // 하위 호환성
  if (userRole === 'STUDENT') {
    return item.userId === userId
  }

  return false
}

/**
 * 상세 데이터 접근 권한 확인
 * @param item 데이터 아이템
 * @param userRole 사용자 권한
 * @param userId 사용자 ID
 * @param checkFn 권한 확인 함수
 * @returns 접근 가능 여부
 */
export function canAccessItem<T>(
  item: T,
  userRole: UserRole | null,
  userId?: string,
  checkFn?: (item: T, userRole: UserRole, userId?: string) => boolean
): boolean {
  if (!userRole) {
    return false
  }

  // 관리자는 모든 데이터 접근 가능
  if (userRole === 'ADMIN') {
    return true
  }

  // 권한 확인 함수가 제공된 경우 사용
  if (checkFn) {
    return checkFn(item, userRole, userId)
  }

  return false
}

