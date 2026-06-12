/** 위젯 key → dashboard API params.programType */
const WIDGET_PROGRAM_TYPE_PARAM: Record<string, string> = {
  'program-schedule-general-widget': 'general',
  'program-schedule-company-school-widget': 'company_school',
  'program-schedule-ujat-widget': 'ujat',
  'program-schedule-gemini-widget': 'gemini',
}

export function getDashboardProgramTypeParamForWidget(widgetKey: string): string | undefined {
  return WIDGET_PROGRAM_TYPE_PARAM[widgetKey]
}
