/**
 * 1사1교 신규 등록 필수검사 — Overlay store가 아니라 RHF projection.
 */
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import { listIncompleteEconomyProgramRegistrationRequiredFields } from '@/features/program/general/lib/economy-program-registration-required-fields'
import { COMPANY_SCHOOL_UNSELECTED } from './registration-rhf-values'
import {
  projectCompanySchoolRhfToOverlayRecord,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'

const DEFAULT_PARTICIPANT: ProgramRegistrationParticipantSelection = {
  individual: false,
  organization: true,
  teacherInstructor: true,
  volunteer: false,
}

export function listIncompleteCompanySchoolRegistrationRhfRequiredFields(
  values: CompanySchoolRegistrationRhfValues,
  participant: ProgramRegistrationParticipantSelection = DEFAULT_PARTICIPANT
): string[] {
  const reasons = listIncompleteEconomyProgramRegistrationRequiredFields(
    projectCompanySchoolRhfToOverlayRecord(values),
    participant
  )
  const sponsor = values.sponsorId.trim()
  if ((!sponsor || sponsor === COMPANY_SCHOOL_UNSELECTED) && !reasons.includes('basicInfo.sponsorId')) {
    reasons.push('basicInfo.sponsorId')
  }
  if (values.managerContactIds.length === 0 && !reasons.includes('basicInfo.managerContact')) {
    reasons.push('basicInfo.managerContact')
  }
  return reasons
}

export function describeIncompleteCompanySchoolRegistrationRhfRequiredFields(
  values: CompanySchoolRegistrationRhfValues,
  participant: ProgramRegistrationParticipantSelection = DEFAULT_PARTICIPANT
): string | null {
  return listIncompleteCompanySchoolRegistrationRhfRequiredFields(values, participant)[0] ?? null
}

export function hasIncompleteCompanySchoolRegistrationRhfRequiredFields(
  values: CompanySchoolRegistrationRhfValues,
  participant: ProgramRegistrationParticipantSelection = DEFAULT_PARTICIPANT
): boolean {
  return describeIncompleteCompanySchoolRegistrationRhfRequiredFields(values, participant) != null
}
