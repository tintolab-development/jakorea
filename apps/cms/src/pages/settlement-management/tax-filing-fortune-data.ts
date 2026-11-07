/**
 * 정산 관리 > 세금신고 양식 미리보기
 *
 * 행·금액·그룹 순서의 원본은 서버 TAX_REPORT_FORTUNE_V1 payload다.
 * 이 모듈은 서버 행을 Fortune Sheet 셀로 변환할 뿐, 세금이나 합계를 계산하지 않는다.
 */

import type { Cell, CellWithRowAndCol, Sheet } from '@fortune-sheet/core'
import {
  TAX_REPORT_PREVIEW_COLUMNS,
  type TaxReportPreviewCell,
  type TaxReportPreviewColumn,
  type TaxReportPreviewRow,
  type TaxReportPreviewWorkbook,
} from '@/features/settlement-management/api/account-payments/tax-report-preview'

export const TAX_FILING_HEADER_LABELS = [...TAX_REPORT_PREVIEW_COLUMNS] as const
export const TAX_FILING_SHEET_COLUMN_COUNT = TAX_FILING_HEADER_LABELS.length

const MINT_BG = '#01A1AF'
const HEADER_FG = '#FFFFFF'
const INCOME_COL_FG = '#3D3D3D'
const SUBTOTAL_BG = '#E8F5F6'
const PREVIEW_UNIFIED_FS = 11
const DASH = '-'

export const TAX_FILING_MAX_DETAIL_ROWS = 19
export const TAX_FILING_MAX_DETAIL_ROWS_ERROR_MESSAGE =
  '세금신고 양식은 최대 19건까지 발급할 수 있습니다.'
export const TAX_FILING_PREVIEW_DATA_DEPENDENCY_MESSAGE =
  '현재 미리보기 API에 공식 세금 표시 필드가 없어 숫자값 완전 일치를 구현할 수 없습니다. 백엔드가 공식 표시용 세금 필드를 내려준 뒤 프론트 매핑을 추가해야 합니다.'

export type TaxFilingPreviewValidationError = {
  code: 'VALIDATION_ERROR' | 'BACKEND_DEPENDENCY'
  field: 'settlementIds' | 'taxReportFields'
  message: string
}
export class TaxFilingPreviewValidationException extends Error {
  readonly code: TaxFilingPreviewValidationError['code']
  readonly field: TaxFilingPreviewValidationError['field']

  constructor(error: TaxFilingPreviewValidationError) {
    super(error.message)
    this.name = 'TaxFilingPreviewValidationException'
    this.code = error.code
    this.field = error.field
  }
}
/** 공식 tax_income_type_snapshot 분류표. 실제 preview 행 순서는 서버가 결정한다. */
const TAX_FILING_INCOME_TYPE_GROUPS: Record<string, 1 | 2 | 3 | 4> = {
  OTHER_INCOME: 1,
  OTHER: 1,
  ETC_INCOME: 1,
  AWARD: 2,
  INTERVIEW_FEE: 3,
  SUPPORT_GRANT: 3,
  PRIZE: 3,
  EVENT_PRIZE: 3,
  EVENT: 3,
  EVENT_PRIZE_INCOME: 3,
  INTERVIEW_SUPPORT_REWARD: 3,
  BUSINESS_INCOME: 4,
  BUSINESS: 4,
  BUSINESS_INCOME_TAX: 4,
}
export function resolveTaxFilingIncomeGroup(
  incomeType: string | null | undefined
): 1 | 2 | 3 | 4 | undefined {
  const normalized = incomeType?.trim().toUpperCase()
  if (!normalized) return undefined
  return TAX_FILING_INCOME_TYPE_GROUPS[normalized]
}

export function getTaxFilingPreviewValidationError(
  workbook: TaxReportPreviewWorkbook | null | undefined
): TaxFilingPreviewValidationError | null {
  if (workbook == null) {
    return {
      code: 'BACKEND_DEPENDENCY',
      field: 'taxReportFields',
      message: TAX_FILING_PREVIEW_DATA_DEPENDENCY_MESSAGE,
    }
  }
  return null
}

export function getTaxFilingSelectionValidationError(
  selectedCount: number
): TaxFilingPreviewValidationError | null {
  if (selectedCount <= TAX_FILING_MAX_DETAIL_ROWS) return null
  return {
    code: 'VALIDATION_ERROR',
    field: 'settlementIds',
    message: TAX_FILING_MAX_DETAIL_ROWS_ERROR_MESSAGE,
  }
}

export function assertTaxFilingPreviewDataAvailable(
  workbook: TaxReportPreviewWorkbook | null | undefined
): asserts workbook is TaxReportPreviewWorkbook {
  const error = getTaxFilingPreviewValidationError(workbook)
  if (error) throw new TaxFilingPreviewValidationException(error)
}

function headerCell(text: string): Cell {
  return {
    v: text,
    m: text,
    bg: MINT_BG,
    fc: HEADER_FG,
    ht: 0,
    vt: 0,
    fs: PREVIEW_UNIFIED_FS,
    bl: 1,
    tb: '2',
  }
}

function displayValue(value: TaxReportPreviewCell): string | number {
  return value == null || value === '' ? DASH : value
}

function dataCell(value: TaxReportPreviewCell): Cell {
  const displayed = displayValue(value)
  const m = typeof displayed === 'number' ? displayed.toLocaleString('ko-KR') : displayed
  return { v: displayed, m, ht: 0, vt: 0, fs: PREVIEW_UNIFIED_FS, tb: '2' }
}

function subtotalCell(value: TaxReportPreviewCell, leftAlign: boolean): Cell {
  const displayed = displayValue(value)
  const m = typeof displayed === 'number' ? displayed.toLocaleString('ko-KR') : displayed
  return {
    v: displayed,
    m,
    ht: leftAlign ? 1 : 0,
    vt: 0,
    bg: SUBTOTAL_BG,
    fs: PREVIEW_UNIFIED_FS,
    ...(leftAlign ? { fc: INCOME_COL_FG, bl: 1, tb: '2' } : {}),
  }
}

function mergedLabelCell(text: string, useInlineNewlines = false): Cell {
  const base: Cell = {
    v: text,
    m: text,
    fc: INCOME_COL_FG,
    ht: 0,
    vt: 0,
    tb: '2',
    fs: PREVIEW_UNIFIED_FS,
    bl: 1,
  }
  if (!useInlineNewlines) return base
  return {
    ...base,
    ct: {
      fa: 'General',
      t: 'inlineStr',
      s: [{ v: text, fc: INCOME_COL_FG, fs: PREVIEW_UNIFIED_FS, bl: 1 }],
    },
  }
}

function parseColumnIndex(column: string): number {
  let result = 0
  for (const char of column) result = result * 26 + char.charCodeAt(0) - 64
  return result - 1
}

type MergeRange = { r: number; c: number; rs: number; cs: number }

function parseMergeRange(range: string): MergeRange {
  const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range)
  if (!match) throw new Error(`tax-filing: unsupported merge range ${range}`)
  const [, startColumn, startRow, endColumn, endRow] = match
  const r = Number(startRow) - 1
  const c = parseColumnIndex(startColumn)
  return {
    r,
    c,
    rs: Number(endRow) - Number(startRow) + 1,
    cs: parseColumnIndex(endColumn) - c + 1,
  }
}

function parseAutoFilterRange(range: string) {
  const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range)
  if (!match) throw new Error(`tax-filing: unsupported autoFilter range ${range}`)
  const [, startColumn, startRow, endColumn, endRow] = match
  return {
    row: [Number(startRow) - 1, Number(endRow) - 1],
    column: [parseColumnIndex(startColumn), parseColumnIndex(endColumn)],
  }
}

function buildMergeMap(workbook: TaxReportPreviewWorkbook) {
  const mergeMap = new Map<string, MergeRange>()
  const config: Record<string, MergeRange> = {}
  for (const range of workbook.merges) {
    const merge = parseMergeRange(range)
    config[`${merge.r}_${merge.c}`] = merge
    for (let row = merge.r; row < merge.r + merge.rs; row += 1) {
      for (let column = merge.c; column < merge.c + merge.cs; column += 1) {
        mergeMap.set(`${row}_${column}`, merge)
      }
    }
  }
  return { mergeMap, config }
}

function isSubtotalRow(row: TaxReportPreviewRow) {
  return row['소득구분'] === '소계'
}

function isGrandTotalRow(row: TaxReportPreviewRow) {
  return row['소득구분'] === '합계'
}

function rowCell(row: TaxReportPreviewRow, columnIndex: number): TaxReportPreviewCell {
  return row[TAX_REPORT_PREVIEW_COLUMNS[columnIndex] as TaxReportPreviewColumn]
}

/** 서버 payload가 제공한 숫자·문자·병합 구조를 Fortune Sheet 셀로 변환한다. */
export function buildTaxFilingFortuneSheet(
  workbook: TaxReportPreviewWorkbook | null | undefined
): Sheet {
  assertTaxFilingPreviewDataAvailable(workbook)
  if (workbook.rows.length !== 24) throw new Error('tax-filing: expected 24 server data rows')

  const celldata: CellWithRowAndCol[] = []
  for (let column = 0; column < TAX_FILING_SHEET_COLUMN_COUNT; column += 1) {
    celldata.push({ r: 0, c: column, v: headerCell(TAX_FILING_HEADER_LABELS[column] as string) })
  }

  const { mergeMap, config: merge } = buildMergeMap(workbook)
  for (let rowIndex = 0; rowIndex < workbook.rows.length; rowIndex += 1) {
    const row = workbook.rows[rowIndex]!
    const fortuneRow = rowIndex + 1
    const subtotal = isSubtotalRow(row)
    const grandTotal = isGrandTotalRow(row)

    for (let column = 0; column < TAX_FILING_SHEET_COLUMN_COUNT; column += 1) {
      const value = rowCell(row, column)
      const mergeRange = mergeMap.get(`${fortuneRow}_${column}`)

      if (mergeRange) {
        const isMergeStart = mergeRange.r === fortuneRow && mergeRange.c === column
        if (!isMergeStart) {
          celldata.push({
            r: fortuneRow,
            c: column,
            v: { mc: { r: mergeRange.r, c: mergeRange.c } },
          })
          continue
        }
        const text = typeof value === 'string' ? value : DASH
        celldata.push({
          r: fortuneRow,
          c: column,
          v: {
            ...mergedLabelCell(text, text.includes('\n')),
            mc: mergeRange,
          },
        })
        continue
      }

      const cell = subtotal || grandTotal
        ? subtotalCell(value, subtotal && column === 0)
        : dataCell(value)
      celldata.push({ r: fortuneRow, c: column, v: cell })
    }
  }

  const rowlen: Record<string, number> = {}
  for (let row = 0; row < 25; row += 1) rowlen[String(row)] = workbook.defaultRowHeight

  return {
    name: workbook.sheetName,
    status: 1,
    order: 0,
    row: 25,
    column: TAX_FILING_SHEET_COLUMN_COUNT,
    defaultRowHeight: workbook.defaultRowHeight,
    defaultColWidth: 88,
    celldata,
    config: {
      merge,
      columnlen: Object.fromEntries(
        workbook.columnWidths.map((width, index) => [String(index), width * 7])
      ),
      rowlen,
      borderInfo: [
        {
          rangeType: 'range',
          borderType: 'border-all',
          style: 1,
          color: '#D0D0D0',
          range: [{ row: [0, 24], column: [0, TAX_FILING_SHEET_COLUMN_COUNT - 1] }],
        },
      ],
      authority: {},
    },
    frozen: {
      type: 'rangeRow',
      range: { row_focus: workbook.freezeRows - 1, column_focus: 0 },
    },
    filter_select: parseAutoFilterRange(workbook.autoFilter),
    showGridLines: 1,
  }
}
