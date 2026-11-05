import {
  resolveHorizontalTableCellPlainText,
  type HorizontalTableParagraph,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { RECEIPT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/receipt-pre-consent-draft'

export type HorizontalTablePlatformView = {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  emphasizedColumns: readonly number[]
}

export function resolveHorizontalTablePlatformView(
  paragraph: HorizontalTableParagraph
): HorizontalTablePlatformView {
  const colCount = Math.max(1, paragraph.columnHeaders.length)
  const headers = paragraph.columnHeaders.slice(0, colCount)
  while (headers.length < colCount) headers.push('')

  const rowCount = Math.max(1, paragraph.dataRows.length, paragraph.fieldDataRows?.length ?? 0)
  const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) =>
      resolveHorizontalTableCellPlainText(paragraph, rowIndex, colIndex)
    )
  )

  const emphasizedColumns = Array.from({ length: colCount }, (_, index) =>
    isHorizontalTableEmphasizedBodyCell(paragraph.id, index) ? index : -1
  ).filter(index => index >= 0)

  return { headers, rows, emphasizedColumns }
}

/** CMS·runtime과 동일 — Platform `ConsentInfoTable` 강조 열 */
function isHorizontalTableEmphasizedBodyCell(paragraphId: string, colIndex: number): boolean {
  if (
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection ||
    paragraphId === RECEIPT_PRE_CONSENT_IDS.p1Collection
  ) {
    return colIndex === 2
  }
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection) {
    return colIndex === 0 || colIndex === 2
  }
  if (
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty ||
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty ||
    paragraphId === RECEIPT_PRE_CONSENT_IDS.p2ThirdParty
  ) {
    return colIndex !== 1
  }
  return false
}

/**
 * 지급조서 사전 동의서 작성 화면 — Figma(11240:61561) 굵게 강조 열.
 * A4 미리보기·CMS는 `isHorizontalTableEmphasizedBodyCell` 유지.
 */
export function resolvePaymentStatementWriteEmphasizedColumns(
  paragraphId: string
): readonly number[] | undefined {
  if (
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection ||
    paragraphId === RECEIPT_PRE_CONSENT_IDS.p1Collection
  ) {
    return [1, 2]
  }
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection) return [0, 2]
  if (
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty ||
    paragraphId === RECEIPT_PRE_CONSENT_IDS.p2ThirdParty
  ) {
    return [0, 2, 3]
  }
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty) return [0, 1, 2, 3]
  return undefined
}
