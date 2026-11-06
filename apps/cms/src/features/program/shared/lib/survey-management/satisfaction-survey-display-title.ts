import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'
import {
  composeSatisfactionSurveyDisplayTitle,
  formatSatisfactionPerScheduleDisplayName,
  hasSatisfactionScheduleDisplayParts,
  isSatisfactionPerScheduleBinding,
} from '@/shared/lib/education-schedule-name'

export type SatisfactionDisplaySchedule = {
  id?: number | null
  scheduleName?: string | null
  sessionNo?: number | null
  startAt?: string | null
  startDate?: string | null
}

/**
 * 만족도조사 미리보기·공유 헤더.
 * 일정별: `1회차 · 2026.11.12(목) 만족도조사 (학생용)`
 * 그 외: 매핑된 양식이름만.
 */
export function resolveSatisfactionSurveyDisplayTitle(
  survey: Pick<
    RegisteredSurvey,
    'title' | 'targetScope' | 'targetScopeId' | 'targetScopeLabel' | 'satisfactionRunMode'
  >,
  schedules: ReadonlyArray<SatisfactionDisplaySchedule> = []
): string {
  const formName = survey.title?.trim() || '만족도조사'
  const perSchedule = isSatisfactionPerScheduleBinding({
    runMode: survey.satisfactionRunMode,
    targetScope: survey.targetScope,
  })
  if (!perSchedule) return formName

  const slot = schedules.find(row => row.id === survey.targetScopeId)
  const scheduleInput = {
    scheduleName: slot?.scheduleName ?? survey.targetScopeLabel,
    sessionNo: slot?.sessionNo,
    startAt: slot?.startAt ?? slot?.startDate ?? null,
  }
  if (!hasSatisfactionScheduleDisplayParts(scheduleInput)) return formName
  return composeSatisfactionSurveyDisplayTitle({
    formName,
    perSchedule: true,
    scheduleDisplayName: formatSatisfactionPerScheduleDisplayName(scheduleInput),
  })
}
