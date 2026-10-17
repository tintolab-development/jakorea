import {
  resolveInstitutionApplicationProgramBridge,
  type InstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { countEducationScheduleChoiceSlots } from '@jakorea/form-schema/program-application'
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

/**
 * CMS 신규 설문 — 「설문 대상 일정」 노출 (신청 양식 단락 SSOT와 다름).
 * - 기간 지정: 숨김 → PROGRAM 바인딩
 * - 일정형 + 복수 회차: 항상 노출 (행사 1건이어도 드롭다운 1개)
 * - 날짜 지정 + 선택 슬롯 2개 이상: 노출
 * - 그 외(슬롯 1 등): 숨김 → 대표 회차 SCHEDULE 자동
 */
export function shouldShowSurveyPollScheduleSelectField(
  program: Program | null | undefined
): boolean {
  if (program == null) return true
  const bridge = resolveInstitutionApplicationProgramBridge(program)
  if (bridge.educationScheduleMode === 'period') return false
  if (isSurveyPollScheduleMultiEventProgram(bridge)) return true
  return countEducationScheduleChoiceSlots(bridge.educationScheduleLines) > 1
}

