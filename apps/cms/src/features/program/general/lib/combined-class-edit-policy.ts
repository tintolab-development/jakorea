import type { Program } from '@/types/domain'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

/** 단일 회차 프로그램에서만 합반 신청 가능 */
export function isCombinedClassProgramEligible(program: Program | null | undefined): boolean {
  return program?.generalProgramSessionRound === 'single'
}

export type CombinedClassPartnerOption = {
  value: string
  label: string
  educationGrade: string
}

export function resolveCombinedClassApplyRadioDisabled(
  partnerOptions: ReadonlyArray<unknown>
): boolean {
  return partnerOptions.length < 1
}

/** 진행된 교육(완료 회차)이 있으면 합반 반영 시점 안내 노출 */
export function hasCompletedCombinedClassEducationSessions(
  sessions: ReadonlyArray<ParticipatingSchoolSession> | null | undefined
): boolean {
  return (sessions ?? []).some(session => session.status === 'completed')
}
