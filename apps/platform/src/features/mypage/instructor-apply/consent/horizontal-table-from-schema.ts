import { fieldCellValueToPlainText, type HorizontalTableParagraph } from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'

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

  let rows: string[][] = []
  if (paragraph.tableFlavor === 'field') {
    const fieldRows = paragraph.fieldDataRows ?? []
    rows =
      fieldRows.length > 0
        ? fieldRows.map(row => {
            const cells = row.slice(0, colCount)
            while (cells.length < colCount) {
              cells.push({ kind: 'text', value: '' })
            }
            return cells.map(cell => fieldCellValueToPlainText(cell))
          })
        : [Array.from({ length: colCount }, () => '')]
  } else {
    rows = paragraph.dataRows.map(row => {
      const cells = [...row]
      while (cells.length < colCount) cells.push('')
      return cells.slice(0, colCount)
    })
    if (rows.length === 0) {
      rows = [Array.from({ length: colCount }, () => '')]
    }
  }

  const emphasizedColumns = Array.from({ length: colCount }, (_, index) =>
    isHorizontalTableEmphasizedBodyCell(paragraph.id, index) ? index : -1
  ).filter(index => index >= 0)

  return { headers, rows, emphasizedColumns }
}

/** CMS·runtime과 동일 — Platform `ConsentInfoTable` 강조 열 */
function isHorizontalTableEmphasizedBodyCell(paragraphId: string, colIndex: number): boolean {
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection) {
    return colIndex === 2
  }
  if (paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection) {
    return colIndex === 0 || colIndex === 2
  }
  if (
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty ||
    paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty
  ) {
    return colIndex !== 1
  }
  return false
}
