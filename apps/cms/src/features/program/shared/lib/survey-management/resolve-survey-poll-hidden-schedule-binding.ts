import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import { buildSurveyPollScheduleSelectOptionsForProgram } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import { isSurveyPollPeriodProgram } from '@/features/program/shared/lib/survey-management/should-show-survey-poll-schedule-field'
import type { SurveyPollBindingTarget } from '@/features/program/shared/lib/survey-management/resolve-survey-poll-binding-target'
import type { Program } from '@/types/domain'

/**
 * 설문 일정 필드가 숨겨진 경우의 SCHEDULE 바인딩.
 * 강의평가용 `resolveLectureEvalBindingTarget`과 분리한다.
 */
export async function resolveSurveyPollBindingTargetWhenScheduleFieldHidden(
  program: Program
): Promise<SurveyPollBindingTarget | null> {
  if (isSurveyPollPeriodProgram(program)) {
    return { targetScope: 'PROGRAM' }
  }

  const programId = program.id != null ? String(program.id).trim() : ''
  if (!programId) return null

  const apiSchedules = await fetchProgramPlannedEducationSlots(programId)
  const options = buildSurveyPollScheduleSelectOptionsForProgram(program, apiSchedules)
  if (options.length !== 1) return null

  const scheduleId = Number(options[0]?.value)
  if (!Number.isFinite(scheduleId) || scheduleId <= 0) return null

  return {
    targetScope: 'SCHEDULE',
    targetScopeId: Math.trunc(scheduleId),
  }
}
