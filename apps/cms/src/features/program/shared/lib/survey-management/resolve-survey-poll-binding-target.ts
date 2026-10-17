import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import { SURVEY_POLL_TARGET_ALL_VALUE } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'

export type SurveyPollBindingTarget = Pick<
  ProgramFormBindingRequest,
  'targetScope' | 'targetScopeId'
>

export function resolveSurveyPollBindingTarget(selection: string): SurveyPollBindingTarget {
  const trimmed = selection.trim()
  if (trimmed === SURVEY_POLL_TARGET_ALL_VALUE) {
    return { targetScope: 'PROGRAM' }
  }
  const scheduleId = Number(trimmed)
  if (!Number.isFinite(scheduleId) || scheduleId < 1) {
    throw new Error('INVALID_SURVEY_POLL_SCHEDULE_SELECTION')
  }
  return { targetScope: 'SCHEDULE', targetScopeId: Math.trunc(scheduleId) }
}
