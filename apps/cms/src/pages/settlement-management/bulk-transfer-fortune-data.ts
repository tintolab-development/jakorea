/**
 * 대량이체 양식 — Fortune Sheet 초기 데이터 및 동일 규칙의 표 행 생성
 * 목록 1건당 이체 1행(정산 금액 전액).
 *
 * SSOT: 시안 「대량이체 양식 미리보기」(입금은행~휴대폰 9열).
 * Notion 5번 「강사비+세액 행 교대」문구는 세금신고 양식과 혼동으로 보이며 채택하지 않음.
 */

import type { Cell, CellWithRowAndCol, Sheet } from '@fortune-sheet/core'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { MASKING_POLICY } from '@/shared/constants/download-policy'

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
/** Workbook `column`·시트 `column`과 동기화 — 미지정 시 라이브러리 기본(큰 값)으로 열 J 이후가 보일 수 있음 */
export const BULK_TRANSFER_SHEET_COLUMN_COUNT = COL_COUNT
const MINT_BG = '#01A1AF'
const HEADER_FG = '#FFFFFF'
const DEPOSIT_LABEL = 'JA코리아'
const DASH = '-'

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

function payoutMetaFromRow(
  row: AccountPaymentRow,
  mode: 'preview' | 'download'
) {
  if (mode === 'preview') {
    return {
      bank: row.bankName ?? '',
      acctNum: MASKING_POLICY.accountNumber(row.maskedAccountNo ?? ''),
      holder: MASKING_POLICY.accountHolderName(row.accountHolder ?? ''),
      mobile: MASKING_POLICY.phone(row.recipientMobile ?? ''),
    }
  }
  return {
    bank: row.bankName ?? '',
    acctNum: row.depositAccountNumber ?? '',
    holder: row.accountHolder ?? row.instructorName,
    mobile: row.recipientMobile ?? '',
  }
}

function compareItems(a: AccountPaymentRow, b: AccountPaymentRow): number {
  const p = a.programName.localeCompare(b.programName, 'ko')
  if (p !== 0) return p
  const s = a.sessionLabel.localeCompare(b.sessionLabel, 'ko')
  if (s !== 0) return s
  return a.id.localeCompare(b.id, 'ko')
}

/** 세금신고용 계좌 지급 완료만, 강사명 → 강사 내 항목 순으로 정렬 */
export function getCompletedRowsOrderedForBulkTransfer(rows: AccountPaymentRow[]): AccountPaymentRow[] {
  const completed = rows.filter(r => r.accountPaymentStatus === 'account_paid')
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

/** 대량이체 export는 CONFIRMED + WAITING_PAYMENT만 대상으로 한다. */
export function getWaitingPaymentRowsOrderedForBulkTransfer(
  rows: AccountPaymentRow[]
): AccountPaymentRow[] {
  const waiting = rows.filter(r => r.accountPaymentStatus === 'awaiting_confirmation')
  const byInstructor = new Map<string, AccountPaymentRow[]>()
  for (const row of waiting) {
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
    /** Fortune Sheet: ht 0=가운데, 1=왼쪽, 2=오른쪽 / vt 0=가운데, 1=위, 2=아래 */
    ht: 0,
    vt: 0,
  }
}

function dataCell(text: string | number): Cell {
  const m = typeof text === 'number' ? text.toLocaleString('ko-KR') : text
  return { v: m, m, ht: 0, vt: 0 }
}

function buildBulkTransferSheetRowsByMode(
  rows: AccountPaymentRow[],
  mode: 'preview' | 'download'
): BulkTransferSheetRow[] {
  const ordered = getWaitingPaymentRowsOrderedForBulkTransfer(rows)
  const lines: BulkTransferSheetRow[] = []
  for (const row of ordered) {
    const { bank, acctNum, holder, mobile } = payoutMetaFromRow(row, mode)
    lines.push({
      depositBank: bank,
      depositAccount: acctNum,
      depositAmount: row.amount,
      expectedDepositor: holder,
      depositStatement: DEPOSIT_LABEL,
      withdrawalStatement: DASH,
      memo: DASH,
      cmsCode: DASH,
      mobile,
    })
  }
  return lines
}

/** 미리보기: 목록 서버 마스킹 값만 표시. 원문 필드를 쓰지 않는다. */
export function buildBulkTransferPreviewSheetRows(rows: AccountPaymentRow[]): BulkTransferSheetRow[] {
  return buildBulkTransferSheetRowsByMode(rows, 'preview')
}

/** 클라이언트 엑셀 fallback. 서버 SERVER_FILE 원문 다운로드가 우선이다. */
export function buildBulkTransferSheetRows(rows: AccountPaymentRow[]): BulkTransferSheetRow[] {
  return buildBulkTransferSheetRowsByMode(rows, 'download')
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
  const lines = buildBulkTransferPreviewSheetRows(rows)
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

  /**
   * 열 너비 합은 모달 본문 가용 폭에 맞춤 (그리드가 컨테이너보다 좁으면 오른쪽에 흰 여백만 커짐).
   * Fortune Sheet `calcRowColSize`: 각 열 (너비+1)px 누적 후 끝에 고정 120px 추가.
   * 대략 usable ≈ 내부폭 - 행머리(~45) - 9 - 120 → 열 합 ~1200–1260px면 1400 모달에서 여백·스크롤 균형.
   * 아래는 기존 비율 유지 채로 합계 1240px.
   */
  const columnlen: Record<string, number> = {
    '0': 150,
    '1': 187,
    '2': 125,
    '3': 130,
    '4': 153,
    '5': 153,
    '6': 96,
    '7': 111,
    '8': 135,
  }

  return {
    name: 'Sheet1',
    status: 1,
    order: 0,
    row: totalRows,
    column: BULK_TRANSFER_SHEET_COLUMN_COUNT,
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
