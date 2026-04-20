/**
 * 세금신고 양식 — Fortune Sheet 초기 데이터 및 엑셀과 동일한 표 행 생성
 */

import type { Cell, CellWithRowAndCol, Sheet } from '@fortune-sheet/core'
import dayjs from 'dayjs'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import { getCompletedRowsOrderedForBulkTransfer } from '@/pages/settlement-management/bulk-transfer-fortune-data'

export const TAX_FILING_HEADER_LABELS = [
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

const COL_COUNT = TAX_FILING_HEADER_LABELS.length
export const TAX_FILING_SHEET_COLUMN_COUNT = COL_COUNT

const MINT_BG = '#01A1AF'
const HEADER_FG = '#FFFFFF'
/** 소득구분 열(병합 라벨·소계 A열) — var(--default-BK, #3D3D3D) */
const INCOME_COL_FG = '#3D3D3D'
/** rgba(1,161,175,0.1) on #fff 근사 */
const SUBTOTAL_BG = '#E8F5F6'
/** 미리보기 전 셀 공통 글자 크기(데이터 영역과 동일) — 색·bold는 셀 유형별 유지 */
const PREVIEW_UNIFIED_FS = 11
const DASH = '-'

const KO_WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

const LABEL_GROUP_1 = '기타소득 8.8%'
const LABEL_GROUP_2 = '기타소득(상금) 4.4%'
/** Fortune·엑셀 공통 3줄 라벨 (미리보기는 inlineStr로 \\n 렌더) */
export const TAX_FILING_GROUP_3_LABEL_LINES = [
  '기타소득(면접비)',
  '(지원금) (경품)',
  '22%',
] as const
const LABEL_GROUP_3 = TAX_FILING_GROUP_3_LABEL_LINES.join('\n')
const LABEL_GROUP_4 = '사업소득 3.3%'

/** 각 그룹: 상세 행 수, A열 라벨, 세율 그룹 id (엑셀 병합·시트 생성 공통) */
export const TAX_FILING_INCOME_GROUPS = [
  { detailRows: 6, label: LABEL_GROUP_1, tax: 1 as const },
  { detailRows: 6, label: LABEL_GROUP_2, tax: 2 as const },
  { detailRows: 4, label: LABEL_GROUP_3, tax: 3 as const },
  { detailRows: 3, label: LABEL_GROUP_4, tax: 4 as const },
] as const

const DETAIL_SLOT_COUNT = TAX_FILING_INCOME_GROUPS.reduce((a, g) => a + g.detailRows, 0)

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function formatPaymentDate(iso: string): string {
  const d = dayjs(iso)
  return `${d.format('YYYY.MM.DD')} (${KO_WEEKDAY[d.day()]})`
}

function mockResidentId(seed: string): string {
  const h = simpleHash(seed)
  const p1 = String(100000 + (h % 899999)).padStart(6, '0')
  const p2 = String(1000000 + (h % 8999999)).padStart(7, '0')
  return `${p1}-${p2[0]}******`
}

/** 그룹별 대략 세액 비율 (소득세+주민세 합이 라벨 세율에 근사) */
function mockTaxParts(
  gross: number,
  taxGroup: 1 | 2 | 3 | 4
): { incomeTax: number; residenceTax: number; after: number } {
  let ir: number
  let rr: number
  switch (taxGroup) {
    case 1:
      ir = 0.066
      rr = 0.022
      break
    case 2:
      ir = 0.033
      rr = 0.011
      break
    case 3:
      ir = 0.165
      rr = 0.055
      break
    case 4:
      ir = 0.025
      rr = 0.008
      break
    default:
      ir = 0
      rr = 0
  }
  const incomeTax = Math.round(gross * ir)
  const residenceTax = Math.round(gross * rr)
  const after = gross - incomeTax - residenceTax
  return { incomeTax, residenceTax, after }
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
  }
}

function dataCell(text: string | number): Cell {
  const m = typeof text === 'number' ? text.toLocaleString('ko-KR') : text
  return { v: m, m, ht: 0, vt: 0, fs: PREVIEW_UNIFIED_FS }
}

function subtotalCell(text: string | number, leftAlign: boolean): Cell {
  const m = typeof text === 'number' ? text.toLocaleString('ko-KR') : text
  const isIncomeColLabel = typeof text === 'string' && text === '소계'
  return {
    v: m,
    m,
    ht: leftAlign ? 1 : 0,
    vt: 0,
    bg: SUBTOTAL_BG,
    ...(isIncomeColLabel
      ? {
          fc: INCOME_COL_FG,
          fs: PREVIEW_UNIFIED_FS,
          bl: 1,
          /** 한 줄 초과 시 다음 줄로 줄바꿈 */
          tb: '2',
        }
      : { fs: PREVIEW_UNIFIED_FS }),
  }
}

function mergedLabelCell(text: string): Cell {
  return {
    v: text,
    m: text,
    fc: INCOME_COL_FG,
    ht: 0,
    vt: 0,
    /** 2: 자동 줄바꿈 — 한 줄 넘치면 두 줄 이상 표시 */
    tb: '2',
    fs: PREVIEW_UNIFIED_FS,
    bl: 1,
  }
}

/**
 * 소득구분 병합 라벨. Fortune Sheet는 일반 셀에서 \\n을 실제 줄바꿈으로 그리지 않으므로,
 * 3줄 라벨(tax 그룹 3)만 inlineStr로 넣어 줄바꿈을 반영한다.
 */
function mergedIncomeCategoryLabelCell(text: string, useInlineNewlines: boolean): Cell {
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
      s: [
        {
          v: text,
          fc: INCOME_COL_FG,
          fs: PREVIEW_UNIFIED_FS,
          bl: 1,
        },
      ],
    },
  }
}

export type TaxFilingNumericSlice = {
  paymentAmount: number
  incomeTax: number
  residenceTax: number
  afterDeduction: number
}

export type TaxFilingDetailLine = {
  kind: 'detail'
  /** 1..4 */
  groupId: 1 | 2 | 3 | 4
  paymentDate: string
  paymentAmount: number | null
  incomeTax: number | null
  residenceTax: number | null
  afterDeduction: number | null
  name: string
  residentId: string
  project: string
}

export type TaxFilingSubtotalLine = {
  kind: 'subtotal'
  groupId: 1 | 2 | 3 | 4
  sums: TaxFilingNumericSlice
}

export type TaxFilingSheetLine = TaxFilingDetailLine | TaxFilingSubtotalLine

/**
 * 미리보기·엑셀 공통: 완료 건을 19개 상세 슬롯에 순서대로 배치 후 소계 산출
 */
export function buildTaxFilingSheetLines(rows: AccountPaymentRow[]): TaxFilingSheetLine[] {
  const ordered = getCompletedRowsOrderedForBulkTransfer(rows)
  const slots: (AccountPaymentRow | null)[] = Array.from({ length: DETAIL_SLOT_COUNT }, (_, i) =>
    ordered[i] ?? null
  )

  let slotIdx = 0
  const lines: TaxFilingSheetLine[] = []

  for (const g of TAX_FILING_INCOME_GROUPS) {
    const groupId = g.tax
    const chunk: TaxFilingNumericSlice = {
      paymentAmount: 0,
      incomeTax: 0,
      residenceTax: 0,
      afterDeduction: 0,
    }

    for (let i = 0; i < g.detailRows; i += 1) {
      const src = slots[slotIdx]!
      slotIdx += 1

      if (src == null) {
        lines.push({
          kind: 'detail',
          groupId,
          paymentDate: DASH,
          paymentAmount: null,
          incomeTax: null,
          residenceTax: null,
          afterDeduction: null,
          name: DASH,
          residentId: DASH,
          project: DASH,
        })
        continue
      }

      const gross = src.amount
      const { incomeTax, residenceTax, after } = mockTaxParts(gross, groupId)
      chunk.paymentAmount += gross
      chunk.incomeTax += incomeTax
      chunk.residenceTax += residenceTax
      chunk.afterDeduction += after

      lines.push({
        kind: 'detail',
        groupId,
        paymentDate: formatPaymentDate(src.transferScheduledDate),
        paymentAmount: gross,
        incomeTax,
        residenceTax,
        afterDeduction: after,
        name: src.instructorName,
        residentId: mockResidentId(`${src.instructorName}|${src.id}`),
        project: src.programName,
      })
    }

    lines.push({
      kind: 'subtotal',
      groupId,
      sums: chunk,
    })
  }

  return lines
}

/** 상세 행만 합산(빈 슬롯·대시 행 제외) */
export function computeTaxFilingGrandTotals(lines: TaxFilingSheetLine[]): TaxFilingNumericSlice {
  const z: TaxFilingNumericSlice = {
    paymentAmount: 0,
    incomeTax: 0,
    residenceTax: 0,
    afterDeduction: 0,
  }
  for (const line of lines) {
    if (line.kind !== 'detail') continue
    if (line.paymentAmount == null) continue
    z.paymentAmount += line.paymentAmount
    z.incomeTax += line.incomeTax ?? 0
    z.residenceTax += line.residenceTax ?? 0
    z.afterDeduction += line.afterDeduction ?? 0
  }
  return z
}

function grandTotalMergedLabelCell(text: string): Cell {
  return {
    v: text,
    m: text,
    fc: INCOME_COL_FG,
    bg: SUBTOTAL_BG,
    ht: 0,
    vt: 0,
    tb: '2',
    fs: PREVIEW_UNIFIED_FS,
    bl: 1,
  }
}

function detailToCells(line: TaxFilingDetailLine): Cell[] {
  const amt = line.paymentAmount
  const dashOrNum = (n: number | null) => (n == null ? DASH : n)
  return [
    mergedLabelCell(''),
    dataCell(line.paymentDate),
    dataCell(amt == null ? DASH : amt),
    dataCell(dashOrNum(line.incomeTax)),
    dataCell(dashOrNum(line.residenceTax)),
    dataCell(dashOrNum(line.afterDeduction)),
    dataCell(line.name),
    dataCell(line.residentId),
    dataCell(line.project),
  ]
}

function subtotalToCells(line: TaxFilingSubtotalLine): Cell[] {
  const { sums } = line
  return [
    subtotalCell('소계', true),
    subtotalCell(DASH, false),
    subtotalCell(sums.paymentAmount, false),
    subtotalCell(sums.incomeTax, false),
    subtotalCell(sums.residenceTax, false),
    subtotalCell(sums.afterDeduction, false),
    subtotalCell(DASH, false),
    subtotalCell(DASH, false),
    subtotalCell(DASH, false),
  ]
}

/** Fortune `Workbook`용 시트 1개 */
export function buildTaxFilingFortuneSheet(rows: AccountPaymentRow[]): Sheet {
  const sheetLines = buildTaxFilingSheetLines(rows)
  const totalRows = 1 + sheetLines.length + 1

  const celldata: CellWithRowAndCol[] = []

  for (let c = 0; c < COL_COUNT; c += 1) {
    celldata.push({
      r: 0,
      c,
      v: headerCell(TAX_FILING_HEADER_LABELS[c] as string),
    })
  }

  const merge: Record<string, { r: number; c: number; rs: number; cs: number }> = {}

  let fortuneR = 1
  let lineIdx = 0

  for (const g of TAX_FILING_INCOME_GROUPS) {
    const mergeStartR = fortuneR
    const label = g.label
    const rs = g.detailRows

    for (let i = 0; i < g.detailRows; i += 1) {
      const line = sheetLines[lineIdx]!
      lineIdx += 1
      if (line.kind !== 'detail') throw new Error('tax-filing: expected detail row')

      const cells = detailToCells(line)
      const isFirst = i === 0

      for (let c = 0; c < COL_COUNT; c += 1) {
        if (c === 0) {
          if (isFirst) {
            const primary: Cell = {
              ...mergedIncomeCategoryLabelCell(label, g.tax === 3),
              mc: { r: mergeStartR, c: 0, rs, cs: 1 },
            }
            celldata.push({ r: fortuneR, c: 0, v: primary })
          } else {
            celldata.push({
              r: fortuneR,
              c: 0,
              v: { mc: { r: mergeStartR, c: 0 } },
            })
          }
        } else {
          celldata.push({ r: fortuneR, c, v: cells[c]! })
        }
      }
      fortuneR += 1
    }

    merge[`${mergeStartR}_0`] = { r: mergeStartR, c: 0, rs, cs: 1 }

    const subLine = sheetLines[lineIdx]!
    lineIdx += 1
    if (subLine.kind !== 'subtotal') throw new Error('tax-filing: expected subtotal row')

    const subCells = subtotalToCells(subLine)
    for (let c = 0; c < COL_COUNT; c += 1) {
      celldata.push({ r: fortuneR, c, v: subCells[c]! })
    }
    fortuneR += 1
  }

  if (lineIdx !== sheetLines.length) {
    throw new Error('tax-filing: line index mismatch')
  }

  const grandTotals = computeTaxFilingGrandTotals(sheetLines)
  const grandR = fortuneR
  merge[`${grandR}_0`] = { r: grandR, c: 0, rs: 1, cs: 2 }

  const primaryGrand: Cell = {
    ...grandTotalMergedLabelCell('합계'),
    mc: { r: grandR, c: 0, rs: 1, cs: 2 },
  }
  celldata.push({ r: grandR, c: 0, v: primaryGrand })
  celldata.push({
    r: grandR,
    c: 1,
    v: { mc: { r: grandR, c: 0 } },
  })
  celldata.push({ r: grandR, c: 2, v: subtotalCell(grandTotals.paymentAmount, false) })
  celldata.push({ r: grandR, c: 3, v: subtotalCell(grandTotals.incomeTax, false) })
  celldata.push({ r: grandR, c: 4, v: subtotalCell(grandTotals.residenceTax, false) })
  celldata.push({ r: grandR, c: 5, v: subtotalCell(grandTotals.afterDeduction, false) })
  celldata.push({ r: grandR, c: 6, v: subtotalCell(DASH, false) })
  celldata.push({ r: grandR, c: 7, v: subtotalCell(DASH, false) })
  celldata.push({ r: grandR, c: 8, v: subtotalCell(DASH, false) })

  /** 열 너비 합 ~1240px 유지, A열은 다줄 소득구분 라벨용으로 넓게 */
  const columnlen: Record<string, number> = {
    '0': 252,
    '1': 160,
    '2': 118,
    '3': 98,
    '4': 98,
    '5': 118,
    '6': 108,
    '7': 138,
    '8': 150,
  }

  const rowlen: Record<string, number> = {}
  for (let r = 0; r < totalRows; r += 1) {
    rowlen[String(r)] = 30
  }

  return {
    name: 'Sheet1',
    status: 1,
    order: 0,
    row: totalRows,
    column: TAX_FILING_SHEET_COLUMN_COUNT,
    defaultRowHeight: 30,
    defaultColWidth: 88,
    celldata,
    config: {
      merge,
      columnlen,
      rowlen,
      authority: {},
    },
    frozen: {
      type: 'rangeRow',
      range: { row_focus: 0, column_focus: 0 },
    },
    showGridLines: 1,
  }
}
