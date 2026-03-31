/**
 * 대량이체 양식 — Fortune Sheet 초기 데이터 및 동일 규칙의 표 행 생성
 * API 연동 시 세전/세액은 서버 필드로 대체하고, splitAmountForVat는 제거할 수 있습니다.
 */

import type { Cell, CellWithRowAndCol, Sheet } from '@fortune-sheet/core'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'

export const BULK_TRANSFER_HEADER_LABELS = [
  '입금은행',
  '입금계좌번호',
  '입금액',
  '예상예금주',
  '입금통장표시',
  '출금통장표시',
  '메모',
  'CMS코드',
  '받는분 휴대폰 번호',
] as const

const COL_COUNT = BULK_TRANSFER_HEADER_LABELS.length
const MINT_BG = '#01A1AF'
const HEADER_FG = '#FFFFFF'
const DEPOSIT_LABEL = 'JA코리아'
const DASH = '-'

const MOCK_BANKS = ['하나은행', '국민은행', '기업은행', '우리은행', '농협은행'] as const

export type BulkTransferSheetRow = {
  depositBank: string
  depositAccount: string
  depositAmount: number
  expectedDepositor: string
  depositStatement: string
  withdrawalStatement: string
  memo: string
  cmsCode: string
  mobile: string
}

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** 총액(부가세 포함)을 부가세 10% 가정으로 세전 공급가·부가세로 분해 */
export function splitAmountForVat(totalWithVat: number): { feeExclTax: number; taxAmount: number } {
  const feeExclTax = Math.round(totalWithVat / 1.1)
  const taxAmount = totalWithVat - feeExclTax
  return { feeExclTax, taxAmount }
}

function mockPayoutMeta(instructorName: string, rowId: string) {
  const h = simpleHash(instructorName)
  const h2 = simpleHash(`${instructorName}|${rowId}`)
  const bank = MOCK_BANKS[h % MOCK_BANKS.length]
  const acctNum = String(1_000_000_000_000 + (h2 % 899_999_999_999)).slice(0, 12)
  const mobile = `010${String(10_000_000 + (simpleHash(rowId) % 89_999_999)).padStart(8, '0').slice(0, 8)}`
  return { bank, acctNum, mobile }
}

function compareItems(a: AccountPaymentRow, b: AccountPaymentRow): number {
  const p = a.programName.localeCompare(b.programName, 'ko')
  if (p !== 0) return p
  const s = a.sessionLabel.localeCompare(b.sessionLabel, 'ko')
  if (s !== 0) return s
  return a.id.localeCompare(b.id, 'ko')
}

/** 계좌 지급 완료만, 강사명 → 강사 내 항목 순으로 정렬 */
export function getCompletedRowsOrderedForBulkTransfer(rows: AccountPaymentRow[]): AccountPaymentRow[] {
  const completed = rows.filter(r => r.accountPaymentStatus === 'completed')
  const byInstructor = new Map<string, AccountPaymentRow[]>()
  for (const row of completed) {
    const list = byInstructor.get(row.instructorName) ?? []
    list.push(row)
    byInstructor.set(row.instructorName, list)
  }
  const names = [...byInstructor.keys()].sort((a, b) => a.localeCompare(b, 'ko'))
  const out: AccountPaymentRow[] = []
  for (const name of names) {
    const list = byInstructor.get(name) ?? []
    list.sort(compareItems)
    out.push(...list)
  }
  return out
}

function headerCell(text: string): Cell {
  return {
    v: text,
    m: text,
    bg: MINT_BG,
    fc: HEADER_FG,
    ht: 1,
    vt: 1,
  }
}

function dataCell(text: string | number): Cell {
  const m = typeof text === 'number' ? text.toLocaleString('ko-KR') : text
  return { v: m, m }
}

/** 미리보기·엑셀 공통: 각 목록 행당 세전 1행 + 세액 1행 */
export function buildBulkTransferSheetRows(rows: AccountPaymentRow[]): BulkTransferSheetRow[] {
  const ordered = getCompletedRowsOrderedForBulkTransfer(rows)
  const lines: BulkTransferSheetRow[] = []
  for (const row of ordered) {
    const { feeExclTax, taxAmount } = splitAmountForVat(row.amount)
    const { bank, acctNum, mobile } = mockPayoutMeta(row.instructorName, row.id)
    const base = {
      depositBank: bank,
      depositAccount: acctNum,
      expectedDepositor: row.instructorName,
      depositStatement: DEPOSIT_LABEL,
      withdrawalStatement: DASH,
      memo: DASH,
      cmsCode: DASH,
      mobile,
    }
    lines.push({ ...base, depositAmount: feeExclTax })
    lines.push({ ...base, depositAmount: taxAmount })
  }
  return lines
}

function lineToCells(line: BulkTransferSheetRow): Cell[] {
  return [
    dataCell(line.depositBank),
    dataCell(line.depositAccount),
    dataCell(line.depositAmount),
    dataCell(line.expectedDepositor),
    dataCell(line.depositStatement),
    dataCell(line.withdrawalStatement),
    dataCell(line.memo),
    dataCell(line.cmsCode),
    dataCell(line.mobile),
  ]
}

/** Fortune `Workbook`용 시트 1개 (celldata + 열 너비 + 첫 행 고정) */
export function buildBulkTransferFortuneSheet(rows: AccountPaymentRow[]): Sheet {
  const lines = buildBulkTransferSheetRows(rows)
  const dataRowCount = lines.length
  const totalRows = Math.max(36, 1 + dataRowCount + 8)

  const celldata: CellWithRowAndCol[] = []
  for (let c = 0; c < COL_COUNT; c += 1) {
    celldata.push({
      r: 0,
      c,
      v: headerCell(BULK_TRANSFER_HEADER_LABELS[c] as string),
    })
  }
  let r = 1
  for (const line of lines) {
    const cells = lineToCells(line)
    for (let c = 0; c < COL_COUNT; c += 1) {
      celldata.push({ r, c, v: cells[c]! })
    }
    r += 1
  }

  /** 9열 합 ≈ 1290px — 1400 모달(좌우 패딩·행머리 제외)에 맞춤 */
  const columnlen: Record<string, number> = {
    '0': 155,
    '1': 195,
    '2': 130,
    '3': 135,
    '4': 160,
    '5': 160,
    '6': 100,
    '7': 115,
    '8': 140,
  }

  return {
    name: 'Sheet1',
    status: 1,
    order: 0,
    row: totalRows,
    column: COL_COUNT,
    defaultRowHeight: 22,
    defaultColWidth: 88,
    celldata,
    config: {
      columnlen,
      authority: {},
    },
    frozen: {
      type: 'rangeRow',
      range: { row_focus: 0, column_focus: 0 },
    },
    showGridLines: 1,
  }
}
