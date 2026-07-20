/** 2차 면접 심사 현황 — CMS 전체 공통 */
export type SecondInterviewScreeningStatus =
  | 'waiting'
  | 'completed'
  | 'pass'
  | 'fail'
  | 'reserve1'
  | 'reserve2'
  | 'reserve3'
  | 'reserve4'

/** `waiting`·`completed`는 저장하지 않음 — 배정 면접 종료 시각 기준 자동 계산 */
export const SECOND_INTERVIEW_SCREENING_STATUS_ORDER: readonly SecondInterviewScreeningStatus[] =
  ['waiting', 'completed', 'pass', 'fail', 'reserve1', 'reserve2', 'reserve3', 'reserve4'] as const

export const SECOND_INTERVIEW_SCREENING_STATUS_LABELS: Record<
  SecondInterviewScreeningStatus,
  string
> = {
  waiting: '면접 진행 대기',
  completed: '면접 진행 완료',
  pass: '면접 합격',
  fail: '면접 불합격',
  reserve1: '예비 1',
  reserve2: '예비 2',
  reserve3: '예비 3',
  reserve4: '예비 4',
}

/** 캘린더 우측 리스트·뱃지용 짧은 라벨 */
export const SECOND_INTERVIEW_SCREENING_LIST_BADGE_LABELS: Record<
  SecondInterviewScreeningStatus,
  string
> = {
  waiting: '진행 대기',
  completed: '진행 완료',
  pass: '면접 합격',
  fail: '불합격',
  reserve1: '예비 1',
  reserve2: '예비 2',
  reserve3: '예비 3',
  reserve4: '예비 4',
}

/** 면접 컨텍스트 활동 포기 표기 */
export const VOLUNTEER_ACTIVITY_WITHDRAWN_LABEL = '활동 포기'
