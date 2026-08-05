export type CalendarLegendItem = {
  key: string
  label: string
  color: string
}

export const CALENDAR_LEGEND_ITEMS: CalendarLegendItem[] = [
  { key: 'assignment', label: '과제 제출', color: '#F5CC00' },
  { key: 'satisfaction', label: '만족도조사', color: '#557BFA' },
  { key: 'survey', label: '설문조사', color: '#FA8484' },
  { key: 'receipt', label: '영수증 신청 마감', color: '#9EE9F7' },
  { key: 'education', label: '교육 일정', color: '#C593FF' },
  { key: 'program', label: '프로그램 일정', color: '#9FE35B' },
]
