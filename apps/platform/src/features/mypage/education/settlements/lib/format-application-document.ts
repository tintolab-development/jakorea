import type {
  SettlementApplicationDocumentBasicInfo,
  SettlementApplicationDocumentCalcInfo,
  SettlementApplicationDocumentLine,
  SettlementApplicationDocumentResponse,
  SettlementApplicationDocumentTotal,
} from '../api/application-document-types'

export const SETTLEMENT_DOCUMENT_EMPTY = '-'

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

export function formatSettlementDocumentAccountInfo(
  basic: SettlementApplicationDocumentBasicInfo,
): string {
  const bank = basic.bank?.trim() ?? ''
  const account = basic.accountNumberMasked?.trim() ?? ''
  const holder = basic.accountHolder?.trim() ?? ''
  const parts = [bank, account].filter(Boolean)
  if (parts.length === 0 && !holder) return SETTLEMENT_DOCUMENT_EMPTY
  if (holder) {
    return parts.length > 0 ? `${parts.join(' · ')} · ${holder}` : holder
  }
  return parts.join(' · ')
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

export function formatSettlementDocumentLectureDate(
  line: SettlementApplicationDocumentLine,
): string {
  const date = displaySettlementDocumentText(line.educationDate)
  const session = line.sessionLabel?.trim()
  if (date === SETTLEMENT_DOCUMENT_EMPTY) {
    return session ? session : SETTLEMENT_DOCUMENT_EMPTY
  }
  return session ? `${date} | ${session}` : date
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

export function buildSettlementDocumentBasicRows(
  basic: SettlementApplicationDocumentBasicInfo,
): Array<{ label: string; value: string }> {
  return [
    { label: '성명', value: displaySettlementDocumentText(basic.name) },
    { label: '영문 성명', value: displaySettlementDocumentText(basic.englishName) },
    {
      label: '주민등록번호',
      value: displaySettlementDocumentText(basic.residentNumberMasked),
    },
    { label: '소속', value: displaySettlementDocumentText(basic.affiliation) },
    { label: '자택 주소', value: formatSettlementDocumentHomeAddress(basic) },
    { label: '정산 계좌 정보', value: formatSettlementDocumentAccountInfo(basic) },
    { label: '지급 목적', value: displaySettlementDocumentText(basic.paymentPurpose) },
  ]
}

export function buildSettlementDocumentCalcRows(
  calc: SettlementApplicationDocumentCalcInfo,
): Array<{ label: string; value: string }> {
  return [
    { label: '강의비 유형', value: displaySettlementDocumentText(calc.lectureFeeType) },
    {
      label: '강사비 책정',
      value: formatSettlementDocumentAmount(calc.instructorFeeAmount),
    },
    {
      label: '사업소득자 여부',
      value: formatSettlementDocumentYesNo(calc.businessIncomeYn),
    },
    {
      label: '교육 진행 차시',
      value: formatSettlementDocumentCount(calc.educationSessionCount, '차시'),
    },
    {
      label: '총 강의비',
      value: formatSettlementDocumentAmount(calc.totalLectureFee),
    },
  ]
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
