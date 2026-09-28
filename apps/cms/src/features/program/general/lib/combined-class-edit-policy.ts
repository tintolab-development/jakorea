import { isGeneralOrganizationProgram } from '@/features/program/general/lib/organization-merge-program-type'
import type { Program } from '@/types/domain'

/** GENERAL_ORGANIZATION 이면서 단일 회차일 때만 합반 신청 가능 */
export function isCombinedClassProgramEligible(program: Program | null | undefined): boolean {
  return (
    isGeneralOrganizationProgram(program) && program?.generalProgramSessionRound === 'single'
  )
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
