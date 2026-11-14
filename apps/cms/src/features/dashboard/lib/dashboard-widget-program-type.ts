/** 위젯 key → dashboard 목록 쿼리 `programType` */
const WIDGET_PROGRAM_TYPE_PARAM: Record<string, string> = {
  'program-schedule-general-widget': 'general',
  'program-schedule-company-school-widget': 'company_school',
  'program-schedule-ujat-widget': 'ujat',
  'program-schedule-gemini-widget': 'gemini',
  // 별칭 없음 — canonical program_type (program-schedule-keys 참고)
  'program-schedule-trained-teacher-widget': 'TRAINED_TEACHER',
}

export function getDashboardProgramTypeParamForWidget(widgetKey: string): string | undefined {
  return WIDGET_PROGRAM_TYPE_PARAM[widgetKey]
}
