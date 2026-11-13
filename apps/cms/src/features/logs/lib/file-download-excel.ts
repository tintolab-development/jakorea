import dayjs, { type Dayjs } from 'dayjs'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'

/** 파일명: `[JA Korea] CMS 어드민_파일 다운로드 이력_YYMMDD` (목록 제목 기준 — 기존 클라이언트 생성 이름과 동일) */
export const FILE_DOWNLOAD_HISTORY_EXCEL_PREFIX = '[JA Korea] CMS 어드민_파일 다운로드 이력'

export function buildFileDownloadHistoryExcelFilename(now: Dayjs | Date = dayjs()): string {
  return `${FILE_DOWNLOAD_HISTORY_EXCEL_PREFIX}_${formatAsiaSeoulYymmdd(dayjs(now).toDate())}`
}
