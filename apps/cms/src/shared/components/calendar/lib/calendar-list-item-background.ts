/**
 * CMS 캘린더 공통 규칙 — 우측 일정 목록 행 배경은 공통 컬러셋(`SCHEDULE_COLORS[*].bg`) 색을 opacity 0.6으로 쓴다.
 * 배경에만 적용(텍스트·태그·테두리는 불투명 유지). hover/selected의 흰 배경은 `calendar-sub-right.css` 그대로.
 */
export const CALENDAR_LIST_ITEM_BG_OPACITY_PERCENT = 60

export function calendarListItemBackground(bg: string): string {
  return `color-mix(in srgb, ${bg} ${CALENDAR_LIST_ITEM_BG_OPACITY_PERCENT}%, transparent)`
}
