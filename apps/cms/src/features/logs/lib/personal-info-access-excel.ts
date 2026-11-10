import dayjs, { type Dayjs } from 'dayjs'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'

/** 기획 파일명: `[JA Korea] CMS 어드민_개인정보 조회 이력_YYMMDD` */
export const PERSONAL_INFO_ACCESS_HISTORY_EXCEL_PREFIX =
  '[JA Korea] CMS 어드민_개인정보 조회 이력'

export function buildPersonalInfoAccessHistoryExcelFilename(
  now: Dayjs | Date = dayjs()
): string {
  return `${PERSONAL_INFO_ACCESS_HISTORY_EXCEL_PREFIX}_${formatAsiaSeoulYymmdd(dayjs(now).toDate())}`
}
