import type { Program } from '@/types/domain'
import type { SurveyAudienceTab } from '@/features/program/shared/lib/survey-management/survey-management-types'

export type GeneralSatisfactionAudienceKey = 'teacher' | 'student' | 'individual'

export const GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS = [
  { key: 'teacher', label: '교사' },
  { key: 'student', label: '학생' },
] as const satisfies ReadonlyArray<SurveyAudienceTab<GeneralSatisfactionAudienceKey>>

export const GENERAL_INDIVIDUAL_SATISFACTION_AUDIENCE_TABS = [
  { key: 'individual', label: '참여자' },
] as const satisfies ReadonlyArray<SurveyAudienceTab<GeneralSatisfactionAudienceKey>>

export const GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE: Record<
  GeneralSatisfactionAudienceKey,
  string
> = {
  teacher: 'survey-teacher',
  student: 'survey-student',
  individual: 'survey-student',
}

export function isGeneralIndividualProgram(program: Program): boolean {
  if (program.generalProgramAudience != null) {
    return program.generalProgramAudience === 'individual'
  }
  const participantTypes = program.generalParticipantTypes ?? []
  return participantTypes.includes('individual') && !participantTypes.includes('school_institution')
}

/** 참여자 유형 [개인]만 선택 — KPI 학교·학급 해당 없음 */
export function isGeneralIndividualParticipantSelection(
  participantIndividual: boolean,
  participantOrganization: boolean
): boolean {
  return participantIndividual && !participantOrganization
}

export function isGeneralIndividualParticipantTarget(
  program: Program,
  participantIndividual?: boolean,
  participantOrganization?: boolean
): boolean {
  if (participantIndividual != null || participantOrganization != null) {
    return isGeneralIndividualParticipantSelection(
      Boolean(participantIndividual),
      Boolean(participantOrganization)
    )
  }
  return isGeneralIndividualProgram(program)
}

export function getGeneralSatisfactionAudienceTabs(
  program: Program
): ReadonlyArray<SurveyAudienceTab<GeneralSatisfactionAudienceKey>> {
  return isGeneralIndividualProgram(program)
    ? GENERAL_INDIVIDUAL_SATISFACTION_AUDIENCE_TABS
    : GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS
}

export function getDefaultGeneralSatisfactionAudience(
  program: Program
): GeneralSatisfactionAudienceKey {
  return isGeneralIndividualProgram(program) ? 'individual' : 'teacher'
}

export function getGeneralSatisfactionAudienceLabel(
  audience: GeneralSatisfactionAudienceKey
): string {
  return (
    [...GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS, ...GENERAL_INDIVIDUAL_SATISFACTION_AUDIENCE_TABS]
      .find(tab => tab.key === audience)?.label ?? '참여자'
  )
}
