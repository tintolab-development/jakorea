/**
 * 상태 전환 로직 중앙화
 * Phase 3: 상태 전환 규칙 및 헬퍼 함수
 */

import type { ApplicationStatus, SettlementStatus, ProgramLifecycleStatus } from '@/types/domain'

/**
 * Application 상태 전환 규칙
 * submitted -> reviewing -> approved/rejected/waiting
 * (일부 상태는 이전 단계로도 되돌릴 수 있도록 허용)
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['reviewing', 'waiting', 'cancelled'],
  reviewing: ['submitted', 'approved', 'rejected', 'waiting', 'cancelled'], // submitted로 되돌리기 가능
  waiting: ['submitted', 'reviewing', 'approved', 'rejected', 'cancelled'], // 원래 상태로 되돌리기 가능
  approved: ['reviewing'], // reviewing로 되돌리기 가능
  rejected: ['reviewing'], // reviewing로 되돌리기 가능
  cancelled: [], // 최종 상태 (취소는 복구 불가)
}

/**
 * Settlement 상태 전환 규칙
 * pending -> calculated -> review -> approved -> paid
 * (cancelled는 언제든 전환 가능, 일부 상태는 이전 단계로도 되돌릴 수 있도록 허용)
 */
export const SETTLEMENT_STATUS_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  pending: ['calculated', 'cancelled'],
  calculated: ['pending', 'review', 'approved', 'cancelled'],
  review: ['calculated', 'approved', 'cancelled'],
  approved: ['review', 'calculated', 'paid', 'cancelled'],
  paid: ['approved'], // 지급 완료 이후 되돌려야 하는 케이스를 위해 승인 단계로만 회귀 허용
  cancelled: ['calculated'], // 취소에서 다시 산출 단계로 복구 가능
}

/**
 * Application 상태 전환 가능 여부 확인
 * @param currentStatus 현재 상태
 * @param targetStatus 목표 상태
 * @returns 전환 가능 여부
 */
export function canTransitionApplicationStatus(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus
): boolean {
  // 같은 상태로는 전환 불가
  if (currentStatus === targetStatus) {
    return false
  }

  // 최종 상태에서는 전환 불가
  if (APPLICATION_STATUS_TRANSITIONS[currentStatus].length === 0) {
    return false
  }

  // 전환 가능한 상태 목록에 포함되어 있는지 확인
  return APPLICATION_STATUS_TRANSITIONS[currentStatus].includes(targetStatus)
}

/**
 * Application 다음 가능한 상태 목록 조회
 * @param currentStatus 현재 상태
 * @returns 다음 가능한 상태 배열
 */
export function getNextApplicationStatuses(currentStatus: ApplicationStatus): ApplicationStatus[] {
  return APPLICATION_STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Application 자동 다음 상태 계산 (워크플로우 기반)
 * submitted -> reviewing -> approved
 * @param currentStatus 현재 상태
 * @returns 다음 상태 또는 null (자동 전환 불가)
 */
export function getNextApplicationStatus(
  currentStatus: ApplicationStatus
): ApplicationStatus | null {
  const transitions: Record<ApplicationStatus, ApplicationStatus | null> = {
    submitted: 'reviewing',
    reviewing: 'approved',
    waiting: null, // 대기 상태는 자동 전환 불가
    approved: null,
    rejected: null,
    cancelled: null,
  }
  return transitions[currentStatus] || null
}

/**
 * Application 이전 상태 계산 (워크플로우 기준)
 * reviewing -> submitted
 * approved -> reviewing
 * rejected -> reviewing
 * waiting -> null (대기 상태는 어디서 왔는지 추적 불가, 되돌리기 불가)
 * @param currentStatus 현재 상태
 * @returns 이전 상태 또는 null (되돌릴 수 없음)
 */
export function getPreviousApplicationStatus(
  currentStatus: ApplicationStatus
): ApplicationStatus | null {
  const transitions: Record<ApplicationStatus, ApplicationStatus | null> = {
    submitted: null, // 초기 상태 (이전 상태 없음)
    reviewing: 'submitted',
    waiting: null, // 대기 상태는 이전 상태 추적 불가, 되돌리기 불가
    approved: 'reviewing',
    rejected: 'reviewing',
    cancelled: null, // 취소는 복구 불가
  }
  return transitions[currentStatus] || null
}

/**
 * Application 상태가 최종 상태인지 확인
 * @param status 상태
 * @returns 최종 상태 여부
 */
export function isApplicationFinalStatus(status: ApplicationStatus): boolean {
  return ['cancelled'].includes(status) // cancelled만 최종 상태로 간주 (approved, rejected는 되돌릴 수 있음)
}

/**
 * Settlement 상태 전환 가능 여부 확인
 * @param currentStatus 현재 상태
 * @param targetStatus 목표 상태
 * @returns 전환 가능 여부
 */
export function canTransitionSettlementStatus(
  currentStatus: SettlementStatus,
  targetStatus: SettlementStatus
): boolean {
  // 같은 상태로는 전환 불가
  if (currentStatus === targetStatus) {
    return false
  }

  // 최종 상태에서는 전환 불가
  if (SETTLEMENT_STATUS_TRANSITIONS[currentStatus].length === 0) {
    return false
  }

  // 전환 가능한 상태 목록에 포함되어 있는지 확인
  return SETTLEMENT_STATUS_TRANSITIONS[currentStatus].includes(targetStatus)
}

/**
 * Settlement 다음 가능한 상태 목록 조회
 * @param currentStatus 현재 상태
 * @returns 다음 가능한 상태 배열
 */
export function getNextSettlementStatuses(currentStatus: SettlementStatus): SettlementStatus[] {
  return SETTLEMENT_STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Settlement 자동 다음 상태 계산 (워크플로우 기반)
 * pending -> calculated -> review -> approved -> paid
 * @param currentStatus 현재 상태
 * @returns 다음 상태 또는 null (자동 전환 불가)
 */
export function getNextSettlementStatus(currentStatus: SettlementStatus): SettlementStatus | null {
  const transitions: Record<SettlementStatus, SettlementStatus | null> = {
    pending: 'calculated',
    calculated: 'review',
    review: 'approved',
    approved: 'paid',
    paid: 'approved',
    cancelled: null,
  }
  return transitions[currentStatus] || null
}

/**
 * Settlement 이전 상태 계산 (워크플로우 기준)
 * calculated -> pending
 * review -> calculated
 * approved -> review
 * paid -> approved
 */
export function getPreviousSettlementStatus(
  currentStatus: SettlementStatus
): SettlementStatus | null {
  const transitions: Record<SettlementStatus, SettlementStatus | null> = {
    pending: null,
    calculated: 'pending',
    review: 'calculated',
    approved: 'review',
    paid: 'approved',
    cancelled: 'calculated',
  }
  return transitions[currentStatus] || null
}

/**
 * Settlement 상태가 최종 상태인지 확인
 * @param status 상태
 * @returns 최종 상태 여부
 */
export function isSettlementFinalStatus(status: SettlementStatus): boolean {
  return ['paid', 'cancelled'].includes(status)
}

/**
 * Program Lifecycle 상태 전환 규칙 (디자이너 스펙 9태그 반영)
 */
export const PROGRAM_LIFECYCLE_STATUS_TRANSITIONS: Record<
  ProgramLifecycleStatus,
  ProgramLifecycleStatus[]
> = {
  planned: ['instructor_recruitment_planned', 'recruiting_students', 'participant_instructor_recruitment_planned'],
  instructor_recruitment_planned: ['planned', 'volunteer_recruitment_planned', 'recruiting_instructors', 'participant_instructor_recruitment_planned'],
  volunteer_recruitment_planned: ['instructor_recruitment_planned', 'recruiting_volunteers', 'participant_instructor_recruitment_planned'],
  participant_instructor_recruitment_planned: ['planned', 'recruiting_students', 'recruiting_instructors', 'participant_instructor_recruiting'],
  recruiting_students: ['planned', 'recruiting_instructors', 'participant_instructor_recruiting'],
  recruiting_instructors: ['recruiting_students', 'recruiting_volunteers', 'matching_completed', 'participant_instructor_recruiting'],
  recruiting_volunteers: ['volunteer_recruitment_planned', 'recruiting_instructors', 'matching_completed', 'participant_instructor_recruiting'],
  participant_instructor_recruiting: ['participant_instructor_recruitment_planned', 'recruiting_students', 'recruiting_instructors', 'participant_instructor_recruitment_completed'],
  matching_completed: ['recruiting_instructors', 'recruiting_volunteers', 'education_completed', 'participant_instructor_recruitment_completed'],
  education_completed: ['matching_completed', 'document_processing_completed', 'participant_instructor_recruitment_completed'],
  document_processing_completed: ['education_completed', 'participant_instructor_recruitment_completed'],
  participant_instructor_recruitment_completed: ['participant_instructor_recruiting', 'matching_completed', 'education_completed', 'document_processing_completed'],
}

/**
 * Program Lifecycle 상태 전환 가능 여부 확인
 * @param currentStatus 현재 상태
 * @param targetStatus 목표 상태
 * @returns 전환 가능 여부
 */
export function canTransitionProgramLifecycleStatus(
  currentStatus: ProgramLifecycleStatus | undefined,
  targetStatus: ProgramLifecycleStatus
): boolean {
  // lifecycleStatus가 없으면 planned 상태로 간주
  if (!currentStatus) {
    return targetStatus === 'planned' || targetStatus === 'recruiting_students'
  }

  // 같은 상태로는 전환 불가
  if (currentStatus === targetStatus) {
    return false
  }

  // 전환 가능한 상태 목록에 포함되어 있는지 확인
  return PROGRAM_LIFECYCLE_STATUS_TRANSITIONS[currentStatus].includes(targetStatus)
}

/**
 * Program Lifecycle 다음 가능한 상태 목록 조회
 * @param currentStatus 현재 상태
 * @returns 다음 가능한 상태 배열
 */
export function getNextProgramLifecycleStatuses(
  currentStatus: ProgramLifecycleStatus | undefined
): ProgramLifecycleStatus[] {
  if (!currentStatus) {
    return ['planned', 'recruiting_students']
  }
  return PROGRAM_LIFECYCLE_STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Program Lifecycle 자동 다음 상태 계산 (7단계)
 * @param currentStatus 현재 상태
 * @returns 다음 상태 또는 null (자동 전환 불가)
 */
export function getNextProgramLifecycleStatus(
  currentStatus: ProgramLifecycleStatus | undefined
): ProgramLifecycleStatus | null {
  if (!currentStatus) {
    return 'recruiting_students'
  }
  const transitions: Record<ProgramLifecycleStatus, ProgramLifecycleStatus | null> = {
    planned: 'instructor_recruitment_planned',
    instructor_recruitment_planned: 'volunteer_recruitment_planned',
    volunteer_recruitment_planned: 'recruiting_students',
    participant_instructor_recruitment_planned: 'participant_instructor_recruiting',
    recruiting_students: 'recruiting_instructors',
    recruiting_instructors: 'recruiting_volunteers',
    recruiting_volunteers: 'matching_completed',
    participant_instructor_recruiting: 'participant_instructor_recruitment_completed',
    matching_completed: 'education_completed',
    education_completed: 'document_processing_completed',
    document_processing_completed: null,
    participant_instructor_recruitment_completed: 'document_processing_completed',
  }
  return transitions[currentStatus] || null
}

/**
 * Program Lifecycle 이전 상태 계산 (7단계)
 * @param currentStatus 현재 상태
 * @returns 이전 상태 또는 null
 */
export function getPreviousProgramLifecycleStatus(
  currentStatus: ProgramLifecycleStatus | undefined
): ProgramLifecycleStatus | null {
  if (!currentStatus) {
    return null
  }
  const transitions: Record<ProgramLifecycleStatus, ProgramLifecycleStatus | null> = {
    planned: null,
    instructor_recruitment_planned: 'planned',
    volunteer_recruitment_planned: 'instructor_recruitment_planned',
    participant_instructor_recruitment_planned: 'volunteer_recruitment_planned',
    recruiting_students: 'participant_instructor_recruitment_planned',
    recruiting_instructors: 'recruiting_students',
    recruiting_volunteers: 'recruiting_instructors',
    participant_instructor_recruiting: 'participant_instructor_recruitment_planned',
    matching_completed: 'participant_instructor_recruiting',
    education_completed: 'matching_completed',
    document_processing_completed: 'education_completed',
    participant_instructor_recruitment_completed: 'participant_instructor_recruiting',
  }
  return transitions[currentStatus] || null
}

/**
 * Program Lifecycle 상태가 최종 상태인지 확인 (7단계)
 * @param status 상태
 * @returns 최종 상태 여부
 */
export function isProgramLifecycleFinalStatus(status: ProgramLifecycleStatus | undefined): boolean {
  return status === 'document_processing_completed'
}
