/** 계좌 지급 미리보기 엑셀 다운로드 — reason·저장 파일명 SSOT */

export type SettlementFormExportKind = 'bulk-transfer' | 'tax-report'

/** 민감파일 다운로드 body reason. 공백·조사 변경 금지. 개인정보 조회 이력 accessPurpose와 동일. */
export const SETTLEMENT_FORM_DOWNLOAD_REASON = {
  'bulk-transfer': '대량이체 양식 발급',
  'tax-report': '세금신고 양식 발급',
} as const satisfies Record<SettlementFormExportKind, string>

const FILENAME_LABEL: Record<SettlementFormExportKind, string> = {
  'bulk-transfer': '대량이체 양식',
  'tax-report': '세금신고 양식',
}

/** Asia/Seoul 달력일 YYMMDD. Date#toISOString().slice(0,10) 금지. */
export function formatAsiaSeoulYymmdd(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const year = values.year?.slice(-2) ?? ''
  const month = values.month ?? ''
  const day = values.day ?? ''
  return `${year}${month}${day}`
}

/** `[JA Korea] CMS 어드민_{대량이체|세금신고} 양식_YYMMDD.xlsx` */
export function buildSettlementFormExcelFilename(
  kind: SettlementFormExportKind,
  now: Date = new Date()
): string {
  return `[JA Korea] CMS 어드민_${FILENAME_LABEL[kind]}_${formatAsiaSeoulYymmdd(now)}.xlsx`
}
