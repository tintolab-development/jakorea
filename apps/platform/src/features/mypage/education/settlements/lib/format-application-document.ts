import type {
  SettlementApplicationDocumentBasicInfo,
  SettlementApplicationDocumentCalcInfo,
  SettlementApplicationDocumentLine,
  SettlementApplicationDocumentResponse,
  SettlementApplicationDocumentTotal,
} from '../api/application-document-types'
import {
  formatRecognizedSessionCountLabel,
  lectureFeeTypeDisplayLabel,
} from './lecture-fee-preview.ts'

export const SETTLEMENT_DOCUMENT_EMPTY = '-'

function displayDocumentLectureFeeType(value: string | null | undefined): string {
  const fromCode = lectureFeeTypeDisplayLabel(value)
  if (fromCode !== SETTLEMENT_DOCUMENT_EMPTY) return fromCode
  return displaySettlementDocumentText(value)
}

export function displaySettlementDocumentText(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : SETTLEMENT_DOCUMENT_EMPTY
}

export function formatSettlementDocumentAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return SETTLEMENT_DOCUMENT_EMPTY
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatSettlementDocumentYesNo(value: boolean | null | undefined): string {
  if (value == null) return SETTLEMENT_DOCUMENT_EMPTY
  return value ? '예' : '아니오'
}

export function formatSettlementDocumentCount(
  value: number | null | undefined,
  suffix = '',
): string {
  if (value == null || !Number.isFinite(value)) return SETTLEMENT_DOCUMENT_EMPTY
  return suffix ? `${value.toLocaleString('ko-KR')}${suffix}` : value.toLocaleString('ko-KR')
}

export function formatSettlementDocumentHomeAddress(
  basic: SettlementApplicationDocumentBasicInfo,
): string {
  const address = basic.homeAddress?.trim() ?? ''
  const detail = basic.homeAddressDetail?.trim() ?? ''
  if (address && detail) return `${address} ${detail}`
  if (address || detail) return address || detail
  return SETTLEMENT_DOCUMENT_EMPTY
}

/** 시안: "농협 01010101-01-000111 | 김제이" — 은행·계좌는 공백, 예금주는 구분선 */
export function formatSettlementDocumentAccountParts(
  basic: SettlementApplicationDocumentBasicInfo,
): string[] {
  const bank = basic.bank?.trim() ?? ''
  const account = basic.accountNumberMasked?.trim() ?? ''
  const holder = basic.accountHolder?.trim() ?? ''
  const bankAccount = [bank, account].filter(Boolean).join(' ')
  const parts = [bankAccount, holder].filter(Boolean)
  return parts.length > 0 ? parts : [SETTLEMENT_DOCUMENT_EMPTY]
}

export function formatSettlementDocumentAccountInfo(
  basic: SettlementApplicationDocumentBasicInfo,
): string {
  return formatSettlementDocumentAccountParts(basic).join(' | ')
}

export function isSettlementDocumentDeductionLine(
  line: SettlementApplicationDocumentLine,
): boolean {
  return line.direction === 'DEDUCTION' || line.amount < 0
}

export function settlementDocumentPayDeductionLabel(
  line: SettlementApplicationDocumentLine,
): string {
  return isSettlementDocumentDeductionLine(line) ? '공제' : '지급'
}

/** 시안: "2026.01.28(수) | 2회차" — 날짜·회차 사이 구분선 */
export function formatSettlementDocumentLectureDateParts(
  line: SettlementApplicationDocumentLine,
): string[] {
  const date = displaySettlementDocumentText(line.educationDate)
  const session = line.sessionLabel?.trim()
  if (date === SETTLEMENT_DOCUMENT_EMPTY) {
    return [session ? session : SETTLEMENT_DOCUMENT_EMPTY]
  }
  return session ? [date, session] : [date]
}

export function formatSettlementDocumentLectureDate(
  line: SettlementApplicationDocumentLine,
): string {
  return formatSettlementDocumentLectureDateParts(line).join(' | ')
}

export function formatSettlementDocumentSignedAmount(
  amount: number | null | undefined,
): string {
  if (amount == null || !Number.isFinite(amount)) return SETTLEMENT_DOCUMENT_EMPTY
  if (amount < 0) return formatSettlementDocumentAmount(amount)
  return `+${amount.toLocaleString('ko-KR')}원`
}

export function isReceiptSettlementDocument(
  documentType: SettlementApplicationDocumentResponse['documentType'],
): boolean {
  return documentType === 'RECEIPT_SETTLEMENT'
}

export function settlementDocumentLinesSectionTitle(
  documentType: SettlementApplicationDocumentResponse['documentType'],
): string {
  return isReceiptSettlementDocument(documentType) ? '영수증 산출 내역' : '강의비 산출 내역'
}

export function settlementDocumentFirstColumnHeader(
  documentType: SettlementApplicationDocumentResponse['documentType'],
): string {
  return isReceiptSettlementDocument(documentType) ? '프로그램명' : '참여 기관명'
}

export function settlementDocumentFirstColumnValue(
  documentType: SettlementApplicationDocumentResponse['documentType'],
  line: SettlementApplicationDocumentLine,
  programTitle?: string | null,
): string {
  if (isReceiptSettlementDocument(documentType)) {
    return displaySettlementDocumentText(programTitle)
  }
  return displaySettlementDocumentText(line.institutionName)
}

export type SettlementDocumentInfoRow = {
  label: string
  value: string
  /** 구분선으로 나눠 보여 줄 값 (시안 `line`) */
  parts?: string[]
  /** 시안상 한 줄 전체(라벨 + 값 3칸 병합)로 보이는 행 */
  fullRow?: boolean
}

export function buildSettlementDocumentBasicRows(
  basic: SettlementApplicationDocumentBasicInfo,
): SettlementDocumentInfoRow[] {
  const accountParts = formatSettlementDocumentAccountParts(basic)
  return [
    { label: '성명', value: displaySettlementDocumentText(basic.name) },
    { label: '영문 성명', value: displaySettlementDocumentText(basic.englishName) },
    {
      label: '주민등록번호',
      value: displaySettlementDocumentText(basic.residentNumberMasked),
    },
    { label: '소속', value: displaySettlementDocumentText(basic.affiliation) },
    { label: '자택 주소', value: formatSettlementDocumentHomeAddress(basic), fullRow: true },
    {
      label: '정산 계좌 정보',
      value: accountParts.join(' | '),
      parts: accountParts,
      fullRow: true,
    },
    {
      label: '지급 목적',
      value: displaySettlementDocumentText(basic.paymentPurpose),
      fullRow: true,
    },
  ]
}

export function buildSettlementDocumentCalcRows(
  calc: SettlementApplicationDocumentCalcInfo,
): SettlementDocumentInfoRow[] {
  return [
    { label: '강의비 유형', value: displayDocumentLectureFeeType(calc.lectureFeeType) },
    {
      label: '강사비 책정',
      value: formatSettlementDocumentAmount(calc.instructorFeeAmount),
    },
    {
      label: '사업소득자 여부',
      value: formatSettlementDocumentYesNo(calc.businessIncomeYn),
    },
    {
      label: '교육 진행 회차',
      value: formatSettlementDocumentCount(calc.educationSessionCount, '회차'),
    },
    ...(formatRecognizedSessionCountLabel(calc.recognizedSessionCount)
      ? [
          {
            label: '인정 차시',
            value: formatRecognizedSessionCountLabel(calc.recognizedSessionCount) ?? SETTLEMENT_DOCUMENT_EMPTY,
          },
        ]
      : []),
    ...(calc.totalLectureFee == null
      ? []
      : [
          {
            label: '총 강의비',
            value: formatSettlementDocumentAmount(calc.totalLectureFee),
          },
        ]),
  ]
}

/** 0이면 위 행 칸에 합쳐져 그리지 않음. 1 이상이면 그 행에서 rowSpan으로 그림. */
export type SettlementDocumentLineSpan = {
  firstRowSpan: number
  dateRowSpan: number
}

/**
 * CMS 문서 Figma 5767:47881: 산출 내역 표의 첫 칸(기관명/프로그램명)·교육 진행 일자 세로 병합.
 * - 서버 줄 순서 그대로, **연속으로 같은 값**만 합침(떨어진 같은 값은 합치지 않음)
 * - 일자는 같은 첫 칸 묶음 안에서만 합침
 * - 빈 값(`-`)은 합치지 않음
 */
export function buildSettlementDocumentLineSpans(
  cells: Array<{ first: string; date: string }>,
): SettlementDocumentLineSpan[] {
  const spans: SettlementDocumentLineSpan[] = cells.map(() => ({ firstRowSpan: 1, dateRowSpan: 1 }))
  const mergeable = (value: string) => value !== '' && value !== SETTLEMENT_DOCUMENT_EMPTY
  let firstStart = 0
  let dateStart = 0
  for (let i = 1; i < cells.length; i += 1) {
    const prev = cells[i - 1]!
    const cur = cells[i]!
    const sameFirst = mergeable(cur.first) && cur.first === prev.first
    if (sameFirst) {
      spans[firstStart]!.firstRowSpan += 1
      spans[i]!.firstRowSpan = 0
    } else {
      firstStart = i
    }
    if (sameFirst && mergeable(cur.date) && cur.date === prev.date) {
      spans[dateStart]!.dateRowSpan += 1
      spans[i]!.dateRowSpan = 0
    } else {
      dateStart = i
    }
  }
  return spans
}

/** 2개씩 한 행. `fullRow`이거나 짝이 없는 행은 한 줄 전체(right = null). 순서는 그대로. */
export function layoutSettlementDocumentInfoRows(
  rows: SettlementDocumentInfoRow[],
): Array<[SettlementDocumentInfoRow, SettlementDocumentInfoRow | null]> {
  const layout: Array<[SettlementDocumentInfoRow, SettlementDocumentInfoRow | null]> = []
  for (let i = 0; i < rows.length; i += 1) {
    const left = rows[i]!
    const next = rows[i + 1]
    if (!left.fullRow && next != null && !next.fullRow) {
      layout.push([left, next])
      i += 1
    } else {
      layout.push([left, null])
    }
  }
  return layout
}

/** lines 합 ≠ total.amount 이면 로깅만 (UI는 total 정본). */
export function warnIfSettlementDocumentTotalMismatch(
  document: Pick<SettlementApplicationDocumentResponse, 'lines' | 'total'>,
): void {
  const sum = document.lines.reduce((acc, line) => acc + line.amount, 0)
  if (sum !== document.total.amount) {
    console.warn('[settlement-application-document] lines sum !== total.amount', {
      linesSum: sum,
      totalAmount: document.total.amount,
      formulaLabel: document.total.formulaLabel,
    })
  }
}

export function formatSettlementDocumentTotalLabel(
  total: SettlementApplicationDocumentTotal,
): string {
  return displaySettlementDocumentText(total.formulaLabel) === SETTLEMENT_DOCUMENT_EMPTY
    ? '합계'
    : (total.formulaLabel?.trim() ?? '합계')
}
