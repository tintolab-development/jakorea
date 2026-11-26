/**
 * 프로그램 목록 — 삭제 가능 여부 (체크박스 비활성 UI 가드)
 * 목록의 확인된 참여 인원만 사전 차단한다. 기간/진행 상태는 실제 활동 이력이 아니다.
 * 신청·출결·실적·정산 등 최종 삭제 가능 여부는 BE의 삭제 가드가 판단한다.
 */

import type { ProgramLifecycleStatus, UjatProgramProgressStatus } from '@/types/domain'

/** 진행 상태는 기존 DTO 호출과 회귀 검증을 위해 받되 삭제 판단에 사용하지 않는다. */
export interface ProgramListDeleteEligibilityInput {
  lifecycleStatus?: ProgramLifecycleStatus
  ujatProgressStatus?: UjatProgramProgressStatus
  participantApprovedCount?: number | null
  approvedOrganizationApplicationCount?: number | null
  participatingSchoolCount?: number | null
  participatingStudentCount?: number | null
}

export const PROGRAM_DELETE_LIST_NOTICE =
  '유효한 신청 또는 교육 진행 이력이 있는 프로그램은 삭제할 수 없습니다.'

function isPositive(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function resolveProgramListDeleteBlocked(input: ProgramListDeleteEligibilityInput): boolean {
  return (
    isPositive(input.participantApprovedCount) ||
    isPositive(input.approvedOrganizationApplicationCount) ||
    isPositive(input.participatingSchoolCount) ||
    isPositive(input.participatingStudentCount)
  )
}
