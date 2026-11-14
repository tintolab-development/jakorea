import {
  resolveInstitutionApplicationProgramBridge,
  type InstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import type { SurveyPollScheduleSelectOption } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import type { Program } from '@/types/domain'

export { resolveSurveyPollBindingTargetWhenScheduleFieldHidden } from '@/features/program/shared/lib/survey-management/resolve-survey-poll-hidden-schedule-binding'

export function isSurveyPollPeriodProgram(program: Program | null | undefined): boolean {
  if (program == null) return false
  const bridge = resolveInstitutionApplicationProgramBridge(program)
  return bridge.educationScheduleMode === 'period'
}

export function isSurveyPollScheduleMultiEventProgram(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return bridge.educationStructure === 'schedule' && bridge.sessionRound === 'multi'
}

export type SurveyPollScheduleFieldSource = {
  /** `GET .../education-slots` 기준 옵션 — 이미 설문이 연결된 일정은 `disabled` */
  options: ReadonlyArray<Pick<SurveyPollScheduleSelectOption, 'disabled'>>
  isLoading: boolean
}

/**
 * CMS 신규 설문 — 「설문 대상 일정」 노출.
 * 기능정의서(설문·만족도조사 신규 등록·대상 일정 지정): 설문조사는 교육 일정 하나에 하나만 등록하고,
 * 일정 선택 필드는 **선택 가능한 일정이 있을 때만** 노출한다.
 * - 기간 지정: 숨김 → PROGRAM 바인딩
 * - 서버 일정(education-slots) 중 아직 설문이 없는 일정이 1개 이상: 노출 (불러오는 중에도 노출 — 비활성 드롭다운)
 * - 선택 가능한 일정 없음: 숨김 → 등록 시 안내(일정 없음 / 이미 등록된 일정)
 */
export function shouldShowSurveyPollScheduleSelectField(
  program: Program | null | undefined,
  schedules: SurveyPollScheduleFieldSource
): boolean {
  if (program == null) return true
  if (isSurveyPollPeriodProgram(program)) return false
  if (schedules.isLoading) return true
  return schedules.options.some(option => !option.disabled)
}
