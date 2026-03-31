/**
 * 회원 상세 > 강사 정산 현황 탭용 Mock
 * API 연동 시 서비스 레이어로 대체
 */

import dayjs from 'dayjs'

/** 리스트·캘린더 정산 상태 (시안 배지 라벨) */
export type InstructorSettlementUiStatus =
  | 'payment_statement_verified'
  | 'application_rejected'
  | 'awaiting_confirmation'
  | 'payment_correction_requested'
  | 'account_paid'
  | 'none'

export const INSTRUCTOR_SETTLEMENT_STATUS_LABELS: Record<InstructorSettlementUiStatus, string> = {
  payment_statement_verified: '지급조서 확인 완료',
  application_rejected: '신청 반려',
  awaiting_confirmation: '확인 대기 중',
  payment_correction_requested: '지급 정정 요청',
  account_paid: '계좌 지급 완료',
  none: '-',
}

export const INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE: Record<
  InstructorSettlementUiStatus,
  { bg: string; color: string; border: string }
> = {
  payment_statement_verified: {
    bg: 'rgba(123,97,200,0.08)',
    color: '#7B61C8',
    border: 'rgba(123,97,200,0.2)',
  },
  application_rejected: {
    bg: 'rgba(107,114,128,0.08)',
    color: '#6B7280',
    border: 'rgba(107,114,128,0.2)',
  },
  awaiting_confirmation: {
    bg: 'rgba(79,138,100,0.1)',
    color: '#1e8c29',
    border: 'rgba(79,138,100,0.25)',
  },
  payment_correction_requested: {
    bg: 'rgba(195,47,74,0.08)',
    color: '#C32F4A',
    border: 'rgba(195,47,74,0.2)',
  },
  account_paid: {
    bg: 'rgba(2,132,199,0.08)',
    color: '#0284C7',
    border: 'rgba(2,132,199,0.2)',
  },
  none: {
    bg: 'rgba(107,114,128,0.06)',
    color: '#9CA3AF',
    border: 'rgba(107,114,128,0.15)',
  },
}

export interface InstructorSettlementInvoiceLineItem {
  key: string
  산정항목: string
  항목설명: string
  정산금액: number
  /** true면 +, false면 - */
  isPositive?: boolean
}

export interface InstructorSettlementInvoiceDetail {
  programName: string
  sessionProgress: string
  operationPeriod: string
  paymentStatementStatusLabel: string
  paymentStatementStatusTone: 'purple' | 'mint' | 'default'
  expectedTransferDate: string
  lectureFeeBasis: string
  businessIncomeEarner: string
  institutionName: string
  lectureDateSessions: string
  lineItems: InstructorSettlementInvoiceLineItem[]
  withholdingRatePercent: number
  withholdingAmount: number
  totalFormulaLabel: string
  totalAmount: number
}

export interface InstructorSettlementListRow {
  id: string
  no: number
  programName: string
  institutionName: string
  lectureDateDisplay: string
  /** 캘린더 셀 배치용 (해당 일 강의일) */
  calendarDate: string
  status: InstructorSettlementUiStatus
  scheduledAmount: number
  detailAvailable: boolean
  invoice: InstructorSettlementInvoiceDetail
}

const sampleInvoice = (partial: Partial<InstructorSettlementInvoiceDetail>): InstructorSettlementInvoiceDetail => ({
  programName: '2026년 JA Korea 초등 경제교육',
  sessionProgress: '4 / 16',
  operationPeriod: '2025. 12. 08(월) ~ 2026. 12. 30(수)',
  paymentStatementStatusLabel: '지급조서 확인 완료',
  paymentStatementStatusTone: 'purple',
  expectedTransferDate: '2026. 02. 24(화)',
  lectureFeeBasis: '특강 강의비 915,000원',
  businessIncomeEarner: '해당 없음',
  institutionName: '강서초등학교',
  lectureDateSessions: '2026. 01. 28(수) | 2 ~ 3차시',
  lineItems: [
    {
      key: 'lecture',
      산정항목: '강의비',
      항목설명: '프로그램 1회 강의비 (3급 강사)',
      정산금액: 915_000,
      isPositive: true,
    },
    {
      key: 'transport',
      산정항목: '교통비',
      항목설명: '대전 중구 → 서울 강서구 이동 (146.8km)',
      정산금액: 31_500,
      isPositive: true,
    },
    {
      key: 'stay',
      산정항목: '숙박비',
      항목설명: '8만원 고정 지급',
      정산금액: 80_000,
      isPositive: true,
    },
  ],
  withholdingRatePercent: 8.8,
  withholdingAmount: 90_092,
  totalFormulaLabel: '강의비 + 교통비 + 숙박비 - 원천징수',
  totalAmount: 936_408,
  ...partial,
})

/** 데모 행 (모든 강사 계정에 동일 노출 — API 시 instructorId 필터) */
const ALL_MOCK_ROWS: InstructorSettlementListRow[] = [
  {
    id: 'ins-settle-1',
    no: 8,
    programName: "2026 SAP-함께 성장하JA! 경제교육 프로그램 '함께'",
    institutionName: '강서초등학교',
    lectureDateDisplay: '2026. 01. 22(목) 2차시',
    calendarDate: '2026-01-22',
    status: 'payment_statement_verified',
    scheduledAmount: 300_000,
    detailAvailable: false,
    invoice: sampleInvoice({
      programName: "2026 SAP-함께 성장하JA! 경제교육 프로그램 '함께'",
      paymentStatementStatusLabel: '지급조서 확인 완료',
      paymentStatementStatusTone: 'purple',
    }),
  },
  {
    id: 'ins-settle-2',
    no: 7,
    programName: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기',
    institutionName: '대구수성초등학교',
    lectureDateDisplay: '2026. 01. 19(월) 1차시',
    calendarDate: '2026-01-19',
    status: 'awaiting_confirmation',
    scheduledAmount: 52_788,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기',
      institutionName: '대구수성초등학교',
      paymentStatementStatusLabel: '확인 대기 중',
      paymentStatementStatusTone: 'default',
      lineItems: sampleInvoice({}).lineItems.slice(0, 1),
      withholdingAmount: 12_000,
      totalAmount: 850_000,
    }),
  },
  {
    id: 'ins-settle-3',
    no: 6,
    programName: "미래 리더를 위한 여중생 자립심 향상 프로그램 'Goal'",
    institutionName: '강서초등학교',
    lectureDateDisplay: '2026. 01. 18(일) 3차시',
    calendarDate: '2026-01-18',
    status: 'payment_statement_verified',
    scheduledAmount: 91_500,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: "미래 리더를 위한 여중생 자립심 향상 프로그램 'Goal'",
    }),
  },
  {
    id: 'ins-settle-4',
    no: 5,
    programName: '청소년 금융 리터러시 특강 시리즈',
    institutionName: '수원중학교',
    lectureDateDisplay: '2026. 01. 12(월) 4차시',
    calendarDate: '2026-01-12',
    status: 'payment_correction_requested',
    scheduledAmount: 450_000,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: '청소년 금융 리터러시 특강 시리즈',
      institutionName: '수원중학교',
      paymentStatementStatusLabel: '지급 정정 요청',
      paymentStatementStatusTone: 'default',
    }),
  },
  {
    id: 'ins-settle-5',
    no: 4,
    programName: 'JA 코리아 창업 시뮬레이션 캠프',
    institutionName: '인천남중학교',
    lectureDateDisplay: '2026. 01. 23(금) 1차시',
    calendarDate: '2026-01-23',
    status: 'account_paid',
    scheduledAmount: 620_000,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: 'JA 코리아 창업 시뮬레이션 캠프',
      institutionName: '인천남중학교',
      paymentStatementStatusLabel: '계좌 지급 완료',
      paymentStatementStatusTone: 'mint',
    }),
  },
  {
    id: 'ins-settle-6',
    no: 3,
    programName: '지역 연계 경제교육 파트너십',
    institutionName: '광주동초등학교',
    lectureDateDisplay: '2026. 01. 21(수) 2차시',
    calendarDate: '2026-01-21',
    status: 'awaiting_confirmation',
    scheduledAmount: 280_000,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: '지역 연계 경제교육 파트너십',
      institutionName: '광주동초등학교',
    }),
  },
  {
    id: 'ins-settle-7',
    no: 2,
    programName: '겨울방학 직업 체험 경제 캠프',
    institutionName: '대전중앙고등학교',
    lectureDateDisplay: '2026. 01. 07(수) 1차시',
    calendarDate: '2026-01-07',
    status: 'application_rejected',
    scheduledAmount: 0,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: '겨울방학 직업 체험 경제 캠프',
      institutionName: '대전중앙고등학교',
      paymentStatementStatusLabel: '신청 반려',
      paymentStatementStatusTone: 'default',
      lineItems: [],
      withholdingAmount: 0,
      totalAmount: 0,
    }),
  },
  {
    id: 'ins-settle-8',
    no: 1,
    programName: '2026년 JA Korea 초등 경제교육',
    institutionName: '강서초등학교',
    lectureDateDisplay: '2026. 01. 28(수) 2차시',
    calendarDate: '2026-01-28',
    status: 'account_paid',
    scheduledAmount: 915_000,
    detailAvailable: true,
    invoice: sampleInvoice({}),
  },
]

export function getInstructorSettlementRows(_instructorUserId: string): InstructorSettlementListRow[] {
  return ALL_MOCK_ROWS
}

export function filterRowsByMonth(
  rows: InstructorSettlementListRow[],
  month: dayjs.Dayjs
): InstructorSettlementListRow[] {
  const y = month.year()
  const m = month.month()
  return rows.filter(r => {
    const d = dayjs(r.calendarDate)
    return d.isValid() && d.year() === y && d.month() === m
  })
}

/**
 * 요약 카드: 총 정산 완료금은 누적 데모값, 월·예정은 해당 월 필터된 행 기준
 */
export function summarizeSettlementRows(rowsInMonth: InstructorSettlementListRow[]) {
  const monthCompleted = rowsInMonth.reduce(
    (s, r) => s + (r.status === 'account_paid' ? r.scheduledAmount : 0),
    0
  )
  const scheduled = rowsInMonth.reduce((s, r) => {
    if (
      r.status === 'awaiting_confirmation' ||
      r.status === 'payment_statement_verified' ||
      r.status === 'payment_correction_requested'
    ) {
      return s + r.scheduledAmount
    }
    return s
  }, 0)

  const hasData = rowsInMonth.length > 0
  return {
    /** 시안: 누적 완료금(데모 고정) */
    totalCompleted: 109_150_000,
    monthCompleted: hasData ? monthCompleted : 9_150_000,
    scheduled: hasData ? scheduled : 2_915_000,
  }
}

/** 캘린더 이벤트 형태 (Applicant 캘린더와 유사) */
export function rowsToCalendarEvents(rows: InstructorSettlementListRow[]): Array<{
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: InstructorSettlementListRow
}> {
  return rows.map(r => ({
    id: r.id,
    title: r.programName,
    startDate: `${r.calendarDate}T09:00:00`,
    endDate: `${r.calendarDate}T18:00:00`,
    originalItem: r,
  }))
}

export const INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS = [
  { label: '전체', value: 'all' },
  ...(
    [
      'payment_statement_verified',
      'application_rejected',
      'awaiting_confirmation',
      'payment_correction_requested',
      'account_paid',
      'none',
    ] as const
  ).map(v => ({
    label: INSTRUCTOR_SETTLEMENT_STATUS_LABELS[v],
    value: v,
  })),
]
