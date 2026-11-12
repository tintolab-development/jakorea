export type CalendarLegendItem = {
  key: CalendarScheduleEventKey
  label: string
  color: string
}

/** 나의 홈 캘린더 이벤트·범례 dot 색 키 (범례에 안 나오는 유형 포함). */
export type CalendarScheduleEventKey =
  | 'assignment'
  | 'satisfaction'
  | 'survey'
  | 'receipt'
  | 'education'
  | 'lecture_report_deadline'

/** 이용 가이드 슬라이드 23 — 5종 범례 (과제·강의보고서는 한 항목). */
export const CALENDAR_LEGEND_ITEMS: CalendarLegendItem[] = [
  { key: 'assignment', label: '과제·강의보고서', color: '#F5CC00' },
  { key: 'survey', label: '설문조사', color: '#FA8484' },
  { key: 'satisfaction', label: '만족도조사', color: '#557BFA' },
  { key: 'receipt', label: '지급조서·영수증 신청 마감', color: '#9EE9F7' },
  { key: 'education', label: '프로그램 일정', color: '#9FE35B' },
]
