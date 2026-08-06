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
  /** 목록·캘린더 스틱 타이틀 (예: 영수증 신청 마감일, 2회차) */
  title: string
  /** 목록 시간 문구 (예: 종일, 09:00~15:00) */
  time: string
  type: MypageScheduleEventType
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
}
