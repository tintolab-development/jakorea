/**
 * 정산 관리 > 지급조서 확인 — 프로그램별·강사별 집계 목록 Mock
 * (화면 전용; domain PaymentStatement와 별개)
 */

import { MASKING_POLICY } from '@/shared/constants/download-policy'
import dayjs from 'dayjs'
import { getPaymentOrdersDefaultDateRangeParams } from '@/pages/settlement-management/payment-orders-date-range'
import { settlementItemSettingSections } from './settlement-item-settings'
import type { PaymentOrderCalculationBasisDetail } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import {
  buildActivityBasisDetail,
  buildLectureFeeBasisDetailFromStandardTitle,
  buildLodgingBasisDetail,
  buildMealBasisDetail,
  buildTravelBasisDetail,
  buildWithholdingBasisDetail,
  lectureFeeLineDescriptionFromStandardTitle,
  resolveActivityBasisDetailTotalWon,
  resolveLodgingBasisDetailTotalWon,
  resolveMealBasisDetailTotalWon,
  resolveTravelBasisDetailTotalWon,
  resolveWithholdingBasisDetailAmountWon,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'

export type PaymentOrderAdminProcessingStatus =
  | 'pending'
  | 'reapplication'
  | 'partial'
  | 'confirmed'
  | 'correction'
  | 'application_rejected'

/**
 * 목록·테이블 지급조서 처리 현황 — 전체 문구 (캘린더만 `PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST` 함축형)
 */
export const PAYMENT_ORDER_STATUS_LABELS_LIST: Record<PaymentOrderAdminProcessingStatus, string> = {
  pending: '확인 대기 중',
  reapplication: '지급조서 재신청',
  partial: '확인 진행 중',
  application_rejected: '신청 반려',
  confirmed: '지급조서 확인 완료',
  correction: '지급 정정 요청',
}

/** 배지·상세 라벨 — 테이블과 동일 전체 문구 */
export const PAYMENT_ORDER_STATUS_LABELS_DETAIL: Record<PaymentOrderAdminProcessingStatus, string> =
  {
    pending: '확인 대기 중',
    reapplication: '지급조서 재신청',
    partial: '확인 진행 중',
    confirmed: '지급조서 확인 완료',
    application_rejected: '신청 반려',
    correction: '지급 정정 요청',
  }

/** 캘린더 전용 함축형 — 카드·툴팁·그리드 타이틀 한 줄에만 사용 */
export const PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = {
  pending: '확인 대기',
  reapplication: '재신청',
  partial: '일부 확인',
  confirmed: '확인 완료',
  application_rejected: '신청 반려',
  correction: '정정 요청',
}

/** @deprecated 캘린더는 `PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST` 사용 */
export const PAYMENT_ORDER_CALENDAR_STATUS_SHORT_DETAIL: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST

export interface PaymentOrderAdminProgramRow {
  no: number
  /** API 집계 키 (programId) */
  programId?: number
  aggregateKey?: string
  programName: string
  instructorCount: number
  processingStatus: PaymentOrderAdminProcessingStatus
  estimatedAmount: number
  /** 필터용 기준일 (기간 필터 보조) */
  referenceDate: string
  /** 실제 출강일(정산 항목) — 기간 필터·캘린더 이벤트에 사용 */
  settlementRelevantAttendanceDates: string[]
  /** 지급 대기 정산 항목 수 — 버킷 필터·목록 열 */
  pendingPaymentSettlementItemCount: number
}

export interface PaymentOrderAdminInstructorRow {
  no: number
  /** API 집계 키 (instructorMemberId) */
  instructorMemberId?: number
  aggregateKey?: string
  instructorName: string
  programCount: number
  processingStatus: PaymentOrderAdminProcessingStatus
  estimatedAmount: number
  /** 강사별 뷰에서 프로그램명 필터: 참여 프로그램명 중 하나라도 포함 시 매칭 */
  relatedProgramNames: string[]
  referenceDate: string
  settlementRelevantAttendanceDates: string[]
  pendingPaymentSettlementItemCount: number
  /** 주간 시간 격자: 세션 시작·종료(HH:mm) — 있으면 태그를 해당 시간대에 배치 */
  calendarSlotStartTime?: string
  calendarSlotEndTime?: string
  /** 주간 격자 태그 본문(줄바꿈 가능). 없으면 강사명·프로그램명 등으로 대체 */
  calendarWeekGridLabel?: string
}

/** 지급 현황 상세 — 강사별 정산 목록 행 (집계 상태와 별도; 신청 반려 등) */
export type PaymentOrderAdminLineProcessingStatus =
  | 'pending'
  | 'reapplication'
  | 'confirmed'
  | 'correction'
  | 'rejected'
  /** 지급 신청 반려(라인 전용; 목록 `PaymentOrderAdminProcessingStatus` 와 분리) */
  | 'application_rejected'

export const PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: '확인 대기 중',
  reapplication: '지급조서 재신청',
  confirmed: '지급조서 확인 완료',
  correction: '지급 정정 요청',
  rejected: '계좌 지급 완료',
  application_rejected: '신청 반려',
}

/** 목록·상세 합산: 신청 반려·지급 정정 요청·계좌 지급 완료 제외 */
export function countsTowardPaymentOrderEstimatedAmount(
  status: PaymentOrderAdminLineProcessingStatus
): boolean {
  return status !== 'application_rejected' && status !== 'correction' && status !== 'rejected'
}

export interface PaymentOrderAdminProgramDetailInstructorRow {
  id: string
  no: number
  settlementId?: number
  statementId?: number
  instructorName: string
  institutionName: string
  /** 강의일 (ISO YYYY-MM-DD) */
  lectureDate: string
  sessionOrdinal: number
  processingStatus: PaymentOrderAdminLineProcessingStatus
  estimatedAmount: number
  /** 일괄 확인 시 선택한 강의비 지급 예정일 (ISO YYYY-MM-DD) */
  lectureFeePaymentScheduledDate?: string
  /** 신청 반려 시 산출 내역서·상세에 표시할 사유 */
  processingRejectionReason?: string
}

export interface PaymentOrderAdminProgramDetail {
  programNo: number
  programName: string
  aggregateProcessingStatus: PaymentOrderAdminProcessingStatus
  businessPeriodStart: string
  businessPeriodEnd: string
  sessionCompleted: number
  sessionTotal: number
  instructorRows: PaymentOrderAdminProgramDetailInstructorRow[]
}

/** 강사 기준 지급 현황 상세 — 프로그램별 정산 행 */
export interface PaymentOrderAdminInstructorDetailProgramRow {
  id: string
  no: number
  settlementId?: number
  statementId?: number
  programName: string
  institutionName: string
  lectureDate: string
  sessionOrdinal: number
  processingStatus: PaymentOrderAdminLineProcessingStatus
  estimatedAmount: number
  /** 일괄 확인 시 선택한 강의비 지급 예정일 (ISO YYYY-MM-DD) */
  lectureFeePaymentScheduledDate?: string
  /** 신청 반려 시 산출 내역서·상세에 표시할 사유 */
  processingRejectionReason?: string
}

/** 산출 내역서 모달 — 산정 행 구분(합계 수식·표시용) */
export type PaymentOrderCalculationLineKind =
  | 'lecture_fee'
  | 'travel'
  | 'lodging'
  | 'meal'
  | 'activity'
  | 'withholding'

/** 산출 내역서 모달 — 기본 정보(프로그램 맥락 4열 `program-detail-info-tab`) */
export interface PaymentOrderCalculationStatementProgramBasicInfo {
  programName: string
  /** 확인 모달 본문 등에 쓰는 강사명 */
  instructorNameKo: string
  /** 사업 운영 기간 한 줄 (예: `2025. 12. 08(월) ~ 2026. 12. 30(수)`) */
  businessPeriodDisplay: string
  /** 프로그램 진행 회차 (예: `4 / 16`) */
  programSessionProgressDisplay: string
  /** 해당 강사 라인의 지급조서 처리 현황 문구 */
  processingStatusDisplay: string
  processingStatusClass: PaymentOrderAdminLineProcessingStatus
  /** 지급 반려 시 「사유 : …」에 표시할 본문 */
  processingRejectionReason?: string
  /** 지급조서 확인 완료 시 이체 예정일(요일 포함 한 줄) */
  lectureFeePaymentScheduledDateDisplay?: string
  lectureFeeStandardTitle: string
  lectureFeeStandardAmount: string
  businessIncomeEarnerLabel: string
}

/** 산출 내역서 모달 — 기본 정보(강사 맥락 `applicant-instructor-basic-info` 5열·2블록) */
export interface PaymentOrderCalculationStatementInstructorBasicInfo {
  nameKo: string
  nameEn: string
  phoneDisplay: string
  emailDisplay: string
  addressDisplay: string
  addressBlurredTail?: string
  settlementAccountBankNumberPart: string
  settlementAccountHolderPart: string
  /** Mock 시드 기반. Remote 미제공 시 `-` */
  genderBirthDisplay?: string
  /** 1 이상이면 성명 옆 일정 변경 배지 */
  scheduleChangeCancelCount?: number
  /** 지급조서 발급용 — UI 미노출 */
  programName?: string
  processingStatusDisplay: string
  processingStatusClass: PaymentOrderAdminLineProcessingStatus
  processingRejectionReason?: string
  /** 지급조서 확인 완료 시 이체 예정일(요일 포함 한 줄) */
  lectureFeePaymentScheduledDateDisplay?: string
  lectureFeeStandardTitle: string
  lectureFeeStandardAmount: string
  businessIncomeEarnerLabel: string
}

export interface PaymentOrderCalculationStatementLine {
  id: string
  itemLabel: string
  description: string
  /** 양수: 가산, 음수: 차감 */
  amount: number
  kind: PaymentOrderCalculationLineKind
  /** 시안 마스킹 등 — 있으면 정산 금액 열에 이 문자열을 표시 */
  amountDisplayOverride?: string
  /** 산정 기준 상세 모달 payload (read-only) */
  basisDetail?: PaymentOrderCalculationBasisDetail
}

export interface PaymentOrderCalculationStatementSessionBlock {
  institutionName: string
  /** 강의 진행 일자 — 날짜(요일) 구간 (테이블에서 디바이더로 회차와 구분) */
  lectureDateDisplay: string
  /** 예: 2 ~ 3차시 */
  lectureSessionDisplay: string
  lines: PaymentOrderCalculationStatementLine[]
}

export type PaymentOrderProgramCalculationStatement =
  | {
      context: 'program'
      /** 강사 별 정산 목록 행 id — 확인/반려 후 테이블 동기화용 */
      sourceLineRowId: string
      basic: PaymentOrderCalculationStatementProgramBasicInfo
      blocks: PaymentOrderCalculationStatementSessionBlock[]
      formulaLabel: string
      totalAmount: number
    }
  | {
      context: 'instructor'
      /** 프로그램별 정산 목록 행 id */
      sourceLineRowId: string
      basic: PaymentOrderCalculationStatementInstructorBasicInfo
      blocks: PaymentOrderCalculationStatementSessionBlock[]
      formulaLabel: string
      totalAmount: number
    }

/** 강사 집계 행 기준 상세(기본 정보 + 프로그램별 정산 목록) mock 원본 */
export interface PaymentOrderAdminInstructorDetail {
  instructorNo: number
  nameKo: string
  nameEn: string
  address: string
  phone: string
  email: string
  bankName: string
  accountNumber: string
  accountHolder: string
  /** 목록 테이블과 동일한 총 정산 신청 금액 */
  totalEstimatedAmount: number
  /** Mock 시드 기반. Remote 미제공 시 `-` */
  genderBirthDisplay?: string
  /** 1 이상이면 성명 옆 일정 변경 배지 */
  scheduleChangeCancelCount?: number
  programRows: PaymentOrderAdminInstructorDetailProgramRow[]
}

/** 정산 신청 이후 ~ 지급조서 확인 완료까지(계좌 지급 `rejected`·해당 없음·제미나이는 제외) */
const statuses: PaymentOrderAdminProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'application_rejected',
  'reapplication',
  'partial',
]

const DESIGN_ELEMENTARY_PROGRAM = '2026년 JA Korea 초등 경제교육'
const DESIGN_HSBC_PROGRAM = 'HSBC/HKU Business Case Competition 2026 모집 안내'

const programTitles = [
  DESIGN_HSBC_PROGRAM,
  '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
  'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
  `${DESIGN_ELEMENTARY_PROGRAM} 모집 안내`,
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
  '최틴토',
  '허틴토',
  '이틴토',
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
]

const instructorNamesEn = [
  'Kim Tinto',
  'Park Tinto',
  'Choi Tinto',
  'Heo Tinto',
  'Lee Tinto',
  'Kim Minjun',
  'Lee Seoyeon',
  'Park Doyun',
  'Choi Haeun',
  'Jung Siu',
  'Kang Jiu',
  'Cho Yejin',
  'Yoon Junho',
  'Lim Sua',
  'Han Jihun',
  'Oh Chaewon',
  'Shin Yujin',
  'Kwon Taeyang',
  'Bae Soyul',
  'Hong Raewon',
]

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const paymentOrdersMockDefaultRange = getPaymentOrdersDefaultDateRangeParams()
const paymentOrdersMockRangeStart = dayjs(paymentOrdersMockDefaultRange.from)
const paymentOrdersMockRangeDayCount = Math.max(
  paymentOrdersMockRangeStart.add(1, 'month').diff(paymentOrdersMockRangeStart, 'day'),
  1
)

function mockSettlementAttendanceDate(seed: number): string {
  const offset = seed % paymentOrdersMockRangeDayCount
  return paymentOrdersMockRangeStart.add(offset, 'day').format('YYYY-MM-DD')
}

/** @deprecated `getPaymentOrdersDefaultDateRangeParams()` 사용 */
export const PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE = paymentOrdersMockDefaultRange

/** No. 내림차순(큰 번호가 위), 30건 — 기본 필터 기간(당월 1일~익월 1일) 안에 출강일 분산 */
export const mockPaymentOrderAdminProgramList: PaymentOrderAdminProgramRow[] = Array.from(
  { length: 30 },
  (_, i) => {
    const no = 230 - i
    const titleIdx = i % programTitles.length
    const statusIdx = i % statuses.length
    const ref = mockSettlementAttendanceDate(i * 5)
    const d2 = mockSettlementAttendanceDate(i * 5 + 3)
    const d3 = mockSettlementAttendanceDate(i * 5 + 7)
    const pendingCount = i % 13
    const generated: PaymentOrderAdminProgramRow = {
      no,
      programName: programTitles[titleIdx],
      instructorCount: 5 + ((i * 3) % 12),
      processingStatus: statuses[statusIdx],
      estimatedAmount: [2000000, 915000, 15000, 625000, 480000, 1200000][i % 6],
      referenceDate: ref,
      settlementRelevantAttendanceDates: i % 3 === 0 ? [ref] : [ref, d2, d3],
      pendingPaymentSettlementItemCount: pendingCount,
    }
    if (i === 0) {
      return {
        ...generated,
        programName: DESIGN_ELEMENTARY_PROGRAM,
        instructorCount: 15,
        processingStatus: 'partial',
        estimatedAmount: 2000000,
        pendingPaymentSettlementItemCount: 5,
      }
    }
    if (i === 1) {
      return {
        ...generated,
        programName: DESIGN_HSBC_PROGRAM,
        instructorCount: 9,
        processingStatus: 'pending',
        estimatedAmount: 915000,
        pendingPaymentSettlementItemCount: 3,
      }
    }
    if (i === 2) {
      return {
        ...generated,
        processingStatus: 'confirmed',
        estimatedAmount: 625000,
        pendingPaymentSettlementItemCount: 0,
      }
    }
    if (i === 3) {
      return {
        ...generated,
        processingStatus: 'reapplication',
        pendingPaymentSettlementItemCount: 8,
        estimatedAmount: 1200000,
      }
    }
    if (i === 4) {
      return {
        ...generated,
        pendingPaymentSettlementItemCount: 12,
        processingStatus: 'pending',
      }
    }
    return generated
  }
)

/**
 * 강사별 목록 주간 시간 격자용 slot 생성기
 * - i % 4 로 시간대 버킷(오전/오후·길이 상이)을 결정
 * - floor(i / 4) * 30m 만큼 start/end 를 밀어서, 같은 날짜를 공유하는 (i, i+4) 쌍이
 *   자연스럽게 겹치도록 의도(30분 시프트로 겹침 보장 → column 분할 시각 확인용)
 */
function buildInstructorCalendarSlot(i: number): { start: string; end: string } {
  const bucketStartMin = [9 * 60, 13 * 60, 10 * 60, 14 * 60]
  const bucketEndMin = [10 * 60 + 30, 14 * 60 + 30, 11 * 60 + 30, 16 * 60]
  const bucket = i % 4
  const shift = Math.floor(i / 4) * 30
  const startMin = bucketStartMin[bucket] + shift
  const endMin = bucketEndMin[bucket] + shift
  const fmt = (m: number): string => {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    return `${hh}:${mm}`
  }
  return { start: fmt(startMin), end: fmt(endMin) }
}

/** 강사별 목록: 프로그램명과 교차 연결 — 기본 필터 기간 안에 출강일 분산 */
export const mockPaymentOrderAdminInstructorList: PaymentOrderAdminInstructorRow[] =
  instructorNames.map((instructorName, i) => {
    const no = 120 - i
    const statusIdx = i % statuses.length
    const related = [
      programTitles[i % programTitles.length],
      programTitles[(i + 3) % programTitles.length],
    ].filter((v, j, a) => a.indexOf(v) === j)
    const ref = mockSettlementAttendanceDate(i * 4)
    const d2 = mockSettlementAttendanceDate(i * 4 + 4)
    const pendingCount = i === 0 ? 5 : i === 1 ? 2 : i % 13
    const slot = buildInstructorCalendarSlot(i)
    const base: PaymentOrderAdminInstructorRow = {
      no,
      instructorName,
      programCount: i === 0 ? 3 : 1 + (i % 4),
      processingStatus: i === 1 ? 'partial' : statuses[statusIdx],
      estimatedAmount:
        i === 0 ? 2000000 : i === 1 ? 1845000 : [350000, 820000, 45000, 2100000, 590000][i % 5],
      relatedProgramNames: related,
      referenceDate: ref,
      settlementRelevantAttendanceDates: i % 4 === 0 ? [ref] : [ref, d2],
      pendingPaymentSettlementItemCount: pendingCount,
      calendarSlotStartTime: slot.start,
      calendarSlotEndTime: slot.end,
      calendarWeekGridLabel: related[0] ?? instructorName,
    }
    return base
  })

/** 상세 라인 상태(지급조서 확인 구간 + 재신청 + 신청 반려). 계좌 지급 완료는 제외 */
const lineStatuses: PaymentOrderAdminLineProcessingStatus[] = [
  'pending',
  'reapplication',
  'correction',
  'confirmed',
  'application_rejected',
]

const institutionNames = [
  '강서초등학교',
  '대구수성초등학교',
  '진월초등학교',
  '서울중학교',
  '한빛고등학교',
  '대교초등학교',
  '새솔초등학교',
  '동백중학교',
  '미래고등학교',
  '푸른초등학교',
]

/**
 * 산출 내역서 > 강의비 책정 기준
 * - 정산 항목 설정 임금 6건을 순환 노출
 */
const settlementWageStandardTitles =
  settlementItemSettingSections
    .find(section => section.kind === 'wage')
    ?.items.map(item => item.title) ?? ['1급 강사비']

function pickSettlementWageStandardTitle(seed: number): string {
  return settlementWageStandardTitles[seed % settlementWageStandardTitles.length] ?? '1급 강사비'
}

function mixSeed(programNo: number, salt: number): number {
  return Math.abs((programNo * 7919 + salt * 104729) % 100000)
}

/**
 * 목록 집계 행의 출강·기준일과 맞춰 상세 라인 강의일 생성
 * (목록·URL 기간 필터·캘린더와 동일 분기에 두어 진입 시 행이 비지 않도록 함)
 */
function lectureDateFromAggregateAttendance(
  attendanceDates: string[],
  referenceDate: string,
  lineIndex: number,
  salt: number
): string {
  const pool = attendanceDates.length > 0 ? attendanceDates : [referenceDate]
  const baseIso = pool[lineIndex % pool.length]
  const parts = baseIso.split('-').map(Number)
  const y = parts[0]!
  const m = parts[1]!
  const d = parts[2]!
  const jitter = (salt + lineIndex * 5) % 11
  const day = Math.min(28, Math.max(1, d + jitter - 5))
  return isoDate(y, m, day)
}

function buildDesignElementaryProgramLines(
  programRow: PaymentOrderAdminProgramRow,
  n: number
): PaymentOrderAdminProgramDetailInstructorRow[] {
  const lectureDate = lectureDateFromAggregateAttendance(
    programRow.settlementRelevantAttendanceDates,
    programRow.referenceDate,
    0,
    mixSeed(n, 10)
  )
  const specs: Array<{
    instructorName: string
    institutionName: string
    sessionOrdinal: number
    processingStatus: PaymentOrderAdminLineProcessingStatus
    estimatedAmount: number
    processingRejectionReason?: string
  }> = [
    {
      instructorName: '박틴토',
      institutionName: '강서초등학교',
      sessionOrdinal: 3,
      processingStatus: 'pending',
      estimatedAmount: 915000,
    },
    {
      instructorName: '김틴토',
      institutionName: '대구수성초등학교',
      sessionOrdinal: 2,
      processingStatus: 'confirmed',
      estimatedAmount: 300000,
    },
    {
      instructorName: '최틴토',
      institutionName: '강서초등학교',
      sessionOrdinal: 1,
      processingStatus: 'reapplication',
      estimatedAmount: 315000,
    },
    {
      instructorName: '허틴토',
      institutionName: '진월초등학교',
      sessionOrdinal: 2,
      processingStatus: 'correction',
      estimatedAmount: 480000,
    },
    {
      instructorName: '박틴토',
      institutionName: '강서초등학교',
      sessionOrdinal: 3,
      processingStatus: 'application_rejected',
      estimatedAmount: 915000,
      processingRejectionReason: '제출 서류 미비',
    },
    {
      instructorName: '이틴토',
      institutionName: '',
      sessionOrdinal: 1,
      processingStatus: 'pending',
      estimatedAmount: 15000,
    },
  ]
  const count = specs.length
  return specs.map((spec, i) => ({
    id: `po-detail-${n}-design-${i}`,
    no: count - i,
    instructorName: spec.instructorName,
    institutionName: spec.institutionName,
    lectureDate,
    sessionOrdinal: spec.sessionOrdinal,
    processingStatus: spec.processingStatus,
    estimatedAmount: spec.estimatedAmount,
    processingRejectionReason: spec.processingRejectionReason,
  }))
}

/**
 * 프로그램 집계 행 기준으로 지급 현황 상세(기본 정보 + 강사별 정산 목록) mock 생성
 */
export function getMockPaymentOrderProgramDetail(
  programRow: PaymentOrderAdminProgramRow
): PaymentOrderAdminProgramDetail {
  const n = programRow.no
  const sessionTotal = 12 + (mixSeed(n, 1) % 9)
  const sessionCompleted = 1 + (mixSeed(n, 2) % sessionTotal)
  const startDay = 5 + (mixSeed(n, 3) % 10)
  const endDay = 22 + (mixSeed(n, 4) % 9)
  const businessPeriodStart = isoDate(2025, 12, startDay)
  const businessPeriodEnd = isoDate(2026, 12, endDay)

  const rowCount = Math.min(10, Math.max(4, programRow.instructorCount))

  const isDesignElementary = programRow.programName.includes(DESIGN_ELEMENTARY_PROGRAM)

  const instructorRows: PaymentOrderAdminProgramDetailInstructorRow[] = isDesignElementary
    ? buildDesignElementaryProgramLines(programRow, n)
    : Array.from({ length: rowCount }, (_, i) => {
      const salt = mixSeed(n, 10 + i)
      const nameIdx = (n + i) % instructorNames.length
      const instIdx = (n * 3 + i * 7) % institutionNames.length
      const isPersonal = i === rowCount - 1
      return {
        id: `po-detail-${n}-${i}`,
        no: rowCount - i,
        instructorName: instructorNames[nameIdx],
        institutionName: isPersonal ? '' : institutionNames[instIdx],
        lectureDate: lectureDateFromAggregateAttendance(
          programRow.settlementRelevantAttendanceDates,
          programRow.referenceDate,
          i,
          salt
        ),
        sessionOrdinal: 1 + (salt % 8),
        processingStatus: lineStatuses[(n + i) % lineStatuses.length],
        estimatedAmount: [915000, 480000, 120000, 625000, 15000, 350000][(n + i) % 6],
        processingRejectionReason:
          lineStatuses[(n + i) % lineStatuses.length] === 'application_rejected'
            ? '제출 서류 미비'
            : undefined,
      }
    })

  return {
    programNo: programRow.no,
    programName: programRow.programName,
    aggregateProcessingStatus: programRow.processingStatus,
    businessPeriodStart,
    businessPeriodEnd,
    sessionCompleted,
    sessionTotal,
    instructorRows,
  }
}

/**
 * 강사 집계 행 기준으로 지급 현황 상세(기본 정보 + 프로그램별 정산 목록) mock 생성
 */
export function getMockPaymentOrderInstructorDetail(
  instructorRow: PaymentOrderAdminInstructorRow
): PaymentOrderAdminInstructorDetail {
  const n = instructorRow.no
  const nameIdx = instructorNames.indexOf(instructorRow.instructorName)
  const nameEn = nameIdx >= 0 ? instructorNamesEn[nameIdx] : `Instructor ${n}`

  const seedAddr = mixSeed(n, 501)
  const address = `서울특별시 강서구 화곡동 ${12 + (seedAddr % 80)}-${seedAddr % 40}`

  const phone = `010-${String(7000 + (n % 1000)).padStart(4, '0')}-${String(1000 + (n % 9000)).padStart(4, '0')}`
  const email =
    nameIdx >= 0
      ? `${instructorRow.instructorName.toLowerCase().replace(/\s/g, '')}${n % 100}@naver.com`
      : `user${n}@naver.com`

  const bankName = n % 3 === 0 ? '농협' : n % 3 === 1 ? '국민은행' : '신한은행'
  const accountNumber = `301-0${String(n % 10000).padStart(4, '0')}-${String(1000000 + (n % 899999))}`
  const accountHolder = instructorRow.instructorName

  const rowCount = Math.min(10, Math.max(4, instructorRow.programCount + 3))
  const related = instructorRow.relatedProgramNames

  const programRows: PaymentOrderAdminInstructorDetailProgramRow[] = Array.from(
    { length: rowCount },
    (_, i) => {
      const salt = mixSeed(n, 200 + i)
      const programName =
        i < related.length ? related[i] : programTitles[(n + i * 17) % programTitles.length]
      const instIdx = (n * 5 + i * 11) % institutionNames.length
      const lineStatus = lineStatuses[(n + i) % lineStatuses.length]
      return {
        id: `po-inst-detail-${n}-${i}`,
        no: rowCount - i,
        programName,
        institutionName: institutionNames[instIdx],
        lectureDate: lectureDateFromAggregateAttendance(
          instructorRow.settlementRelevantAttendanceDates,
          instructorRow.referenceDate,
          i,
          salt
        ),
        sessionOrdinal: 1 + (salt % 8),
        processingStatus: lineStatus,
        estimatedAmount: [915000, 480000, 120000, 625000, 15000, 350000, 300000][(n + i) % 7],
      }
    }
  )

  return {
    instructorNo: n,
    nameKo: instructorRow.instructorName,
    nameEn,
    address,
    phone,
    email,
    bankName,
    accountNumber,
    accountHolder,
    totalEstimatedAmount: instructorRow.estimatedAmount,
    genderBirthDisplay: mockGenderBirthDisplay(mixSeed(n, 17)),
    scheduleChangeCancelCount:
      instructorRow.instructorName === '박틴토' || mixSeed(n, 7) % 4 === 0 ? 1 : undefined,
    programRows,
  }
}

const KO_DOW_CALC = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatIsoToKoreanWeekday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = KO_DOW_CALC[date.getDay()]
  return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}(${dow})`
}

function splitAddressAfterDongForStatement(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{2,12}동)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const dong = m[1]
  const i = address.indexOf(dong)
  if (i === -1) return null
  const end = i + dong.length
  const tail = address.slice(end).trimStart()
  if (!tail) return null
  return { head: address.slice(0, end), tail }
}

export function addressDisplayForStatementBlur(address: string): {
  addressDisplay: string
  addressBlurredTail?: string
} {
  const split = splitAddressAfterDongForStatement(address)
  if (split) {
    return { addressDisplay: split.head, addressBlurredTail: split.tail }
  }
  const headLen = Math.min(14, address.length)
  const head = address.slice(0, headLen)
  const tail = address.slice(headLen).trimStart()
  if (!tail) {
    return { addressDisplay: head }
  }
  return { addressDisplay: head, addressBlurredTail: tail }
}

function lineStatusToCalculationDisplay(status: PaymentOrderAdminLineProcessingStatus): string {
  return PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[status]
}

/** 프로그램 지급 현황 상세 풀페이지 기본정보와 동일한 사업 기간 표기 */
function formatPaymentOrderBusinessPeriodLabel(startIso: string, endIso: string): string {
  return `${formatIsoToKoreanWeekday(startIso)} ~ ${formatIsoToKoreanWeekday(endIso)}`
}

/**
 * 프로그램 지급 현황 상세 — 강사 행 기준 산출 내역서(산출 내역서 ContentModal) mock
 */
export function getMockPaymentOrderProgramCalculationStatement(
  programRow: PaymentOrderAdminProgramRow,
  instructorLineRow: PaymentOrderAdminProgramDetailInstructorRow,
  programName: string
): PaymentOrderProgramCalculationStatement {
  const n = programRow.no
  const seed =
    mixSeed(n, instructorLineRow.no * 31) +
    mixSeed(instructorLineRow.sessionOrdinal, instructorLineRow.institutionName.length + 17)

  const programDetail = getMockPaymentOrderProgramDetail(programRow)
  const businessPeriodDisplay = formatPaymentOrderBusinessPeriodLabel(
    programDetail.businessPeriodStart,
    programDetail.businessPeriodEnd
  )
  const programSessionProgressDisplay = `${programDetail.sessionCompleted} / ${programDetail.sessionTotal}`

  const lectureFee =
    instructorLineRow.estimatedAmount > 0 ? instructorLineRow.estimatedAmount : 915000
  const lectureFeeAmountLabel = `${lectureFee.toLocaleString('ko-KR')}원`
  const lectureFeeStandardTitle =
    instructorLineRow.instructorName === '박틴토'
      ? '특강 강의비'
      : pickSettlementWageStandardTitle(seed)

  const sessionStart = Math.max(1, instructorLineRow.sessionOrdinal)
  const sessionEnd = sessionStart + 1 + (seed % 2)
  const lectureDateDisplay = formatIsoToKoreanWeekday(instructorLineRow.lectureDate)
  const lectureSessionDisplay = `${sessionStart} ~ ${sessionEnd}차시`

  const isParkTinto = instructorLineRow.instructorName === '박틴토'
  const includeTravel = isParkTinto || seed % 5 !== 0
  const includeLodging = isParkTinto || seed % 7 !== 0
  const includeMeal = isParkTinto ? false : seed % 11 !== 0
  const includeActivity = isParkTinto ? false : seed % 13 !== 0

  const travelBasisDetail = buildTravelBasisDetail(seed)
  const travelAmount = isParkTinto ? 31500 : resolveTravelBasisDetailTotalWon(travelBasisDetail)
  const lodgingBasisDetail = buildLodgingBasisDetail(seed)
  const lodgingAmount = isParkTinto ? 80000 : resolveLodgingBasisDetailTotalWon(lodgingBasisDetail)
  const mealBasisDetail = buildMealBasisDetail()
  const mealAmount = resolveMealBasisDetailTotalWon(mealBasisDetail)
  const activityBasisDetail = buildActivityBasisDetail()
  const activityAmount = resolveActivityBasisDetailTotalWon(activityBasisDetail)
  const lodgingDesc =
    lodgingBasisDetail.layout === 'lodging1s1g' ? '8만원 고정 지급 (1사1교)' : '15만원 고정 지급'
  const travelDesc =
    travelBasisDetail.layout === 'transportInstructor'
      ? `${travelBasisDetail.distanceKm}km 이동 (1사1교)`
      : travelBasisDetail.layout === 'transportRoundTrip'
        ? '참여자 교통비 (왕복)'
        : '참여자 교통비 (편도)'

  const subtotalBeforeTax =
    lectureFee +
    (includeTravel ? travelAmount : 0) +
    (includeLodging ? lodgingAmount : 0) +
    (includeMeal ? mealAmount : 0) +
    (includeActivity ? activityAmount : 0)
  const withholdingBasisDetail = buildWithholdingBasisDetail(subtotalBeforeTax)
  const withholdingAmount = resolveWithholdingBasisDetailAmountWon(withholdingBasisDetail)

  const lectureFeeBasisDetail = buildLectureFeeBasisDetailFromStandardTitle(
    lectureFeeStandardTitle,
    lectureFee,
    sessionStart
  )

  const lines: PaymentOrderCalculationStatementLine[] = [
    {
      id: `calc-line-${instructorLineRow.id}-lecture`,
      itemLabel: '강의비',
      description: lectureFeeLineDescriptionFromStandardTitle(lectureFeeStandardTitle),
      amount: lectureFee,
      kind: 'lecture_fee',
      basisDetail: lectureFeeBasisDetail,
    },
  ]

  if (includeTravel) {
    lines.push({
      id: `calc-line-${instructorLineRow.id}-travel`,
      itemLabel: '교통비',
      description: travelDesc,
      amount: travelAmount,
      kind: 'travel',
      basisDetail: travelBasisDetail,
    })
  }

  if (includeLodging) {
    lines.push({
      id: `calc-line-${instructorLineRow.id}-lodging`,
      itemLabel: '숙박비',
      description: lodgingDesc,
      amount: lodgingAmount,
      kind: 'lodging',
      basisDetail: lodgingBasisDetail,
    })
  }

  if (includeMeal) {
    lines.push({
      id: `calc-line-${instructorLineRow.id}-meal`,
      itemLabel: '식사비',
      description: '3만원 한도 지급',
      amount: mealAmount,
      kind: 'meal',
      basisDetail: mealBasisDetail,
    })
  }

  if (includeActivity) {
    lines.push({
      id: `calc-line-${instructorLineRow.id}-activity`,
      itemLabel: '활동비',
      description: '5만원 한도 지급',
      amount: activityAmount,
      kind: 'activity',
      basisDetail: activityBasisDetail,
    })
  }

  lines.push({
    id: `calc-line-${instructorLineRow.id}-tax`,
    itemLabel: '원천징수',
    description: '원천징수 8.8%',
    amount: withholdingAmount,
    kind: 'withholding',
    basisDetail: withholdingBasisDetail,
    amountDisplayOverride: '-NN,NNN원',
  })

  const formulaParts: string[] = ['강의비']
  if (includeTravel) formulaParts.push('교통비')
  if (includeLodging) formulaParts.push('숙박비')
  if (includeMeal) formulaParts.push('식사비')
  if (includeActivity) formulaParts.push('활동비')
  formulaParts.push('원천징수')
  const formulaLabel =
    formulaParts.length === 2
      ? `${formulaParts[0]} - ${formulaParts[1]}`
      : `${formulaParts.slice(0, -1).join(' + ')} - ${formulaParts[formulaParts.length - 1]}`

  const totalAmount = lines.reduce((s, l) => s + l.amount, 0)

  const block: PaymentOrderCalculationStatementSessionBlock = {
    institutionName: instructorLineRow.institutionName,
    lectureDateDisplay,
    lectureSessionDisplay,
    lines,
  }

  return {
    context: 'program',
    sourceLineRowId: instructorLineRow.id,
    basic: {
      programName,
      instructorNameKo: instructorLineRow.instructorName,
      businessPeriodDisplay,
      programSessionProgressDisplay,
      processingStatusDisplay: lineStatusToCalculationDisplay(instructorLineRow.processingStatus),
      processingStatusClass: instructorLineRow.processingStatus,
      processingRejectionReason:
        instructorLineRow.processingStatus === 'application_rejected'
          ? (instructorLineRow.processingRejectionReason?.trim() || '-')
          : instructorLineRow.processingStatus === 'rejected'
            ? seed % 2 === 0
              ? '인원 초과'
              : '기준 미달'
            : undefined,
      lectureFeeStandardTitle,
      lectureFeeStandardAmount: lectureFeeAmountLabel,
      businessIncomeEarnerLabel: '해당 없음',
      lectureFeePaymentScheduledDateDisplay:
        instructorLineRow.processingStatus === 'confirmed' &&
        instructorLineRow.lectureFeePaymentScheduledDate
          ? formatIsoToKoreanWeekday(instructorLineRow.lectureFeePaymentScheduledDate)
          : undefined,
    },
    blocks: [block],
    formulaLabel,
    totalAmount,
  }
}

function mockGenderBirthDisplay(seed: number): string {
  const gender = seed % 2 === 0 ? '남성' : '여성'
  const year = 1985 + (seed % 15)
  const month = (seed % 12) + 1
  const day = (seed % 28) + 1
  const age = Math.max(20, 2026 - year)
  return `${gender} | ${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')} (만 ${age}세)`
}

/**
 * 강사 지급 현황 상세 — 프로그램 정산 행 기준 산출 내역서(강사 맥락 기본정보)
 */
export function getMockPaymentOrderInstructorCalculationStatement(
  instructorDetail: PaymentOrderAdminInstructorDetail,
  programLineRow: PaymentOrderAdminInstructorDetailProgramRow
): PaymentOrderProgramCalculationStatement {
  const n = instructorDetail.instructorNo
  const seed =
    mixSeed(n, programLineRow.no * 31) +
    mixSeed(programLineRow.sessionOrdinal, programLineRow.institutionName.length + 17)

  const { addressDisplay, addressBlurredTail } = addressDisplayForStatementBlur(
    instructorDetail.address
  )

  const lectureFee = programLineRow.estimatedAmount > 0 ? programLineRow.estimatedAmount : 915000
  const lectureFeeAmountLabel = `${lectureFee.toLocaleString('ko-KR')}원`
  const lectureFeeStandardTitle =
    instructorDetail.nameKo === '박틴토' ? '특강 강의비' : pickSettlementWageStandardTitle(seed)

  const sessionStart = Math.max(1, programLineRow.sessionOrdinal)
  const lectureDateDisplay = formatIsoToKoreanWeekday(programLineRow.lectureDate)
  const lectureSessionDisplay = `${sessionStart}차시`

  const isParkTinto = instructorDetail.nameKo === '박틴토'
  const includeTravel = isParkTinto || seed % 5 !== 0
  const includeLodging = isParkTinto || seed % 7 !== 0
  const includeMeal = isParkTinto ? false : seed % 11 !== 0
  const includeActivity = isParkTinto ? false : seed % 13 !== 0

  const travelBasisDetail = buildTravelBasisDetail(seed)
  const travelAmount = isParkTinto ? 31500 : resolveTravelBasisDetailTotalWon(travelBasisDetail)
  const lodgingBasisDetail = buildLodgingBasisDetail(seed)
  const lodgingAmount = isParkTinto ? 80000 : resolveLodgingBasisDetailTotalWon(lodgingBasisDetail)
  const mealBasisDetail = buildMealBasisDetail()
  const mealAmount = resolveMealBasisDetailTotalWon(mealBasisDetail)
  const activityBasisDetail = buildActivityBasisDetail()
  const activityAmount = resolveActivityBasisDetailTotalWon(activityBasisDetail)
  const lodgingDesc =
    lodgingBasisDetail.layout === 'lodging1s1g' ? '8만원 고정 지급' : '15만원 고정 지급'
  const travelDesc =
    travelBasisDetail.layout === 'transportInstructor'
      ? `${travelBasisDetail.distanceKm}km 이동`
      : travelBasisDetail.layout === 'transportRoundTrip'
        ? '참여자 교통비 (왕복)'
        : '참여자 교통비 (편도)'

  const subtotalBeforeTax =
    lectureFee +
    (includeTravel ? travelAmount : 0) +
    (includeLodging ? lodgingAmount : 0) +
    (includeMeal ? mealAmount : 0) +
    (includeActivity ? activityAmount : 0)
  const withholdingBasisDetail = buildWithholdingBasisDetail(subtotalBeforeTax)
  const withholdingAmount = resolveWithholdingBasisDetailAmountWon(withholdingBasisDetail)

  const lectureFeeBasisDetail = buildLectureFeeBasisDetailFromStandardTitle(
    lectureFeeStandardTitle,
    lectureFee,
    sessionStart
  )

  const lines: PaymentOrderCalculationStatementLine[] = [
    {
      id: `calc-line-${programLineRow.id}-lecture`,
      itemLabel: '강의비',
      description: lectureFeeLineDescriptionFromStandardTitle(lectureFeeStandardTitle),
      amount: lectureFee,
      kind: 'lecture_fee',
      basisDetail: lectureFeeBasisDetail,
    },
  ]

  if (includeTravel) {
    lines.push({
      id: `calc-line-${programLineRow.id}-travel`,
      itemLabel: '교통비',
      description: travelDesc,
      amount: travelAmount,
      kind: 'travel',
      basisDetail: travelBasisDetail,
    })
  }

  if (includeLodging) {
    lines.push({
      id: `calc-line-${programLineRow.id}-lodging`,
      itemLabel: '숙박비',
      description: lodgingDesc,
      amount: lodgingAmount,
      kind: 'lodging',
      basisDetail: lodgingBasisDetail,
    })
  }

  if (includeMeal) {
    lines.push({
      id: `calc-line-${programLineRow.id}-meal`,
      itemLabel: '식사비',
      description: '3만원 한도 지급',
      amount: mealAmount,
      kind: 'meal',
      basisDetail: mealBasisDetail,
    })
  }

  if (includeActivity) {
    lines.push({
      id: `calc-line-${programLineRow.id}-activity`,
      itemLabel: '활동비',
      description: '5만원 한도 지급',
      amount: activityAmount,
      kind: 'activity',
      basisDetail: activityBasisDetail,
    })
  }

  lines.push({
    id: `calc-line-${programLineRow.id}-tax`,
    itemLabel: '원천징수',
    description: '원천징수 8.8%',
    amount: withholdingAmount,
    kind: 'withholding',
    basisDetail: withholdingBasisDetail,
    amountDisplayOverride: '-NN,NNN원',
  })

  const formulaParts: string[] = ['강의비']
  if (includeTravel) formulaParts.push('교통비')
  if (includeLodging) formulaParts.push('숙박비')
  if (includeMeal) formulaParts.push('식사비')
  if (includeActivity) formulaParts.push('활동비')
  formulaParts.push('원천징수')
  const formulaLabel =
    formulaParts.length === 2
      ? `${formulaParts[0]} - ${formulaParts[1]}`
      : `${formulaParts.slice(0, -1).join(' + ')} - ${formulaParts[formulaParts.length - 1]}`

  const totalAmount = lines.reduce((s, l) => s + l.amount, 0)

  const block: PaymentOrderCalculationStatementSessionBlock = {
    institutionName: programLineRow.institutionName,
    lectureDateDisplay,
    lectureSessionDisplay,
    lines,
  }

  const settlementBankPart = [
    instructorDetail.bankName,
    MASKING_POLICY.accountNumber(instructorDetail.accountNumber),
  ]
    .filter(Boolean)
    .join(' ')

  return {
    context: 'instructor',
    sourceLineRowId: programLineRow.id,
    basic: {
      nameKo: instructorDetail.nameKo,
      nameEn: instructorDetail.nameEn,
      phoneDisplay: MASKING_POLICY.phone(instructorDetail.phone),
      emailDisplay: MASKING_POLICY.email(instructorDetail.email),
      addressDisplay,
      addressBlurredTail,
      settlementAccountBankNumberPart: settlementBankPart,
      settlementAccountHolderPart: MASKING_POLICY.accountHolderName(instructorDetail.accountHolder),
      genderBirthDisplay: mockGenderBirthDisplay(seed),
      scheduleChangeCancelCount:
        instructorDetail.nameKo === '박틴토' || seed % 4 === 0 ? 1 : undefined,
      programName: programLineRow.programName,
      processingStatusDisplay: lineStatusToCalculationDisplay(programLineRow.processingStatus),
      processingStatusClass: programLineRow.processingStatus,
      processingRejectionReason:
        programLineRow.processingStatus === 'application_rejected'
          ? (programLineRow.processingRejectionReason?.trim() || '-')
          : programLineRow.processingStatus === 'rejected'
            ? seed % 2 === 0
              ? '인원 초과'
              : '기준 미달'
            : undefined,
      lectureFeeStandardTitle,
      lectureFeeStandardAmount: lectureFeeAmountLabel,
      businessIncomeEarnerLabel: '해당 없음',
      lectureFeePaymentScheduledDateDisplay:
        programLineRow.processingStatus === 'confirmed' &&
        programLineRow.lectureFeePaymentScheduledDate
          ? formatIsoToKoreanWeekday(programLineRow.lectureFeePaymentScheduledDate)
          : undefined,
    },
    blocks: [block],
    formulaLabel,
    totalAmount,
  }
}

/**
 * 프로그램 지급 현황 상세 — 「신청자별 정산 목록」행 → 신청자형 산출 내역서
 */
export function getMockPaymentOrderCalculationStatementFromProgramDetailPage(
  _programRow: PaymentOrderAdminProgramRow,
  programDetail: PaymentOrderAdminProgramDetail,
  lineRow: PaymentOrderAdminProgramDetailInstructorRow
): PaymentOrderProgramCalculationStatement {
  const instructorRow =
    mockPaymentOrderAdminInstructorList.find(r => r.instructorName === lineRow.instructorName) ?? {
      no: lineRow.no,
      instructorName: lineRow.instructorName,
      programCount: 1,
      processingStatus: 'pending',
      estimatedAmount: lineRow.estimatedAmount,
      relatedProgramNames: [programDetail.programName],
      referenceDate: lineRow.lectureDate,
      settlementRelevantAttendanceDates: [lineRow.lectureDate],
      pendingPaymentSettlementItemCount: 0,
    }

  const programLineRow: PaymentOrderAdminInstructorDetailProgramRow = {
    id: lineRow.id,
    no: lineRow.no,
    settlementId: lineRow.settlementId,
    statementId: lineRow.statementId,
    programName: programDetail.programName,
    institutionName: lineRow.institutionName,
    lectureDate: lineRow.lectureDate,
    sessionOrdinal: lineRow.sessionOrdinal,
    processingStatus: lineRow.processingStatus,
    estimatedAmount: lineRow.estimatedAmount,
    lectureFeePaymentScheduledDate: lineRow.lectureFeePaymentScheduledDate,
    processingRejectionReason: lineRow.processingRejectionReason,
  }

  return getMockPaymentOrderInstructorCalculationStatement(
    getMockPaymentOrderInstructorDetail(instructorRow),
    programLineRow
  )
}

/**
 * 신청자 지급 현황 상세 — 「프로그램별 정산 목록」행 → 프로그램형 산출 내역서
 */
export function getMockPaymentOrderCalculationStatementFromInstructorDetailPage(
  instructorRow: PaymentOrderAdminInstructorRow,
  instructorDetail: PaymentOrderAdminInstructorDetail,
  programLineRow: PaymentOrderAdminInstructorDetailProgramRow
): PaymentOrderProgramCalculationStatement {
  const programRow = mockPaymentOrderAdminProgramList.find(
    p => p.programName === programLineRow.programName
  ) ?? {
    no: instructorRow.no + 500,
    programName: programLineRow.programName,
    instructorCount: instructorRow.programCount,
    processingStatus: instructorRow.processingStatus,
    estimatedAmount: instructorRow.estimatedAmount,
    referenceDate: instructorRow.referenceDate,
    settlementRelevantAttendanceDates: instructorRow.settlementRelevantAttendanceDates,
    pendingPaymentSettlementItemCount: instructorRow.pendingPaymentSettlementItemCount,
  }

  const programDetailLine: PaymentOrderAdminProgramDetailInstructorRow = {
    id: programLineRow.id,
    no: programLineRow.no,
    settlementId: programLineRow.settlementId,
    statementId: programLineRow.statementId,
    instructorName: instructorDetail.nameKo,
    institutionName: programLineRow.institutionName,
    lectureDate: programLineRow.lectureDate,
    sessionOrdinal: programLineRow.sessionOrdinal,
    processingStatus: programLineRow.processingStatus,
    estimatedAmount: programLineRow.estimatedAmount,
    lectureFeePaymentScheduledDate: programLineRow.lectureFeePaymentScheduledDate,
    processingRejectionReason: programLineRow.processingRejectionReason,
  }

  return getMockPaymentOrderProgramCalculationStatement(
    programRow,
    programDetailLine,
    programLineRow.programName
  )
}
