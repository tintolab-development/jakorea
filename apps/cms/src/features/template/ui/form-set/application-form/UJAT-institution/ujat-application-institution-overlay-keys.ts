/** UJAT 기관 신청 overlay 키·값 타입(스토어 아님). 스토어는 `ujat-application-institution-overlay-sync`. */
export const UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS = {
  applicationRegion: 'ujatApplication.applicationRegion',
  gradeDetailByBlock: 'ujatApplication.gradeDetailByBlock',
  classTimeCheckedByBlock: 'ujatApplication.classTimeCheckedByBlock',
  classTimePeriodsByBlock: 'ujatApplication.classTimePeriodsByBlock',
  preferredScheduleSelectedIds: 'ujatApplication.preferredScheduleSelectedIds',
} as const

export type UjatApplicationGradeDetail = {
  classCountInput: string
  classNoByIndex: Record<number, string>
  studentCountByIndex: Record<number, string>
}

export type UjatApplicationClassTimePeriods = Record<
  string,
  { start: string | null; end: string | null }
>
