export const TAX_REPORT_PREVIEW_WORKBOOK_TYPE = 'TAX_REPORT_FORTUNE_V1' as const

export const TAX_REPORT_PREVIEW_COLUMNS = [
  '소득구분',
  '지급일',
  '지급액',
  '소득세',
  '주민세',
  '공제후지급',
  '이름',
  '주민등록번호',
  '프로젝트',
] as const

export const TAX_REPORT_PREVIEW_COLUMN_WIDTHS = [36, 22, 14, 12, 12, 14, 14, 18, 26] as const
export const TAX_REPORT_PREVIEW_MERGES = [
  'A2:A7',
  'A9:A14',
  'A16:A19',
  'A21:A23',
  'A25:B25',
] as const
export const TAX_REPORT_PREVIEW_ROW_COUNT = 24
export const TAX_REPORT_PREVIEW_AUTO_FILTER = 'A1:I25' as const

export type TaxReportPreviewColumn = (typeof TAX_REPORT_PREVIEW_COLUMNS)[number]
export type TaxReportPreviewCell = string | number | null
export type TaxReportPreviewRow = Record<TaxReportPreviewColumn, TaxReportPreviewCell>

export interface TaxReportPreviewWarning {
  code: string
  missingCount?: number
  paymentIds?: number[]
}
export interface TaxReportPreviewWorkbook {
  workbookType: typeof TAX_REPORT_PREVIEW_WORKBOOK_TYPE
  sheetName: 'Sheet1'
  defaultRowHeight: 30
  freezeRows: 1
  autoFilter: typeof TAX_REPORT_PREVIEW_AUTO_FILTER
  columnWidths: readonly number[]
  merges: readonly string[]
  columns: readonly TaxReportPreviewColumn[]
  rows: readonly TaxReportPreviewRow[]
  warnings?: readonly TaxReportPreviewWarning[]
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function isCell(value: unknown): value is TaxReportPreviewCell {
  return value == null || typeof value === 'string' || typeof value === 'number'
}

function isRawResidentRegistrationNumber(value: TaxReportPreviewCell): boolean {
  return typeof value === 'string' && /^\d{6}-?\d{7}$/.test(value.trim())
}

function isExpectedStringArray<T extends string>(
  value: unknown,
  expected: readonly T[]
): value is readonly T[] {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every((item, index) => item === expected[index])
  )
}

function invalidPreviewPayload(reason: string): Error {
  return new Error(`세금신고 미리보기 응답 형식이 올바르지 않습니다. (${reason})`)
}

/**
 * 서버 canonical workbook payload를 검증한다. 검증에 실패하면 일부 행만 렌더링하지 않고
 * 즉시 중단해 미리보기와 최종 SERVER_FILE이 달라지는 상태를 막는다.
 */
export function parseTaxReportPreviewWorkbook(value: unknown): TaxReportPreviewWorkbook {
  if (!isRecord(value)) throw invalidPreviewPayload('workbook')
  if (value.workbookType !== TAX_REPORT_PREVIEW_WORKBOOK_TYPE) {
    throw invalidPreviewPayload('workbookType')
  }
  if (value.sheetName !== 'Sheet1') throw invalidPreviewPayload('sheetName')
  if (value.defaultRowHeight !== 30) throw invalidPreviewPayload('defaultRowHeight')
  if (value.freezeRows !== 1) throw invalidPreviewPayload('freezeRows')
  if (value.autoFilter !== TAX_REPORT_PREVIEW_AUTO_FILTER) throw invalidPreviewPayload('autoFilter')
  if (!isExpectedStringArray(value.columns, TAX_REPORT_PREVIEW_COLUMNS)) {
    throw invalidPreviewPayload('columns')
  }
  if (!isExpectedStringArray(value.merges, TAX_REPORT_PREVIEW_MERGES)) {
    throw invalidPreviewPayload('merges')
  }
  if (
    !Array.isArray(value.columnWidths) ||
    value.columnWidths.length !== TAX_REPORT_PREVIEW_COLUMN_WIDTHS.length ||
    value.columnWidths.some((width, index) => width !== TAX_REPORT_PREVIEW_COLUMN_WIDTHS[index])
  ) {
    throw invalidPreviewPayload('columnWidths')
  }
  if (!Array.isArray(value.rows) || value.rows.length !== TAX_REPORT_PREVIEW_ROW_COUNT) {
    throw invalidPreviewPayload('rows')
  }

  const rows = value.rows.map((row, rowIndex) => {
    if (!isRecord(row)) throw invalidPreviewPayload(`rows[${rowIndex}]`)
    const normalized = {} as TaxReportPreviewRow
    for (const column of TAX_REPORT_PREVIEW_COLUMNS) {
      const cell = row[column]
      if (!isCell(cell)) throw invalidPreviewPayload(`rows[${rowIndex}].${column}`)
      if (column === '주민등록번호' && isRawResidentRegistrationNumber(cell)) {
        throw invalidPreviewPayload(`rows[${rowIndex}].주민등록번호(raw)`)
      }
      normalized[column] = cell
    }
    return normalized
  })

  return {
    workbookType: TAX_REPORT_PREVIEW_WORKBOOK_TYPE,
    sheetName: 'Sheet1',
    defaultRowHeight: 30,
    freezeRows: 1,
    autoFilter: TAX_REPORT_PREVIEW_AUTO_FILTER,
    columnWidths: [...TAX_REPORT_PREVIEW_COLUMN_WIDTHS],
    merges: [...TAX_REPORT_PREVIEW_MERGES],
    columns: [...TAX_REPORT_PREVIEW_COLUMNS],
    rows,
    warnings: Array.isArray(value.warnings)
      ? value.warnings.filter(isRecord).map(warning => ({
          code: typeof warning.code === 'string' ? warning.code : 'UNKNOWN',
          ...(typeof warning.missingCount === 'number'
            ? { missingCount: warning.missingCount }
            : {}),
          ...(Array.isArray(warning.paymentIds)
            ? { paymentIds: warning.paymentIds.filter(id => typeof id === 'number') }
            : {}),
        }))
      : undefined,
  }
}
