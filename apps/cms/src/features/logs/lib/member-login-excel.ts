import dayjs, { type Dayjs } from 'dayjs'

/** 기획 파일명: `[JA Korea] CMS 어드민_회원 로그인 이력_YYMMDD` */
export const MEMBER_LOGIN_HISTORY_EXCEL_PREFIX = '[JA Korea] CMS 어드민_회원 로그인 이력'

export function buildMemberLoginHistoryExcelFilename(now: Dayjs | Date = dayjs()): string {
  return `${MEMBER_LOGIN_HISTORY_EXCEL_PREFIX}_${dayjs(now).format('YYMMDD')}`
}
