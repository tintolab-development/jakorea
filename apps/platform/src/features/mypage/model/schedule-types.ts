export type MypageScheduleEventType =
  | 'assignment'
  | 'satisfaction'
  | 'survey'
  | 'receipt'
  | 'education'
  | 'program'

export type MypageScheduleEvent = {
  id: string
  programName: string
  /** 목록 하단·바 보조 문구 (예: 시작일, 2회차 09:00~15:00) */
  title: string
  type: MypageScheduleEventType
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
}
