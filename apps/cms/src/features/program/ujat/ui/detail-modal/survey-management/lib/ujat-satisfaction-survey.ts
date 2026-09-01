import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'

export type UjatSurveyProgressStatus = 'before_start' | 'in_progress' | 'finished'

export type UjatRegisteredSurvey = RegisteredSurvey

export type UjatSatisfactionAudienceKey = 'teacher' | 'volunteer_h1' | 'volunteer_h2'

export const UJAT_SATISFACTION_AUDIENCE_TABS = [
  { key: 'teacher', label: '교사' },
  { key: 'volunteer_h1', label: '상반기 봉사자' },
  { key: 'volunteer_h2', label: '하반기 봉사자' },
] as const satisfies ReadonlyArray<{ key: UjatSatisfactionAudienceKey; label: string }>

export const UJAT_SATISFACTION_TEMPLATE_BY_AUDIENCE: Record<UjatSatisfactionAudienceKey, string> = {
  teacher: 'survey-teacher',
  volunteer_h1: 'survey-student',
  volunteer_h2: 'survey-student',
}

export type UjatSatisfactionSurveyByAudience = Partial<
  Record<UjatSatisfactionAudienceKey, UjatRegisteredSurvey>
>

const SATISFACTION_AUDIENCE_LABEL: Record<UjatSatisfactionAudienceKey, string> = {
  teacher: '교사',
  volunteer_h1: '상반기 봉사자',
  volunteer_h2: '하반기 봉사자',
}

export function getSatisfactionAudienceLabel(audience: UjatSatisfactionAudienceKey): string {
  return SATISFACTION_AUDIENCE_LABEL[audience]
}

export function getSatisfactionNoResponseTitle(audience: UjatSatisfactionAudienceKey): string {
  return `${getSatisfactionAudienceLabel(audience)}용 만족도조사는 아직 진행 전입니다.`
}

export function getSatisfactionDeleteModalSubject(audience: UjatSatisfactionAudienceKey): string {
  return `${getSatisfactionAudienceLabel(audience)} 만족도조사`
}

export function getSatisfactionAudienceTabs(): typeof UJAT_SATISFACTION_AUDIENCE_TABS {
  return UJAT_SATISFACTION_AUDIENCE_TABS
}
