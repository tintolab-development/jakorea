import type { Program } from '@/types/domain'
import type { SurveyAudienceTab } from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { SurveyActionLabels, SurveyEmptyCopy } from '@/features/program/shared/lib/survey-management/survey-copy'
import {
  GENERAL_SATISFACTION_ACTION_LABELS,
  GENERAL_SATISFACTION_EMPTY_COPY,
  GENERAL_STUDENT_SATISFACTION_EMPTY_COPY,
} from '@/features/program/shared/lib/survey-management/survey-copy'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'

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

export const GENERAL_VOLUNTEER_SATISFACTION_AUDIENCE_TABS = [
  { key: 'volunteer_h1', label: '상반기 봉사자' },
  { key: 'volunteer_h2', label: '하반기 봉사자' },
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

/** 공통 정보 설문 진행 항목 기준 — 노출할 만족도 대상 탭 */
export function getEnabledGeneralSatisfactionAudienceTabs(
  program: Program
): ReadonlyArray<SurveyAudienceTab<GeneralSatisfactionAudienceKey>> {
  const keys = normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys ?? [])
  const tabs: SurveyAudienceTab<GeneralSatisfactionAudienceKey>[] = []

  if (isGeneralIndividualProgram(program)) {
    if (!keys.includes('student_satisfaction') && !keys.includes('teacher_satisfaction')) {
      return []
    }
    if (keys.includes('teacher_satisfaction')) {
      tabs.push({ key: 'teacher', label: '교사' })
    }
    if (keys.includes('student_satisfaction')) {
      if (programHasVolunteerParticipant(program)) {
        tabs.push(...GENERAL_VOLUNTEER_SATISFACTION_AUDIENCE_TABS)
      } else {
        tabs.push({ key: 'individual', label: '참여자' })
      }
    }
    return tabs
  }

  if (keys.includes('teacher_satisfaction')) {
    tabs.push({ key: 'teacher', label: '교사' })
  }
  if (keys.includes('student_satisfaction')) {
    if (programHasVolunteerParticipant(program)) {
      tabs.push(...GENERAL_VOLUNTEER_SATISFACTION_AUDIENCE_TABS)
    } else {
      tabs.push({ key: 'student', label: '학생' })
    }
  }
  return tabs
}

export function programHasGeneralSatisfactionSurvey(program: Program): boolean {
  return getEnabledGeneralSatisfactionAudienceTabs(program).length > 0
}

export function isGeneralSatisfactionSurveyNavTab(tab: string): boolean {
  return (
    tab === GENERAL_SATISFACTION_NAV_TAB ||
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
  audience: GeneralSatisfactionAudienceKey,
  program: Program
): SurveyEmptyCopy {
  if (isGeneralIndividualProgram(program)) {
    if (audience === 'teacher') {
      return {
        title: GENERAL_SATISFACTION_EMPTY_COPY.title,
        description: GENERAL_SATISFACTION_EMPTY_COPY.description,
        secondaryDescription:
          '기관별 개별 폼이 아닌 하나의 폼으로 진행되며, 등록 시 해당 프로그램 참여 교사에게 동일하게 노출됩니다. 수업 직후 바로 진행됩니다.',
        registerButton: '만족도조사 등록',
      }
    }
    if (audience === 'volunteer_h1' || audience === 'volunteer_h2') {
      return {
        ...GENERAL_SATISFACTION_EMPTY_COPY,
        secondaryDescription:
          '만족도조사 등록 시 해당 프로그램 참여 봉사자에게 동일하게 노출됩니다. 마지막 교육 일정 이후 진행됩니다.',
        registerButton: '만족도조사 등록',
      }
    }
    return {
      ...GENERAL_SATISFACTION_EMPTY_COPY,
      secondaryDescription:
        '만족도조사 등록 시 해당 프로그램 참여자에게 동일하게 노출됩니다. 기관 구분 없이 하나의 폼으로 진행됩니다.',
      registerButton: '만족도조사 등록',
    }
  }
  if (audience === 'student') {
    return {
      ...GENERAL_STUDENT_SATISFACTION_EMPTY_COPY,
      registerButton: '만족도조사 등록',
    }
  }
  if (audience === 'volunteer_h1' || audience === 'volunteer_h2') {
    return {
      ...GENERAL_SATISFACTION_EMPTY_COPY,
      secondaryDescription:
        '만족도조사 등록 시 해당 프로그램 참여 봉사자에게 동일하게 노출됩니다. 마지막 교육 일정 이후 진행됩니다.',
      registerButton: '만족도조사 등록',
    }
  }
  return {
    title: GENERAL_SATISFACTION_EMPTY_COPY.title,
    description: GENERAL_SATISFACTION_EMPTY_COPY.description,
    secondaryDescription:
      '기관별 개별 폼이 아닌 하나의 폼으로 진행되며, 등록 시 해당 프로그램의 모든 학교에 동일하게 노출됩니다. 수업 직후 바로 진행됩니다.',
    registerButton: '만족도조사 등록',
  }
}

export function getGeneralSatisfactionNoResponseTitle(
  audience: GeneralSatisfactionAudienceKey
): string {
  return `${GENERAL_SATISFACTION_AUDIENCE_LABELS[audience]}용 만족도조사는 아직 진행 전입니다.`
}

export function getGeneralSatisfactionCreateDescription(
  audience: GeneralSatisfactionAudienceKey
): string {
  if (audience === 'teacher') {
    return '교사용 만족도조사를 등록하시겠습니까?\n기관별 개별 폼이 아닌 하나의 폼으로 진행되며, 등록 시 해당 프로그램 참여 교사에게 동일하게 노출됩니다.'
  }
  if (audience === 'volunteer_h1' || audience === 'volunteer_h2') {
    const label = GENERAL_SATISFACTION_AUDIENCE_LABELS[audience]
    return `${label}용 만족도조사를 등록하시겠습니까?\n등록 시 해당 프로그램 참여 봉사자에게 동일하게 노출되며, 마지막 교육 일정 이후 진행됩니다.`
  }
  if (audience === 'individual') {
    return '만족도조사를 등록하시겠습니까?\n등록 시 해당 프로그램 참여자에게 동일하게 노출되며, 기관 구분 없이 하나의 폼으로 진행됩니다.'
  }
  if (audience === 'student') {
    return '만족도조사를 등록하시겠습니까?\n등록 후 링크 공유하여 비회원(학생) 대상으로 진행할 수 있습니다.\n기관 구분 없이 하나의 폼으로 진행됩니다.'
  }
  return '만족도조사를 등록하시겠습니까?'
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
