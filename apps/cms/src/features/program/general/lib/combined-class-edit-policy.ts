import type { Program } from '@/types/domain'

/** 단일·복수 회차 프로그램에서 합반 신청 가능 (일정형 등 sessionRound 미설정은 제외) */
export function isCombinedClassProgramEligible(program: Program | null | undefined): boolean {
  const round = program?.generalProgramSessionRound
  return round === 'single' || round === 'multi'
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
