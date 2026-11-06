import type { Program } from '@/types/domain'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import type { SurveyAudienceTab } from '@/features/program/shared/lib/survey-management/survey-management-types'
import type {
  SurveyActionLabels,
  SurveyEmptyCopy,
} from '@/features/program/shared/lib/survey-management/survey-copy'
import {
  GENERAL_SATISFACTION_ACTION_LABELS,
  GENERAL_INDIVIDUAL_SATISFACTION_EMPTY_COPY,
  GENERAL_SATISFACTION_EMPTY_COPY,
} from '@/features/program/shared/lib/survey-management/survey-copy'
import { resolveProgramSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'

export type GeneralSatisfactionAudienceKey =
  | 'teacher'
  | 'student'
  | 'individual'
  | 'volunteer_h1'
  | 'volunteer_h2'

export const GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS = [
  { key: 'teacher', label: '교사' },
  { key: 'student', label: '학생' },
] as const satisfies ReadonlyArray<SurveyAudienceTab<GeneralSatisfactionAudienceKey>>

export const GENERAL_INDIVIDUAL_SATISFACTION_AUDIENCE_TABS = [
  { key: 'individual', label: '참여자' },
] as const satisfies ReadonlyArray<SurveyAudienceTab<GeneralSatisfactionAudienceKey>>

const GENERAL_SATISFACTION_AUDIENCE_LABELS: Record<GeneralSatisfactionAudienceKey, string> = {
  teacher: '교사',
  student: '학생',
  individual: '참여자',
  volunteer_h1: '상반기 봉사자',
  volunteer_h2: '하반기 봉사자',
}

export const GENERAL_SATISFACTION_NAV_TAB = 'satisfaction' as const

export type GeneralSatisfactionSurveyNavTab =
  | typeof GENERAL_SATISFACTION_NAV_TAB
  | 'satisfaction'
  | 'student_satisfaction'
  | 'teacher_satisfaction'

export const GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE: Record<
  GeneralSatisfactionAudienceKey,
  string
> = {
  teacher: 'survey-teacher',
  student: 'survey-student',
  individual: 'survey-student',
  volunteer_h1: 'survey-student',
  volunteer_h2: 'survey-student',
}

export function programHasVolunteerParticipant(program: Program): boolean {
  return (program.generalParticipantTypes ?? []).includes('volunteer')
}

export { isCompanySchoolProgram }

export function isTrainedTeachersProgram(program: Program): boolean {
  const backendType = program.backendProgramType?.trim().toUpperCase()
  if (
    backendType === 'TRAINED_TEACHER' ||
    backendType === 'TRAINED_TEACHER_PROGRAM' ||
    backendType === 'EDUCATED_TEACHER' ||
    backendType === 'EDUCATED_TEACHER_PROGRAM'
  ) {
    return true
  }
  return (
    program.id.startsWith('trained-teachers-prog-') ||
    program.id.startsWith('trained-teachers-local-')
  )
}

/** SATISFACTION form-binding `targetRole`. 교육받은 교사는 교사/학생 각각 바인딩. 1사1교는 교사만. */
export function resolveSatisfactionFormBindingTargetRole(
  program: Program,
  audience: GeneralSatisfactionAudienceKey | null | undefined
): 'TEACHER' | 'STUDENT' | 'VOLUNTEER' | 'INDIVIDUAL' | undefined {
  if (isCompanySchoolProgram(program)) return 'TEACHER'
  if (audience == null) {
    if (isTrainedTeachersProgram(program)) return 'TEACHER'
    return undefined
  }
  if (audience === 'teacher') return 'TEACHER'
  if (audience === 'student') return 'STUDENT'
  if (audience === 'volunteer_h1' || audience === 'volunteer_h2') return 'VOLUNTEER'
  return 'INDIVIDUAL'
}

/** 1사1교 — 교사용 만족도조사 단일 폼, 대상 탭 미노출 */
export function isInstitutionTeacherOnlySatisfactionProgram(program: Program): boolean {
  return isCompanySchoolProgram(program)
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
  if (isCompanySchoolProgram(program)) {
    return [{ key: 'teacher', label: '교사' }]
  }
  if (isTrainedTeachersProgram(program)) {
    return GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS
  }
  return isGeneralIndividualProgram(program)
    ? GENERAL_INDIVIDUAL_SATISFACTION_AUDIENCE_TABS
    : GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS
}

/** 공통 정보 설문 진행 항목 기준 — 노출할 만족도 대상 탭 */
export function getEnabledGeneralSatisfactionAudienceTabs(
  program: Program
): ReadonlyArray<SurveyAudienceTab<GeneralSatisfactionAudienceKey>> {
  const keys = resolveProgramSurveyMenuKeys(program)
  if (!keys.includes('satisfaction')) {
    return []
  }

  if (isCompanySchoolProgram(program)) {
    return [{ key: 'teacher', label: '교사' }]
  }
  if (isTrainedTeachersProgram(program)) {
    return GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS
  }

  if (isGeneralIndividualProgram(program)) {
    return GENERAL_INDIVIDUAL_SATISFACTION_AUDIENCE_TABS
  }

  return GENERAL_ORGANIZATION_SATISFACTION_AUDIENCE_TABS
}

export function programHasGeneralSatisfactionSurvey(program: Program): boolean {
  return getEnabledGeneralSatisfactionAudienceTabs(program).length > 0
}

export function isGeneralSatisfactionSurveyNavTab(tab: string): boolean {
  return (
    tab === GENERAL_SATISFACTION_NAV_TAB ||
    tab === 'satisfaction' ||
    tab === 'student_satisfaction' ||
    tab === 'teacher_satisfaction'
  )
}

/** 레거시 LNB 키·만족도 통합 탭 → 활성 대상 audience */
export function resolveGeneralSatisfactionAudienceFromNavTab(
  tab: string,
  program: Program,
  activeAudience: GeneralSatisfactionAudienceKey
): GeneralSatisfactionAudienceKey {
  const enabled = getEnabledGeneralSatisfactionAudienceTabs(program)
  if (tab === 'teacher_satisfaction') {
    return enabled.some(item => item.key === 'teacher') ? 'teacher' : activeAudience
  }
  if (tab === 'student_satisfaction') {
    if (enabled.some(item => item.key === 'student')) return 'student'
    if (enabled.some(item => item.key === 'individual')) return 'individual'
    if (enabled.some(item => item.key === 'volunteer_h1')) return 'volunteer_h1'
    if (enabled.some(item => item.key === 'volunteer_h2')) return 'volunteer_h2'
    return activeAudience
  }
  if (enabled.some(item => item.key === activeAudience)) {
    return activeAudience
  }
  return enabled[0]?.key ?? getDefaultGeneralSatisfactionAudience(program)
}

export function getGeneralSatisfactionEmptyCopy(
  _audience: GeneralSatisfactionAudienceKey,
  program: Program
): SurveyEmptyCopy {
  if (isGeneralIndividualProgram(program)) {
    return GENERAL_INDIVIDUAL_SATISFACTION_EMPTY_COPY
  }
  return GENERAL_SATISFACTION_EMPTY_COPY
}

export function getGeneralSatisfactionNoResponseTitle(
  audience: GeneralSatisfactionAudienceKey
): string {
  return `${GENERAL_SATISFACTION_AUDIENCE_LABELS[audience]}용 만족도조사는 아직 진행 전입니다.`
}

export function getGeneralSatisfactionCreateDescription(): string {
  return '새로운 만족도조사를 등록하시겠습니까?\n사용할 템플릿과 진행 방식을 선택해 주세요.'
}

export function getGeneralSatisfactionDeleteModalTitle(
  audience: GeneralSatisfactionAudienceKey
): string {
  return `${GENERAL_SATISFACTION_AUDIENCE_LABELS[audience]} 만족도조사 삭제 안내`
}

export function getGeneralSatisfactionActionLabels(): SurveyActionLabels {
  return GENERAL_SATISFACTION_ACTION_LABELS
}

export function getDefaultGeneralSatisfactionAudience(
  program: Program
): GeneralSatisfactionAudienceKey {
  const enabled = getEnabledGeneralSatisfactionAudienceTabs(program)
  if (enabled.length > 0) {
    return enabled[0].key
  }
  return isGeneralIndividualProgram(program) ? 'individual' : 'teacher'
}

export function getGeneralSatisfactionAudienceLabel(
  audience: GeneralSatisfactionAudienceKey
): string {
  return GENERAL_SATISFACTION_AUDIENCE_LABELS[audience] ?? '참여자'
}
