import dayjs, { type Dayjs } from 'dayjs'

/** 기획 파일명: `[JA Korea] CMS 어드민_버그,이슈 이력_YYMMDD` (빗금은 파일명 불가 → 쉼표) */
export const BUG_ISSUE_HISTORY_EXCEL_PREFIX = '[JA Korea] CMS 어드민_버그,이슈 이력'

export function buildBugIssueHistoryExcelFilename(now: Dayjs | Date = dayjs()): string {
  return `${BUG_ISSUE_HISTORY_EXCEL_PREFIX}_${dayjs(now).format('YYMMDD')}`
}
