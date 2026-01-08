/**
 * 프로그램 관련 비즈니스 로직 헬퍼 함수
 * Phase 2.2: 비즈니스 로직 분리
 */

import type { Program, ProgramRound, Application } from '@/types/domain'
import { mockApplications } from '@/data/mock'

/**
 * 프로그램별 신청 수 계산
 * @param programId 프로그램 ID
 * @returns 신청 수
 */
export function getApplicationCountByProgram(programId: string): number {
  return mockApplications.filter(app => app.programId === programId).length
}

/**
 * 확정된 회차만 필터링
 * @param rounds 회차 배열
 * @returns 확정된 회차 배열 (status가 'active' 또는 'completed')
 */
export function getConfirmedRounds(rounds: ProgramRound[]): ProgramRound[] {
  return rounds.filter(round => round.status === 'active' || round.status === 'completed')
}

/**
 * 신청 가능 여부 확인 (신청 주체 타입별)
 * @param program 프로그램 정보
 * @param subjectType 신청 주체 타입 (선택사항, 없으면 일반 신청 가능 여부만 확인)
 * @returns 신청 가능 여부
 */
export function isApplicationAvailable(
  program: Program,
  subjectType?: 'school' | 'student' | 'instructor'
): boolean {
  // lifecycleStatus가 있는 경우: 상태와 신청 주체 타입에 따라 판단
  if (program.lifecycleStatus) {
    switch (program.lifecycleStatus) {
      case 'recruiting_students':
        // 수강자 모집 중: 학교/학생만 신청 가능
        if (subjectType) {
          return subjectType === 'school' || subjectType === 'student'
        }
        return true // 신청 주체 타입 미지정 시 일반적으로 신청 가능
      case 'recruiting_instructors':
        // 강사 모집 중: 강사/봉사자만 신청 가능
        if (subjectType) {
          return subjectType === 'instructor'
        }
        return true // 신청 주체 타입 미지정 시 일반적으로 신청 가능
      default:
        return false // 그 외 상태는 신청 불가
    }
  }

  // fallback: 이전 로직 유지 (status 기반)
  return program.status === 'active'
}

/**
 * 프로그램 상태에 따른 신청 불가 사유 메시지 생성 (신청 주체 타입별)
 * @param program 프로그램 정보
 * @param subjectType 신청 주체 타입 (선택사항)
 * @returns 신청 불가 사유 메시지 또는 null (신청 가능한 경우)
 */
export function getApplicationUnavailableReason(
  program: Program,
  subjectType?: 'school' | 'student' | 'instructor'
): string | null {
  // lifecycleStatus가 있는 경우: 상태와 신청 주체 타입에 따라 메시지 반환
  if (program.lifecycleStatus) {
    switch (program.lifecycleStatus) {
      case 'recruiting_students':
        // 수강자 모집 중: 강사는 신청 불가
        if (subjectType === 'instructor') {
          return '현재 수강자 모집 중입니다. 강사/봉사자 모집은 아직 시작되지 않았습니다.'
        }
        return null // 학교/학생은 신청 가능
      case 'recruiting_instructors':
        // 강사 모집 중: 학교/학생은 신청 불가
        if (subjectType === 'school' || subjectType === 'student') {
          return '수강자 모집이 마감되었습니다. 현재 강사/봉사자 모집 중입니다.'
        }
        return null // 강사는 신청 가능
      case 'planned':
        return '모집이 아직 시작되지 않았습니다.'
      case 'recruitment_completed_waiting':
        return '모집이 완료되었습니다.'
      case 'matching_completed_waiting':
        return '매칭이 완료되어 신청할 수 없습니다.'
      case 'in_progress':
        return '프로그램이 진행 중입니다.'
      case 'completed':
        return '프로그램이 종료되었습니다.'
      default:
        return '프로그램 상태로 인해 신청할 수 없습니다.'
    }
  }

  // fallback: 기존 status 기반 메시지
  if (program.status === 'inactive') {
    return '프로그램이 비활성화되어 신청할 수 없습니다.'
  }
  if (program.status === 'completed') {
    return '프로그램이 종료되어 신청할 수 없습니다.'
  }
  if (program.status !== 'active') {
    return '프로그램 상태로 인해 신청할 수 없습니다.'
  }

  return null // 신청 가능
}

/**
 * 신청 URL 생성
 * @param programId 프로그램 ID
 * @returns 신청 URL 또는 undefined
 */
export function getApplicationUrl(programId: string): string | undefined {
  // 실제로는 프로그램의 applicationAvailable 필드를 확인해야 함
  return `/applications/new?programId=${programId}`
}

/**
 * 프로그램/회차별 승인된 신청 수 계산
 * @param programId 프로그램 ID
 * @param roundId 회차 ID (선택사항)
 * @returns 승인된 신청 수
 */
export function getApprovedApplicationCount(
  programId: string,
  roundId?: string
): number {
  return mockApplications.filter(
    app =>
      app.programId === programId &&
      (!roundId || app.roundId === roundId) &&
      app.status === 'approved'
  ).length
}

/**
 * 프로그램/회차별 정원 확인
 * @param program 프로그램 정보
 * @param roundId 회차 ID (선택사항)
 * @returns 정원 수 또는 undefined (정원 제한 없음)
 */
export function getCapacity(program: Program, roundId?: string): number | undefined {
  if (roundId) {
    const round = program.rounds.find(r => r.id === roundId)
    return round?.capacity
  }
  // 전체 프로그램 정원은 모든 회차 정원의 합
  const totalCapacity = program.rounds.reduce((sum, round) => {
    return sum + (round.capacity || 0)
  }, 0)
  return totalCapacity > 0 ? totalCapacity : undefined
}

/**
 * 프로그램/회차별 정원 여유 확인
 * @param program 프로그램 정보
 * @param roundId 회차 ID (선택사항)
 * @returns 남은 정원 수 (정원이 없으면 undefined)
 */
export function getRemainingCapacity(
  program: Program,
  roundId?: string
): number | undefined {
  const capacity = getCapacity(program, roundId)
  if (capacity === undefined) return undefined

  const approvedCount = getApprovedApplicationCount(program.id, roundId)
  return Math.max(0, capacity - approvedCount)
}

/**
 * 정원이 가득 찼는지 확인
 * @param program 프로그램 정보
 * @param roundId 회차 ID (선택사항)
 * @returns 정원 초과 여부 (정원이 없으면 false)
 */
export function isCapacityFull(program: Program, roundId?: string): boolean {
  const remaining = getRemainingCapacity(program, roundId)
  return remaining !== undefined && remaining === 0
}

/**
 * 정원 마감 임박 여부 확인 (20% 이하 남았을 때)
 * @param program 프로그램 정보
 * @param roundId 회차 ID (선택사항)
 * @returns 마감 임박 여부
 */
export function isCapacityAlmostFull(
  program: Program,
  roundId?: string
): boolean {
  const capacity = getCapacity(program, roundId)
  if (capacity === undefined) return false

  const remaining = getRemainingCapacity(program, roundId)
  if (remaining === undefined) return false

  return remaining <= capacity * 0.2
}

/**
 * 프로그램/회차별 대기 목록 조회 (순번순 정렬)
 * @param programId 프로그램 ID
 * @param roundId 회차 ID (선택사항)
 * @returns 대기 목록
 */
export function getWaitingList(
  programId: string,
  roundId?: string
): Application[] {
  return mockApplications
    .filter(
      app =>
        app.programId === programId &&
        (!roundId || app.roundId === roundId) &&
        app.status === 'waiting'
    )
    .sort((a, b) => {
      const orderA = a.waitingListOrder ?? 999999
      const orderB = b.waitingListOrder ?? 999999
      return orderA - orderB
    })
}

/**
 * 다음 대기 목록 순번 계산
 * @param programId 프로그램 ID
 * @param roundId 회차 ID (선택사항)
 * @returns 다음 순번
 */
export function getNextWaitingListOrder(
  programId: string,
  roundId?: string
): number {
  const waitingList = getWaitingList(programId, roundId)
  if (waitingList.length === 0) return 1

  const maxOrder = Math.max(
    ...waitingList.map(app => app.waitingListOrder ?? 0)
  )
  return maxOrder + 1
}


