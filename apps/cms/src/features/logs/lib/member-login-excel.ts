import dayjs, { type Dayjs } from 'dayjs'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'

/** 기획 파일명: `[JA Korea] CMS 어드민_관리자 로그인 이력_YYMMDD` */
export const MEMBER_LOGIN_HISTORY_EXCEL_PREFIX = '[JA Korea] CMS 어드민_관리자 로그인 이력'

export function buildMemberLoginHistoryExcelFilename(now: Dayjs | Date = dayjs()): string {
  return `${MEMBER_LOGIN_HISTORY_EXCEL_PREFIX}_${formatAsiaSeoulYymmdd(dayjs(now).toDate())}`
}
