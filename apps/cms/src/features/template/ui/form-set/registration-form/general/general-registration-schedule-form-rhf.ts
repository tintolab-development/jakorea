/**
 * 일반 등록 교육 예정일 목록(scheduleLines) — RHF 필드 폼.
 *
 * Part3 5단계: 일반 등록 overlay 스토어에서 예정일 목록 키를 RHF로 옮겼다.
 * - 키: `generalRegistration.educationScheduleSettings.scheduleLines` 와 모드별 보관 키(`scheduleLinesByDate`·`scheduleLinesByPeriod`).
 * - 값 형식은 그대로다(V27 DB 함수가 읽는 문자열 배열, 예: `2026.12.01(화) 10:00~12:00`). 변환하지 않는다.
 * - 일반 위저드: RHF `scheduleLines` 가 정본이고, 같은 값을 이 폼에도 둔다(예전 스토어 투영과 같은 위치).
 * - 상세·양식 편집기: 이 폼이 정본.
 * - 등록 스토어(`program-registration-overlay-sync`)는 이 폼을 합성해서 기존 읽기·저장 결과를 그대로 만든다.
 */
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'
import { GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY } from './program-registration-overlay-keys'

/** 모드별 보관 키는 `education-schedule-mode-lines` 의 `educationScheduleModeStashKey` 와 같은 규칙(`<prefix>.scheduleLinesBy*`) */
const schedulePrefix = GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY.replace(/\.scheduleLines$/, '')

export const GENERAL_REGISTRATION_SCHEDULE_LINE_KEYS: readonly string[] = [
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
  `${schedulePrefix}.scheduleLinesByDate`,
  `${schedulePrefix}.scheduleLinesByPeriod`,
]

export function isGeneralRegistrationScheduleLineKey(key: string): boolean {
  return GENERAL_REGISTRATION_SCHEDULE_LINE_KEYS.includes(key)
}

export const generalRegistrationScheduleFieldForm = createScopedRhfFieldForm({
  ownsKey: isGeneralRegistrationScheduleLineKey,
})
