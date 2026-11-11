import { formatBusinessIncomeDisplay } from '@jakorea/domain/instructor/business-income'
import type {
  SettlementApplicationDocumentBasicInfo,
  SettlementApplicationDocumentCalcInfo,
  SettlementApplicationDocumentLine,
  SettlementApplicationDocumentResponse,
  SettlementApplicationDocumentTotal,
} from '../api/application-document-types'
import {
  formatDisplayClock,
  toSeoulDisplayParts,
} from '../../../../../shared/lib/format-display-date.ts'
import {
  formatRecognizedSessionCountLabel,
  instructorFeeUnitDisplayLabel,
  lectureFeeTypeDisplayLabel,
} from './lecture-fee-preview.ts'
import { formatIndividualOneWayDistanceKm } from './individual-settlement-contract.ts'

export const SETTLEMENT_DOCUMENT_EMPTY = '-'

/** 제출 스냅샷 값이 없으면 null — 빈 문자열·`-`·기본값을 만들지 않는다 (화면은 빈 칸). */
function snapshotText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function displayDocumentLectureFeeType(value: string | null | undefined): string | null {
  const fromCode = lectureFeeTypeDisplayLabel(value)
  if (fromCode !== SETTLEMENT_DOCUMENT_EMPTY) return fromCode
  return snapshotText(value)
}

function snapshotAmount(amount: number | null | undefined): string | null {
  if (amount == null || !Number.isFinite(amount)) return null
  return `${amount.toLocaleString('ko-KR')}원`
}

function snapshotCount(value: number | null | undefined, suffix: string): string | null {
  if (value == null || !Number.isFinite(value)) return null
  return `${value.toLocaleString('ko-KR')}${suffix}`
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
  suffix = ''
): string {
  if (value == null || !Number.isFinite(value)) return SETTLEMENT_DOCUMENT_EMPTY
  return suffix ? `${value.toLocaleString('ko-KR')}${suffix}` : value.toLocaleString('ko-KR')
}

export function formatSettlementDocumentHomeAddress(
  basic: SettlementApplicationDocumentBasicInfo
): string {
  const address = basic.homeAddress?.trim() ?? ''
  const detail = basic.homeAddressDetail?.trim() ?? ''
  if (address && detail) return `${address} ${detail}`
  if (address || detail) return address || detail
  return SETTLEMENT_DOCUMENT_EMPTY
}

/** 시안: "농협 01010101-01-000111 | 김제이" — 은행·계좌는 공백, 예금주는 구분선 */
export function formatSettlementDocumentAccountParts(
  basic: SettlementApplicationDocumentBasicInfo
): string[] {
  const bank = basic.bank?.trim() ?? ''
  const account = basic.accountNumberMasked?.trim() ?? ''
  const holder = basic.accountHolder?.trim() ?? ''
  const bankAccount = [bank, account].filter(Boolean).join(' ')
  const parts = [bankAccount, holder].filter(Boolean)
  return parts.length > 0 ? parts : [SETTLEMENT_DOCUMENT_EMPTY]
}

export function formatSettlementDocumentAccountInfo(
  basic: SettlementApplicationDocumentBasicInfo
): string {
  return formatSettlementDocumentAccountParts(basic).join(' | ')
}

export function isSettlementDocumentDeductionLine(
  line: SettlementApplicationDocumentLine
): boolean {
  return line.direction === 'DEDUCTION' || line.amount < 0
}

export function settlementDocumentPayDeductionLabel(
  line: SettlementApplicationDocumentLine
): string {
  return isSettlementDocumentDeductionLine(line) ? '공제' : '지급'
}

/** 시안: "2026.01.28(수) | 2회차" — 날짜·회차 사이 구분선 */
export function formatSettlementDocumentLectureDateParts(
  line: SettlementApplicationDocumentLine
): string[] {
  const date = displaySettlementDocumentText(line.educationDate)
  const session = line.sessionLabel?.trim()
  if (date === SETTLEMENT_DOCUMENT_EMPTY) {
    return [session ? session : SETTLEMENT_DOCUMENT_EMPTY]
  }
  return session ? [date, session] : [date]
}

export function formatSettlementDocumentLectureDate(
  line: SettlementApplicationDocumentLine
): string {
  return formatSettlementDocumentLectureDateParts(line).join(' | ')
}

export function formatSettlementDocumentSignedAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return SETTLEMENT_DOCUMENT_EMPTY
  /** 0원은 부호 없이 `0원` */
  if (amount <= 0) return formatSettlementDocumentAmount(amount)
  return `+${amount.toLocaleString('ko-KR')}원`
}

export function isReceiptSettlementDocument(
  documentType: SettlementApplicationDocumentResponse['documentType']
): boolean {
  return documentType === 'RECEIPT_SETTLEMENT'
}

/**
 * 첨부(증빙 파일) 페이지 노출 여부.
 * 지급조서(PAYMENT_STATEMENT)는 제출한 영수증·증빙 파일명을 보여 주지 않는다 — 영수증 정산만 첨부 페이지를 둔다.
 */
export function showSettlementDocumentAttachmentsPage(
  document: Pick<SettlementApplicationDocumentResponse, 'documentType' | 'attachments'>
): boolean {
  return isReceiptSettlementDocument(document.documentType) && document.attachments.length > 0
}

export function settlementDocumentLinesSectionTitle(
  documentType: SettlementApplicationDocumentResponse['documentType']
): string {
  return isReceiptSettlementDocument(documentType) ? '영수증 산출 내역' : '강사비 산출 내역'
}

export function settlementDocumentFirstColumnHeader(
  documentType: SettlementApplicationDocumentResponse['documentType']
): string {
  return isReceiptSettlementDocument(documentType) ? '프로그램명' : '참여 기관명'
}

/**
 * 산출 내역 첫 열(참여 기관명 / 프로그램명) 노출 여부.
 * 개인형 프로그램(GENERAL_INDIVIDUAL)은 지급조서·영수증 모두 첫 열 자체를 그리지 않는다.
 */
export function shouldShowSettlementDocumentFirstColumn(
  _documentType: SettlementApplicationDocumentResponse['documentType'],
  programType?: string | null
): boolean {
  return programType?.trim().toUpperCase() !== 'GENERAL_INDIVIDUAL'
}

export function settlementDocumentFirstColumnValue(
  documentType: SettlementApplicationDocumentResponse['documentType'],
  line: SettlementApplicationDocumentLine,
  programTitle?: string | null
): string {
  if (isReceiptSettlementDocument(documentType)) {
    return displaySettlementDocumentText(programTitle)
  }
  return displaySettlementDocumentText(line.institutionName)
}

export type SettlementDocumentInfoRow = {
  label: string
  /** null = 제출 스냅샷 값 없음 → 빈 칸으로 그린다 */
  value: string | null
  /** 구분선으로 나눠 보여 줄 값 (시안 `line`) */
  parts?: string[]
  /** 시안상 한 줄 전체(라벨 + 값 3칸 병합)로 보이는 행 */
  fullRow?: boolean
}

export function buildSettlementDocumentBasicRows(
  basic: SettlementApplicationDocumentBasicInfo
): SettlementDocumentInfoRow[] {
  const accountParts = formatSettlementDocumentAccountParts(basic)
  return [
    { label: '성명', value: displaySettlementDocumentText(basic.name) },
    { label: '영문 성명', value: displaySettlementDocumentText(basic.englishName) },
    {
      label: '주민등록번호',
      value: displaySettlementDocumentText(basic.residentNumberMasked),
    },
    /** 제출 스냅샷 소속. 없으면 빈 칸 — 현재 회원 프로필(예: JA 강사단)로 채우지 않는다 */
    { label: '소속', value: snapshotText(basic.affiliation) },
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

/**
 * 영수증 정산 신청서 — 학생 교통비 제출 시점 편도 km 스냅샷 행.
 * 스냅샷(calcInfo.oneWayDistanceKm)만 사용하고 현재 주소로 다시 구하지 않는다. 없으면 행 미노출.
 */
export function buildReceiptTransportDistanceRow(
  document: Pick<SettlementApplicationDocumentResponse, 'documentType' | 'calcInfo'>
): SettlementDocumentInfoRow | null {
  if (document.documentType !== 'RECEIPT_SETTLEMENT') return null
  const km = formatIndividualOneWayDistanceKm(document.calcInfo?.oneWayDistanceKm)
  return km ? { label: '교통비 편도 거리', value: km, fullRow: true } : null
}

/** ISO instant → Asia/Seoul `HH:mm`. 시각이 없는 값(날짜만)·파싱 불가면 null */
function formatSeoulClock(iso: string | null | undefined): string | null {
  const parts = toSeoulDisplayParts(iso ?? null)
  if (!parts?.hasTime) return null
  return formatDisplayClock(parts.hour, parts.minute)
}

/** 시안: "09:00 ~ 11:20" — 제출 스냅샷 시작·종료가 모두 있을 때만. 없으면 null */
export function formatSettlementDocumentEducationTimeRange(
  calc: Pick<SettlementApplicationDocumentCalcInfo, 'educationStartAt' | 'educationEndAt'>
): string | null {
  const start = formatSeoulClock(calc.educationStartAt)
  const end = formatSeoulClock(calc.educationEndAt)
  return start && end ? `${start} ~ ${end}` : null
}

/**
 * 시안: "출강 1회당 | 기본 : 240,000원" — 단위·단가 모두 스냅샷 그대로. 둘 다 없으면 []
 * TODO(K11): 1사1교 장거리면 "장거리 : X원"이어야 하는데, 지급조서 문서 calcInfo에 longDistance가 없어 구분할 수 없다(BE 필드 필요).
 */
export function formatSettlementDocumentInstructorFeeParts(
  calc: Pick<SettlementApplicationDocumentCalcInfo, 'instructorFeeAmount' | 'instructorFeeCalculationUnit'>
): string[] {
  const unit = instructorFeeUnitDisplayLabel(calc.instructorFeeCalculationUnit ?? null)
  const amount = snapshotAmount(calc.instructorFeeAmount)
  return [unit, amount ? `기본 : ${amount}` : ''].filter(Boolean)
}

/** 시안: "해당 없음 | 기타 소득 8.8% 적용". 값 없으면 [] */
export function formatSettlementDocumentBusinessIncomeParts(
  businessIncomeYn: boolean | null | undefined
): string[] {
  const label = formatBusinessIncomeDisplay(businessIncomeYn)
  if (label == null) return []
  return [label, businessIncomeYn ? '사업 소득 3.3% 적용' : '기타 소득 8.8% 적용']
}

/** 시안: "2차시 | 09:00 ~ 11:20" — 인정 차시(recognizedSessionCount)만. educationSessionCount 사용 금지 */
export function formatSettlementDocumentEducationProgressParts(
  calc: Pick<
    SettlementApplicationDocumentCalcInfo,
    'recognizedSessionCount' | 'educationStartAt' | 'educationEndAt'
  >
): string[] {
  const sessions = formatRecognizedSessionCountLabel(calc.recognizedSessionCount)
  const timeRange = formatSettlementDocumentEducationTimeRange(calc)
  return [sessions, timeRange].filter((part): part is string => Boolean(part))
}

function isLectureFeeLineCategory(category: string): boolean {
  return category.includes('강의비') || category.includes('강사비')
}

/** 시안: "교통비, 숙박비" — 같은 응답 lines의 지급 항목 중 강의비 외 구분. 없으면 null */
export function formatSettlementDocumentPaymentItems(
  lines: SettlementApplicationDocumentLine[]
): string | null {
  const items: string[] = []
  for (const line of lines) {
    if (isSettlementDocumentDeductionLine(line)) continue
    const category = line.category?.trim()
    if (!category || isLectureFeeLineCategory(category) || items.includes(category)) continue
    items.push(category)
  }
  return items.length > 0 ? items.join(', ') : null
}

function infoRowFromParts(label: string, parts: string[], fullRow = false): SettlementDocumentInfoRow {
  return {
    label,
    value: parts.length > 0 ? parts.join(' | ') : null,
    ...(parts.length > 1 ? { parts } : {}),
    ...(fullRow ? { fullRow: true } : {}),
  }
}

/**
 * 강사비 산출 정보 — 시안 순서(2열):
 * 강사비 유형 | 강사비 책정 / 사업소득자 여부 | 교육 진행 차시 / 지급 항목 여부 | 총 학생 수 / 총 강사비(전체 행)
 */
export function buildSettlementDocumentCalcRows(
  calc: SettlementApplicationDocumentCalcInfo,
  lines: SettlementApplicationDocumentLine[] = []
): SettlementDocumentInfoRow[] {
  return [
    { label: '강사비 유형', value: displayDocumentLectureFeeType(calc.lectureFeeType) },
    infoRowFromParts('강사비 책정', formatSettlementDocumentInstructorFeeParts(calc)),
    infoRowFromParts(
      '사업소득자 여부',
      formatSettlementDocumentBusinessIncomeParts(calc.businessIncomeYn)
    ),
    infoRowFromParts('교육 진행 차시', formatSettlementDocumentEducationProgressParts(calc)),
    { label: '지급 항목 여부', value: formatSettlementDocumentPaymentItems(lines) },
    { label: '총 학생 수', value: snapshotCount(calc.totalStudentCount, '명') },
    {
      label: '총 강사비',
      value: snapshotAmount(calc.totalLectureFee),
      fullRow: true,
    },
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
  cells: Array<{ first: string; date: string }>
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
  rows: SettlementDocumentInfoRow[]
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
  document: Pick<SettlementApplicationDocumentResponse, 'lines' | 'total'>
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
  total: SettlementApplicationDocumentTotal
): string {
  return displaySettlementDocumentText(total.formulaLabel) === SETTLEMENT_DOCUMENT_EMPTY
    ? '합계'
    : (total.formulaLabel?.trim() ?? '합계')
}
