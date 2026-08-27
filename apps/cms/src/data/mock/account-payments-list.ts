/**
 * 정산 관리 > 계좌 지급 확인 — 목록 Mock
 * 지급조서 확인 완료(confirmed)된 건만 이 화면에 노출되는 데이터로 가정합니다.
 *
 * 시안·Notion(2026-08): 목록 상태는 대기/완료 2종, 컬럼은 강의 진행 차시,
 * 개인 프로그램은 기관·차시 `-`.
 */

import type {
  PaymentOrderAdminProcessingStatus,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import {
  ACCOUNT_PAYMENT_AGGREGATE_LABELS,
  type AccountPaymentAggregateStatus,
} from '@/shared/constants/payment-order-aggregate-status'
import {
  getMockPaymentOrderInstructorCalculationStatement,
  getMockPaymentOrderInstructorDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
} from '@/data/mock/payment-order-admin-list'

/** 계좌 지급 단계 — 목록 UI는 awaiting / account_paid 중심 */
export type AccountPaymentTransferStatus = AccountPaymentAggregateStatus

export const ACCOUNT_PAYMENT_STATUS_LABELS: Record<AccountPaymentTransferStatus, string> = {
  awaiting_confirmation: ACCOUNT_PAYMENT_AGGREGATE_LABELS.awaiting_confirmation,
  partial_confirmation: ACCOUNT_PAYMENT_AGGREGATE_LABELS.partial_confirmation,
  account_paid: ACCOUNT_PAYMENT_AGGREGATE_LABELS.account_paid,
  payment_correction_requested: ACCOUNT_PAYMENT_AGGREGATE_LABELS.payment_correction_requested,
}

export interface AccountPaymentRow {
  id: string
  /** API accountPaymentId */
  accountPaymentId?: number
  settlementId?: number
  /**
   * API `memberId`. 지급조서 시안의 `instructorMemberId`와 숫자가 다를 수 있다
   * (박틴토 170201 vs 169202). 한글명으로 두 화면 행을 merge하지 말 것.
   */
  instructorMemberId?: number
  no: number
  instructorName: string
  programName: string
  /** 개인 프로그램이면 빈 문자열 → UI `-` */
  institutionName: string
  /** 차시 표기. 개인 프로그램이면 빈 문자열 → UI `-` */
  sessionLabel: string
  accountPaymentStatus: AccountPaymentTransferStatus
  amount: number
  /**
   * 실제 출강일 ISO `YYYY-MM-DD`.
   * 교육 진행일 표시용 — 캘린더 배치 키로 쓰지 말 것.
   */
  lectureDate?: string
  /**
   * 이체 예정일 ISO `YYYY-MM-DD`.
   * 목록 「이체 예정일」 열·필터·캘린더 배치·세 번째 요약 카드에 사용.
   */
  transferScheduledDate: string
  /** API 목록 — 정산 계좌 (상세·지급 확인 모달·대량이체) */
  bankName?: string
  maskedAccountNo?: string
  accountHolder?: string
  /** 대량이체 양식용 평문 계좌번호 */
  depositAccountNumber?: string
  /** 대량이체 양식용 휴대폰 */
  recipientMobile?: string
  /**
   * 지급조서(강사·프로그램 라인) 처리 현황 — `confirmed` = 지급조서 확인 완료.
   * 계좌 지급 확인 화면에는 이 값이 `confirmed`인 건만 노출(목·API 가정).
   */
  paymentOrderStatus: Extract<PaymentOrderAdminProcessingStatus, 'confirmed'>
}

/** 계좌 지급 확인 — 교육 진행일 표시용 (캘린더 배치 키로 쓰지 말 것) */
export function resolveAccountPaymentAttendanceDate(row: AccountPaymentRow): string {
  const lecture = row.lectureDate?.trim()
  if (lecture) return lecture
  return row.transferScheduledDate
}

/** 계좌 지급 확인 — 캘린더 배치 키 = 이체 예정일(`scheduledPaymentDate`) */
export function resolveAccountPaymentCalendarDate(row: AccountPaymentRow): string {
  const scheduled = row.transferScheduledDate?.trim()
  if (scheduled) return scheduled.slice(0, 10)
  return ''
}

/** 계좌 지급 확인 — 목록/캘린더 `sessionLabel` UI (빈 값 → `-`, 차시 표기 유지) */
export function formatAccountPaymentSessionLabelDisplay(raw: string): string {
  const t = raw?.trim()
  if (!t) return '-'
  return t
}

/** 참여 기관명 UI (개인 프로그램 빈 값 → `-`) */
export function formatAccountPaymentInstitutionDisplay(raw: string): string {
  const t = raw?.trim()
  if (!t) return '-'
  return t
}

/** 계좌 지급 확인 목록/캘린더: 지급조서 확인 완료(라인)인 경우만 노출 */
export function isPaymentOrderStatementConfirmedForAccountPayments(
  row: AccountPaymentRow
): boolean {
  return row.paymentOrderStatus === 'confirmed'
}

/** 계좌 지급 현황 상세 풀페이지 — 기본 정보(마스킹·표시값은 지급조서 산출 mock과 동일 규칙) */
export interface AccountPaymentStatusDetailBasic {
  nameKo: string
  nameEn: string
  phoneDisplay: string
  emailDisplay: string
  addressDisplay: string
  addressBlurredTail?: string
  settlementAccountBankNumberPart: string
  settlementAccountHolderPart: string
  programName: string
  programSessionProgressDisplay: string
  businessPeriodDisplay: string
  accountPaymentStatus: AccountPaymentTransferStatus
  accountPaymentStatusLabel: string
  transferScheduledDateDisplay: string
  lectureFeeStandardTitle: string
  lectureFeeStandardAmount: string
  businessIncomeEarnerLabel: string
}

/** 지급 확인 모달 — 관리자 입금 안내용(화면 기본정보는 마스킹 유지) */
export interface AccountPaymentPlainAccountForConfirm {
  /** 예: `농협 301-01234-1000123` */
  bankAndNumber: string
  holder: string
}

export interface AccountPaymentStatusDetail {
  basic: AccountPaymentStatusDetailBasic
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  plainAccountForPaymentConfirm: AccountPaymentPlainAccountForConfirm
}

const programTitles = [
  'HSBC/HKU Business Case Competition 2026 모집 안내',
  '2026년 JA Korea 초등 경제교육',
  '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
  'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
  '2026 SAP-함께 성장하JAI 참여 고등학생 모집 안내 (IT, SW 멘토링)',
  '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
  '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
  '2026 중고등학생 금융교육 봉사단 모집',
  'JA Korea 여름방학 직업체험 캠프 참가자 모집',
  '2026 기업 멘토링 데이 — 대학생 트랙',
]

const instructorNames = [
  '김틴토',
  '박틴토',
  '김민준',
  '이서연',
  '박도윤',
  '최하은',
  '정시우',
  '강지우',
  '조예진',
  '윤준호',
  '임수아',
  '한지훈',
  '오채원',
  '신유진',
  '권태양',
  '배소율',
  '홍래원',
  '서다인',
  '문태현',
  '양가을',
]

const institutionNames = [
  '강서초등학교',
  '진월초등학교',
  '서울중학교',
  '한빛고등학교',
  '대교초등학교',
  '새솔초등학교',
  '동백중학교',
  '미래고등학교',
  '푸른초등학교',
  '한울중학교',
]

/** 시안 중심 금액 + 보조 금액 */
const amounts = [2_000_000, 915_000, 15_000, 915_000, 2_000_000, 15_000, 625_000, 480_000]

const MOCK_BANKS = ['농협', '하나은행', '국민은행', '기업은행', '우리은행'] as const

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const KO_WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatTransferDateDisplay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = KO_WEEKDAY[date.getDay()]
  return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}(${dow})`
}

function parseSessionOrdinalFromLabel(sessionLabel: string): number {
  const m = sessionLabel.match(/\d+/)
  return m ? parseInt(m[0], 10) : 2
}

function mockBankBundle(index: number, instructorName: string) {
  const bank = MOCK_BANKS[index % MOCK_BANKS.length]!
  const acct = `01010101-01-${String(100000 + (index % 900000)).padStart(6, '0')}`
  const masked = `${bank} ******-**-******`
  const mobile = `010${String(1000_0000 + ((index * 137) % 89_999_999)).padStart(8, '0').slice(0, 8)}`
  return {
    bankName: bank,
    maskedAccountNo: masked,
    accountHolder: instructorName.slice(0, 1) + '**',
    depositAccountNumber: acct.replace(/-/g, ''),
    recipientMobile: mobile,
    plainBankAndNumber: `${bank} ${acct}`,
  }
}

/**
 * 목록 행 기준 상세 VM — `getMockPaymentOrderInstructorCalculationStatement`로 산출 블록·금액을 맞춤.
 */
export function getMockAccountPaymentStatusDetail(row: AccountPaymentRow): AccountPaymentStatusDetail {
  const instructorStub: PaymentOrderAdminInstructorRow = {
    no: row.no,
    instructorName: row.instructorName,
    programCount: 6,
    processingStatus: 'confirmed',
    estimatedAmount: row.amount,
    relatedProgramNames: [row.programName],
    referenceDate: row.transferScheduledDate,
    settlementRelevantAttendanceDates: [row.transferScheduledDate],
    pendingPaymentSettlementItemCount: 0,
  }

  const detail = getMockPaymentOrderInstructorDetail(instructorStub)
  const programLineRow: PaymentOrderAdminInstructorDetailProgramRow = {
    id: row.id,
    no: row.no,
    programName: row.programName,
    institutionName: row.institutionName || '-',
    lectureDate: row.transferScheduledDate,
    sessionOrdinal: parseSessionOrdinalFromLabel(row.sessionLabel || '1차시'),
    processingStatus: 'confirmed',
    estimatedAmount: row.amount,
  }

  const calc = getMockPaymentOrderInstructorCalculationStatement(detail, programLineRow)
  if (calc.context !== 'instructor') {
    throw new Error('getMockAccountPaymentStatusDetail: expected instructor calculation statement')
  }
  const ib = calc.basic
  const sessionCompleted = 4 + (row.no % 12)
  const sessionTotal = 16

  const bankBundle = mockBankBundle(row.no, row.instructorName)
  const bankAndNumber =
    row.bankName && row.depositAccountNumber
      ? `${row.bankName} ${row.depositAccountNumber}`
      : [detail.bankName, detail.accountNumber].filter(Boolean).join(' ') ||
        bankBundle.plainBankAndNumber
  const holder = row.accountHolder?.replace(/\*/g, '') || detail.accountHolder || row.instructorName

  return {
    basic: {
      nameKo: row.instructorName || ib.nameKo,
      nameEn: ib.nameEn,
      phoneDisplay: ib.phoneDisplay,
      emailDisplay: ib.emailDisplay,
      addressDisplay: ib.addressDisplay,
      addressBlurredTail: ib.addressBlurredTail,
      settlementAccountBankNumberPart:
        row.maskedAccountNo ?? ib.settlementAccountBankNumberPart,
      settlementAccountHolderPart: row.accountHolder ?? ib.settlementAccountHolderPart,
      programName: row.programName,
      programSessionProgressDisplay: `${sessionCompleted} / ${sessionTotal}`,
      businessPeriodDisplay: '2025. 12. 08(월) ~ 2026. 12. 30(수)',
      accountPaymentStatus: row.accountPaymentStatus,
      accountPaymentStatusLabel: ACCOUNT_PAYMENT_STATUS_LABELS[row.accountPaymentStatus],
      transferScheduledDateDisplay: formatTransferDateDisplay(row.transferScheduledDate),
      lectureFeeStandardTitle: ib.lectureFeeStandardTitle,
      lectureFeeStandardAmount: ib.lectureFeeStandardAmount,
      businessIncomeEarnerLabel: ib.businessIncomeEarnerLabel,
    },
    blocks: calc.blocks,
    formulaLabel: calc.formulaLabel,
    totalAmount: calc.totalAmount,
    plainAccountForPaymentConfirm: {
      bankAndNumber,
      holder: holder.length >= 2 ? holder : row.instructorName,
    },
  }
}

/**
 * @deprecated 예산은 budget-summary API(`sponsor_yearly_business` 합계)만 사용.
 * FE 화면에서 이 상수를 표시하지 말 것.
 */
export const MOCK_ACCOUNT_PAYMENT_ANNUAL_BUDGET = 109_150_000

const MOCK_ROW_COUNT = 32

/**
 * 32건 — `paymentOrderStatus`는 전부 `confirmed`.
 * 상태: 상위 약 60% 대기 / 하위 약 40% 완료 (시안 리스트 패턴).
 * 이체일: 2026-02 중심, 출강일: 2026-01 (교육 진행일 표시용; 캘린더는 이체일).
 */
export const mockAccountPaymentRows: AccountPaymentRow[] = Array.from(
  { length: MOCK_ROW_COUNT },
  (_, i): AccountPaymentRow => {
    const no = 206 - i
    const awaitingCount = Math.ceil(MOCK_ROW_COUNT * 0.6)
    const accountPaymentStatus: AccountPaymentTransferStatus =
      i < awaitingCount ? 'awaiting_confirmation' : 'account_paid'

    const instructorName = instructorNames[i % instructorNames.length]!
    const isPersonal = i >= MOCK_ROW_COUNT - 2
    const sessionLabel = isPersonal
      ? ''
      : i % 4 === 0
        ? '2 ~ 3차시'
        : `${1 + (i % 4)}차시`

    const transferDay = Math.min(28, 10 + (i % 18))
    const transferScheduledDate =
      i === 0 ? isoDate(2026, 2, 24) : isoDate(2026, 2, transferDay)
    const lectureDay = Math.min(28, 5 + (i % 20))
    const lectureDate = isoDate(2026, 1, lectureDay)

    const bank = mockBankBundle(i, instructorName)

    return {
      id: `account-pay-${no}`,
      no,
      instructorName,
      programName: programTitles[i % programTitles.length]!,
      institutionName: isPersonal ? '' : institutionNames[i % institutionNames.length]!,
      sessionLabel,
      accountPaymentStatus,
      amount: amounts[i % amounts.length]!,
      lectureDate,
      transferScheduledDate,
      bankName: bank.bankName,
      maskedAccountNo: bank.maskedAccountNo,
      accountHolder: bank.accountHolder,
      depositAccountNumber: bank.depositAccountNumber,
      recipientMobile: bank.recipientMobile,
      paymentOrderStatus: 'confirmed',
    }
  }
).filter(isPaymentOrderStatementConfirmedForAccountPayments)
