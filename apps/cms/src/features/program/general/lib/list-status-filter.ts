/** 일반 프로그램 목록 — 4카드 위젯 status 쿼리 */
export type GeneralProgramOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export const GENERAL_PROGRAM_OVERVIEW_STATUS_VALUES = [
  'scheduled',
  'in_progress',
  'completed',
] as const satisfies readonly GeneralProgramOverviewStatusFilter[]
