/** 교육 진행 일정 열 고정 폭 */
export const PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH = 360

/** 진행 희망·담당 일정 열 — 헤더·셀 중앙 정렬 (참여 기관/강사/봉사자 목록 공통) */
export const PARTICIPATING_SCHEDULE_TABLE_TH_CENTER_CLASS =
  'participating-institutions-section__th-sessions participating-institutions-section__th-sessions--center'

export const PARTICIPATING_SCHEDULE_TABLE_TD_CENTER_CLASS =
  'participating-institutions-section__td-sessions participating-institutions-section__td-sessions--center'

export function participatingScheduleTableColumnLayout() {
  return {
    align: 'center' as const,
    className: PARTICIPATING_SCHEDULE_TABLE_TH_CENTER_CLASS,
    onHeaderCell: () => ({ className: PARTICIPATING_SCHEDULE_TABLE_TH_CENTER_CLASS }),
    onCell: () => ({ className: PARTICIPATING_SCHEDULE_TABLE_TD_CENTER_CLASS }),
  }
}

/** 교재 배송 현황 테이블 열 최소 폭 */
export const PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_COLUMN_WIDTH = 140

/** 교재 배송 현황 StatusDropdownCell 배지 폭 (editable-status-badge 스펙) */
export const PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_BADGE_WIDTH = 100

/** StatusDropdownCell `style` — 배지 100×32, max-width 200 (tag100 레이아웃과 병행) */
export const PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_STYLE = {
  width: PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_BADGE_WIDTH,
  minWidth: PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_BADGE_WIDTH,
  maxWidth: 200,
  height: 32,
  minHeight: 32,
  maxHeight: 32,
} as const

/** 교육 학급 수 열 폭 (헤더 잘림 방지) */
export const PARTICIPATING_INSTITUTIONS_CLASS_COUNT_COLUMN_WIDTH = 112

/** 배정 강사 열 폭 */
export const PARTICIPATING_INSTITUTIONS_ASSIGNED_INSTRUCTOR_COLUMN_WIDTH = 140

/** 참여 기관 목록 테이블 최소 가로 스크롤 폭(열 width 합) */
export const PARTICIPATING_INSTITUTIONS_TABLE_MIN_SCROLL_X =
  80 +
  180 +
  200 +
  PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH +
  PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_COLUMN_WIDTH +
  96 +
  PARTICIPATING_INSTITUTIONS_CLASS_COUNT_COLUMN_WIDTH +
  100 +
  120 +
  PARTICIPATING_INSTITUTIONS_ASSIGNED_INSTRUCTOR_COLUMN_WIDTH
