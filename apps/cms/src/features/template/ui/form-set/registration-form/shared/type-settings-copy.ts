/** 프로그램 유형 설정 — 「일정 별 상이」 안내 */

export const TYPE_SETTINGS_PER_SCHEDULE_HINT = {
  bySession: '교육 진행 단락에서 일정 별로 입력해 주세요', // 복수회차
  byRound: '교육 진행 항목에서 회차 별로 입력해 주세요', // 단일회차
} as const

export function typeSettingsPerScheduleHint(educationStructure: 'curriculum' | 'schedule'): string {
  return educationStructure === 'schedule'
    ? TYPE_SETTINGS_PER_SCHEDULE_HINT.bySession
    : TYPE_SETTINGS_PER_SCHEDULE_HINT.byRound
}
