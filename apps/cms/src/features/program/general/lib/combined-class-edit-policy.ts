import type { Program } from '@/types/domain'

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
