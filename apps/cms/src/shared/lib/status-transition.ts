/**
 * 상태 전환 로직 중앙화
 * Phase 3: 상태 전환 규칙 및 헬퍼 함수
 */

import type { ApplicationStatus, SettlementStatus } from '@/types/domain'

/**
 * Application 상태 전환 규칙
 * submitted -> reviewing -> approved/rejected
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  submitted: ['reviewing', 'cancelled'],
  reviewing: ['approved', 'rejected', 'cancelled'],
  approved: [], // 최종 상태
  rejected: [], // 최종 상태
  cancelled: [], // 최종 상태
}

/**
 * Settlement 상태 전환 규칙
 * pending -> calculated -> review -> approved -> paid
 * (cancelled는 언제든 전환 가능, 일부 상태는 이전 단계로도 되돌릴 수 있도록 허용)
 */
export const SETTLEMENT_STATUS_TRANSITIONS: Record<
  SettlementStatus,
  SettlementStatus[]
> = {
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
export function getNextApplicationStatuses(
  currentStatus: ApplicationStatus
): ApplicationStatus[] {
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
    approved: null,
    rejected: null,
    cancelled: null,
  }
  return transitions[currentStatus] || null
}

/**
 * Application 상태가 최종 상태인지 확인
 * @param status 상태
 * @returns 최종 상태 여부
 */
export function isApplicationFinalStatus(status: ApplicationStatus): boolean {
  return ['approved', 'rejected', 'cancelled'].includes(status)
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
export function getNextSettlementStatuses(
  currentStatus: SettlementStatus
): SettlementStatus[] {
  return SETTLEMENT_STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Settlement 자동 다음 상태 계산 (워크플로우 기반)
 * pending -> calculated -> review -> approved -> paid
 * @param currentStatus 현재 상태
 * @returns 다음 상태 또는 null (자동 전환 불가)
 */
export function getNextSettlementStatus(
  currentStatus: SettlementStatus
): SettlementStatus | null {
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





