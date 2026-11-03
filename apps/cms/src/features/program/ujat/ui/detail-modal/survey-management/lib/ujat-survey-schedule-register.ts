/**
 * UJAT 설문·만족도·강의평가 등록 — 교육 일정 선택 UI
 * education-slots 후보 개수만 본다. 공통정보 기간형 분기로 숨기지 않는다.
 */

export function resolveUjatSurveyScheduleFieldFromOptions(
  options: ReadonlyArray<{ value?: string | number | null }>
): { showScheduleField: boolean; singleScheduleValue: string | null } {
  const values = options
    .map(option => String(option.value ?? '').trim())
    .filter(value => value !== '')
  if (values.length > 1) {
    return { showScheduleField: true, singleScheduleValue: null }
  }
  return {
    showScheduleField: false,
    singleScheduleValue: values[0] ?? null,
  }
}
