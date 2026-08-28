/** 프로그램 유형 설정 — 「일정 별 상이」 안내 (일반 프로그램) */

export const TYPE_SETTINGS_PER_SCHEDULE_HINT = {
  schedule: {
    multi: '교육 진행 단락에서 일정 별로 입력해 주세요',
    single: '교육 진행 항목에서 회차 별로 입력해 주세요',
  },
  curriculum: {
    multi: '교육 진행 단락에서 일정 별로 입력해 주세요',
    single: '교육 진행 단락에서 일정 별로 입력해 주세요',
  },
  /** 교육받은 교사 */
  byRound: '교육 진행 항목에서 회차 별로 입력해 주세요',
} as const

export function typeSettingsPerScheduleHint(input: {
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
}): string {
  return TYPE_SETTINGS_PER_SCHEDULE_HINT[input.educationStructure][input.sessionRound]
}
