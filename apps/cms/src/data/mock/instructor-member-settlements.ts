/**
 * 회원 상세 > 강사 정산 현황 탭용 Mock
 * API 연동 시 서비스 레이어로 대체
 *
 * 라벨·색상 단일 정의: `@/shared/constants/instructor-settlement-status`
 */

import dayjs from 'dayjs'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  INSTRUCTOR_SETTLEMENT_STATUSES_ELIGIBLE_FOR_PAYMENT_STATEMENT_ISSUE,
  INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS,
  isInstructorSettlementEligibleForPaymentStatementIssue,
  getInstructorSettlementInvoiceStatusPresentation,
} from '@/shared/constants/instructor-settlement-status'

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
  paymentStatementStatus: InstructorSettlementUiStatus
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

/** 지급조서 캘린더 등 1행 제목: 강사별은 대괄호 없이 강사명만, 프로그램별은 `[프로그램명]` */
export type SettlementCalendarListTitleVariant = 'plain-instructor' | 'bracket-program'

export interface InstructorSettlementListRow {
  id: string
  no: number
  programName: string
  /**
   * 계좌 지급 확인 등 강사 단위 1행일 때만 설정.
   * 캘린더 셀 라벨·리스트/툴팁 1행에 사용 (`settlementCalendarPrimaryTitle` 참고).
   */
  instructorName?: string
  /**
   * 지급조서 확인 캘린더: 강사별(`plain-instructor`)은 우측·툴팁 1행에 강사명만,
   * 프로그램별(`bracket-program`)은 `[프로그램명]`. 미지정 시 기존 `강사명 [프로그램명]` 규칙.
   */
  settlementListTitleVariant?: SettlementCalendarListTitleVariant
  institutionName: string
  lectureDateDisplay: string
  /** 캘린더 셀 배치용 (해당 일 강의일) */
  calendarDate: string
  status: InstructorSettlementUiStatus
  scheduledAmount: number
  detailAvailable: boolean
  invoice: InstructorSettlementInvoiceDetail
}

/** 정산 캘린더 우측 목록·일별 툴팁 1행 제목 */
export function settlementCalendarPrimaryTitle(row: InstructorSettlementListRow): string {
  if (row.settlementListTitleVariant === 'plain-instructor' && row.instructorName?.trim()) {
    return row.instructorName.trim()
  }
  if (row.instructorName?.trim()) {
    return `${row.instructorName.trim()} [${row.programName}]`
  }
  return `[${row.programName}]`
}

const sampleInvoice = (
  partial: Partial<InstructorSettlementInvoiceDetail>
): InstructorSettlementInvoiceDetail => ({
  programName: '2026년 JA Korea 초등 경제교육',
  sessionProgress: '4 / 16',
  operationPeriod: '2025. 12. 08(월) ~ 2026. 12. 30(수)',
  paymentStatementStatus: 'payment_statement_verified',
  expectedTransferDate: '2026. 05. 24(일)',
  lectureFeeBasis: '특강 강의비 915,000원',
  businessIncomeEarner: '해당 없음',
  institutionName: '강서초등학교',
  lectureDateSessions: '2026. 04. 28(화) | 2 ~ 3차시',
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

/** 데모 행 — 정산 현황 8종 각 1건 (모든 강사 계정에 동일 노출) */
const ALL_MOCK_ROWS: InstructorSettlementListRow[] = [
  {
    id: 'ins-settle-1',
    no: 8,
    programName: '2026년 JA Korea 초등 경제교육',
    institutionName: '강서초등학교',
    lectureDateDisplay: '2026. 04. 28(화) 2차시',
    calendarDate: '2026-04-28',
    status: 'payment_statement_reapplication',
    scheduledAmount: 915_000,
    detailAvailable: true,
    invoice: sampleInvoice({ paymentStatementStatus: 'payment_statement_reapplication' }),
  },
  {
    id: 'ins-settle-2',
    no: 7,
    programName: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기',
    institutionName: '대구수성초등학교',
    lectureDateDisplay: '2026. 04. 19(일) 1차시',
    calendarDate: '2026-04-19',
    status: 'awaiting_confirmation',
    scheduledAmount: 52_788,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기',
      institutionName: '대구수성초등학교',
      paymentStatementStatus: 'awaiting_confirmation',
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
    lectureDateDisplay: '2026. 04. 18(토) 3차시',
    calendarDate: '2026-04-18',
    status: 'partial_confirmation',
    scheduledAmount: 91_500,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: "미래 리더를 위한 여중생 자립심 향상 프로그램 'Goal'",
      paymentStatementStatus: 'partial_confirmation',
    }),
  },
  {
    id: 'ins-settle-4',
    no: 5,
    programName: "2026 SAP-함께 성장하JA! 경제교육 프로그램 '함께'",
    institutionName: '강서초등학교',
    lectureDateDisplay: '2026. 04. 22(수) 2차시',
    calendarDate: '2026-04-22',
    status: 'payment_statement_verified',
    scheduledAmount: 300_000,
    detailAvailable: false,
    invoice: sampleInvoice({
      programName: "2026 SAP-함께 성장하JA! 경제교육 프로그램 '함께'",
      paymentStatementStatus: 'payment_statement_verified',
    }),
  },
  {
    id: 'ins-settle-5',
    no: 4,
    programName: 'JA 코리아 창업 시뮬레이션 캠프',
    institutionName: '인천남중학교',
    lectureDateDisplay: '2026. 04. 23(목) 1차시',
    calendarDate: '2026-04-23',
    status: 'account_paid',
    scheduledAmount: 620_000,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: 'JA 코리아 창업 시뮬레이션 캠프',
      institutionName: '인천남중학교',
      paymentStatementStatus: 'account_paid',
    }),
  },
  {
    id: 'ins-settle-6',
    no: 3,
    programName: '지역 연계 경제교육 파트너십',
    institutionName: '광주동초등학교',
    lectureDateDisplay: '2026. 04. 21(화) 2차시',
    calendarDate: '2026-04-21',
    status: 'none',
    scheduledAmount: 0,
    detailAvailable: false,
    invoice: sampleInvoice({
      programName: '지역 연계 경제교육 파트너십',
      institutionName: '광주동초등학교',
      paymentStatementStatus: 'none',
      lineItems: [],
      withholdingAmount: 0,
      totalAmount: 0,
    }),
  },
  {
    id: 'ins-settle-7',
    no: 2,
    programName: '겨울방학 직업 체험 경제 캠프',
    institutionName: '대전중앙고등학교',
    lectureDateDisplay: '2026. 04. 07(화) 1차시',
    calendarDate: '2026-04-07',
    status: 'application_rejected',
    scheduledAmount: 0,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: '겨울방학 직업 체험 경제 캠프',
      institutionName: '대전중앙고등학교',
      paymentStatementStatus: 'application_rejected',
      lineItems: [],
      withholdingAmount: 0,
      totalAmount: 0,
    }),
  },
  {
    id: 'ins-settle-8',
    no: 1,
    programName: '청소년 금융 리터러시 특강 시리즈',
    institutionName: '수원중학교',
    lectureDateDisplay: '2026. 04. 12(일) 4차시',
    calendarDate: '2026-04-12',
    status: 'payment_correction_requested',
    scheduledAmount: 450_000,
    detailAvailable: true,
    invoice: sampleInvoice({
      programName: '청소년 금융 리터러시 특강 시리즈',
      institutionName: '수원중학교',
      paymentStatementStatus: 'payment_correction_requested',
    }),
  },
]

export function getInstructorSettlementRows(
  _instructorUserId: string
): InstructorSettlementListRow[] {
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

export interface SummarizeSettlementRowsOptions {
  /**
   * 총 정산 완료금 계산에 쓸 전체 행(필터·표시 월과 무관한 누적).
   * 생략 시 `rowsInMonth`만으로 합산(동일 집합이면 총·월 완료금이 같아짐).
   */
  allRowsForTotal?: InstructorSettlementListRow[]
}

function sumCompletedAmount(rows: InstructorSettlementListRow[]) {
  return rows.reduce((s, r) => s + (r.status === 'account_paid' ? r.scheduledAmount : 0), 0)
}

function sumScheduledPending(rows: InstructorSettlementListRow[]) {
  return rows.reduce((s, r) => {
    if (
      r.status === 'awaiting_confirmation' ||
      r.status === 'partial_confirmation' ||
      r.status === 'payment_statement_verified' ||
      r.status === 'payment_correction_requested'
    ) {
      return s + r.scheduledAmount
    }
    return s
  }, 0)
}

/**
 * 요약 카드: 월 정산 완료·정산 예정은 `rowsInMonth`(해당 월 + 검색 필터) 기준,
 * 총 정산 완료금은 `allRowsForTotal`이 있으면 그 전체 행 기준 누적.
 */
export function summarizeSettlementRows(
  rowsInMonth: InstructorSettlementListRow[],
  options?: SummarizeSettlementRowsOptions
) {
  const rowsForTotal = options?.allRowsForTotal ?? rowsInMonth
  return {
    totalCompleted: sumCompletedAmount(rowsForTotal),
    monthCompleted: sumCompletedAmount(rowsInMonth),
    scheduled: sumScheduledPending(rowsInMonth),
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

