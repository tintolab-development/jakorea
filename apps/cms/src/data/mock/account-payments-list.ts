/**
 * 정산 관리 > 계좌 지급 확인 — 목록 Mock
 * 지급조서 확인 완료(confirmed)된 건만 이 화면에 노출되는 데이터로 가정합니다.
 */

import type {
  PaymentOrderAdminProcessingStatus,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import {
  getMockPaymentOrderInstructorCalculationStatement,
  getMockPaymentOrderInstructorDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
} from '@/data/mock/payment-order-admin-list'

/** 계좌 지급 단계 (지급조서 단계와 별개) */
export type AccountPaymentTransferStatus = 'pending' | 'completed'

export const ACCOUNT_PAYMENT_STATUS_LABELS: Record<AccountPaymentTransferStatus, string> = {
  pending: '계좌 지급 대기 중',
  completed: '계좌 지급 완료',
}

export interface AccountPaymentRow {
  id: string
  no: number
  instructorName: string
  programName: string
  institutionName: string
  /** 예: `2 ~ 3차시`, `2차시` */
  sessionLabel: string
  accountPaymentStatus: AccountPaymentTransferStatus
  amount: number
  /** 이체 예정일 ISO YYYY-MM-DD */
  transferScheduledDate: string
  /** 목록은 항상 지급조서 확인 완료 건만 포함 */
  paymentOrderStatus: Extract<PaymentOrderAdminProcessingStatus, 'confirmed'>
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
  '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
  'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
  '2026년 JA Korea 초등 경제교육 모집 안내',
  '2026 SAP-함께 성장하JAI 참여 고등학생 모집 안내 (IT, SW 멘토링)',
  '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
  '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
  '2026 중고등학생 금융교육 봉사단 모집',
  'JA Korea 여름방학 직업체험 캠프 참가자 모집',
  '2026 기업 멘토링 데이 — 대학생 트랙',
]

const instructorNames = [
  '김틴토',
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
  '백서준',
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

const amounts = [2_000_000, 915_000, 15_000, 625_000, 480_000, 1_200_000, 350_000, 820_000]

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
  }

  const detail = getMockPaymentOrderInstructorDetail(instructorStub)
  const programLineRow: PaymentOrderAdminInstructorDetailProgramRow = {
    id: row.id,
    no: row.no,
    programName: row.programName,
    institutionName: row.institutionName,
    lectureDate: row.transferScheduledDate,
    sessionOrdinal: parseSessionOrdinalFromLabel(row.sessionLabel),
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

  return {
    basic: {
      nameKo: ib.nameKo,
      nameEn: ib.nameEn,
      phoneDisplay: ib.phoneDisplay,
      emailDisplay: ib.emailDisplay,
      addressDisplay: ib.addressDisplay,
      addressBlurredTail: ib.addressBlurredTail,
      settlementAccountBankNumberPart: ib.settlementAccountBankNumberPart,
      settlementAccountHolderPart: ib.settlementAccountHolderPart,
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
      bankAndNumber: [detail.bankName, detail.accountNumber].filter(Boolean).join(' '),
      holder: detail.accountHolder,
    },
  }
}

/** 당해 예산 총액 (카드1용 mock 상수) */
export const MOCK_ACCOUNT_PAYMENT_ANNUAL_BUDGET = 109_150_000

/**
 * 30건 — 전부 지급조서 확인 완료(paymentOrderStatus: confirmed).
 * 계좌 지급 대기/완료만 교차 배치.
 */
export const mockAccountPaymentRows: AccountPaymentRow[] = Array.from({ length: 30 }, (_, i) => {
  const no = 206 - i
  const accountPaymentStatus: AccountPaymentTransferStatus = i % 3 === 0 ? 'completed' : 'pending'
  const baseM = 1 + (i % 12)
  const year = i < 15 ? 2026 : 2025
  const day = 5 + ((i * 7) % 24)
  const transferScheduledDate = isoDate(year, baseM, Math.min(day, 28))

  const sessionLabel = i % 4 === 0 ? `${2 + (i % 2)}차시` : `${2} ~ ${3 + (i % 2)}차시`

  return {
    id: `account-pay-${no}`,
    no,
    instructorName: instructorNames[i % instructorNames.length],
    programName: programTitles[i % programTitles.length],
    institutionName: institutionNames[i % institutionNames.length],
    sessionLabel,
    accountPaymentStatus,
    amount: amounts[i % amounts.length],
    transferScheduledDate,
    paymentOrderStatus: 'confirmed',
  }
})
