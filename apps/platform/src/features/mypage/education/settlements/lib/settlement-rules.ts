import type {
  EducationSettlementItem,
  EducationSettlementProgress,
  EducationSettlementStatus,
  SettlementDeadlineNotice,
} from '../model/types.ts'
import { resolveEducationScheduleProgressStatus } from '../../schedules/lib/schedule-rules.ts'
import type { EducationScheduleItem } from '../../schedules/model/types.ts'
import {
  mapPaymentStatementServerStatus,
  resolveGeminiPaymentStatementAggregateLabel,
  resolveInstructorPaymentStatementAggregateLabel,
} from './payment-statement-status.ts'

export const EDUCATION_SETTLEMENT_PROGRESS_LABEL = {
  completed: '진행 완료',
  upcoming: '진행 예정',
} as const

export type SettlementAmountKind = 'expected' | 'completed'

const UNWRITTEN_STATUSES: readonly EducationSettlementStatus[] = [
  'report_pending',
  'pending_submit',
  'overdue',
]

const CANCELLED_ASSIGNMENT = new Set(['CANCELLED', 'CANCELED', 'UNASSIGNED'])
const CANCELLED_SCHEDULE = new Set(['CANCELLED', 'CANCELED'])
const COMPLETED_SCHEDULE = new Set(['COMPLETED', 'DONE', 'HELD', 'FINISHED'])
const ASSIGNED_ASSIGNMENT = new Set(['ASSIGNED', 'CONFIRMED', 'COMPLETED'])

const PAID_STATUSES = new Set(['PAID'])
const CONFIRMED_STATUSES = new Set(['CONFIRMED', 'APPROVED'])
const REAPPLIED_STATUSES = new Set(['REAPPLICATION', 'RESUBMITTED', 'REAPPLIED'])
const WAITING_STATUSES = new Set(['WAITING_CONFIRM', 'REQUESTED', 'ISSUED', 'SUBMITTED'])
const REJECTED_STATUSES = new Set(['REJECTED'])
const OVERDUE_STATUSES = new Set(['OVERDUE'])
const REPORT_PENDING_STATUSES = new Set(['REPORT_PENDING', 'LECTURE_REPORT_REQUIRED'])
const UNSUBMITTED_STATUSES = new Set(['', 'DRAFT', 'NOT_SUBMITTED', 'WAITING', 'PENDING'])

export function countUnwrittenSettlements(items: readonly EducationSettlementItem[]): number {
  return items.filter(item => UNWRITTEN_STATUSES.includes(item.status)).length
}

export function countCompletedSettlementSessions(
  items: readonly EducationSettlementItem[],
): number {
  return items.filter(item => item.progress === 'completed').length
}

export function resolvePaymentStatementProcessLabel(
  items: readonly EducationSettlementItem[],
  options?: { variant?: 'receipt' | 'payment_statement' | 'gemini' },
): string {
  if (options?.variant === 'gemini') {
    return resolveGeminiPaymentStatementAggregateLabel(items)
  }
  if (options?.variant === 'payment_statement') {
    return resolveInstructorPaymentStatementAggregateLabel(items)
  }
  return resolveReceiptProcessLabel(items)
}

/** 개인·봉사자 영수증 처리 현황 라벨 (R17) */
export const RECEIPT_PROCESS_LABEL = {
  reapplied: '영수증 재신청',
  waiting_confirm: '확인 대기',
  confirmed: '확인 완료',
  paid: '계좌 지급 완료',
  rejected: '신청 반려',
  mixed: '확인 진행 중',
} as const

/**
 * 영수증 처리 현황 — 강사식 집계 (R17): 제출된 회차의 상태가 한 가지면 그 라벨, 여러 가지면 "확인 진행 중".
 * "미작성 N건"은 쓰지 않는다. 제출된 회차가 없을 때도 "확인 진행 중"(기존 기본값 유지).
 */
export function resolveReceiptProcessLabel(items: readonly EducationSettlementItem[]): string {
  const labels = items
    .map((item): string | null =>
      item.status === 'reapplied' ||
      item.status === 'waiting_confirm' ||
      item.status === 'confirmed' ||
      item.status === 'paid' ||
      item.status === 'rejected'
        ? RECEIPT_PROCESS_LABEL[item.status]
        : null,
    )
    .filter((label): label is string => label != null)
  const unique = new Set(labels)
  if (unique.size === 1) return labels[0]!
  return RECEIPT_PROCESS_LABEL.mixed
}

export function isAssignedEducationScheduleForSettlement(
  item: Pick<EducationScheduleItem, 'assignmentStatus' | 'scheduleStatus' | 'scheduleId'>,
  scopeStatus: string | null | undefined,
): boolean {
  const assignment = (item.assignmentStatus ?? '').trim().toUpperCase()
  const scheduleStatus = (item.scheduleStatus ?? '').trim().toUpperCase()
  if (CANCELLED_SCHEDULE.has(scheduleStatus) || CANCELLED_ASSIGNMENT.has(assignment)) {
    return false
  }

  switch ((scopeStatus ?? '').trim().toUpperCase()) {
    case 'ASSIGNMENT_SCOPED':
      return true
    case 'RECORDED_ONLY':
      return item.scheduleId != null
    case 'PROGRAM_SCHEDULE':
    case 'NO_SCOPE_EVIDENCE':
      return false
    default:
      return ASSIGNED_ASSIGNMENT.has(assignment)
  }
}

export function compareAssignedSettlementSchedules(
  left: Pick<EducationScheduleItem, 'heldAt' | 'sessionNumber'>,
  right: Pick<EducationScheduleItem, 'heldAt' | 'sessionNumber'>,
): number {
  const leftTime = Date.parse(left.heldAt)
  const rightTime = Date.parse(right.heldAt)
  const leftSafe = Number.isNaN(leftTime) ? Number.POSITIVE_INFINITY : leftTime
  const rightSafe = Number.isNaN(rightTime) ? Number.POSITIVE_INFINITY : rightTime
  if (leftSafe !== rightSafe) return leftSafe - rightSafe
  return left.sessionNumber - right.sessionNumber
}

/**
 * 정산 카드 진행 뱃지.
 * 출결 → API `scheduleStatus` → 종료 시각(`endAt`, 지나면 완료) → 종료 시각이 없을 때만 교육일(일 단위) 순.
 */
export function resolveSettlementEducationProgress(
  item: Pick<EducationScheduleItem, 'heldAt' | 'endAt' | 'attendanceStatus' | 'scheduleStatus'>,
  now = new Date(),
): EducationSettlementProgress {
  if (item.attendanceStatus != null) return 'completed'
  const scheduleStatus = (item.scheduleStatus ?? '').trim().toUpperCase()
  if (COMPLETED_SCHEDULE.has(scheduleStatus)) return 'completed'
  const endAt = item.endAt?.trim() ? Date.parse(item.endAt) : Number.NaN
  if (Number.isFinite(endAt)) return endAt <= now.getTime() ? 'completed' : 'upcoming'
  return resolveEducationScheduleProgressStatus(item.heldAt, now) === 'completed'
    ? 'completed'
    : 'upcoming'
}

function normalizeStatus(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

export type SettlementDeadlinePolicy = 'receipt' | 'payment_statement'

export type ResolveEducationSettlementStatusInput = {
  educationProgress: EducationSettlementProgress
  reviewStatus?: string | null
  statementStatus?: string | null
  paymentStatus?: string | null
  correctionStatus?: string | null
  /** 정정 승인 후 지급조서 재신청 대기 — 서버 statementReapplyAvailable */
  statementReapplyAvailable?: boolean | null
  receiptDeadlineAt?: string | null
  /** 강사 지급조서: 제출 마감일(운영 기간 종료일). 영수증: 사업 운영 종료일 */
  operationEndAt?: string | null
  /**
   * 강사 지급조서 사업 운영 종료일. 있으면 operationEndAt은 제출 마감일로만 보고,
   * 운영 종료(제출 불가)는 이 값으로 판단한다. 없으면 operationEndAt을 운영 종료로 본다(기존 동작).
   */
  businessEndAt?: string | null
  canSubmit?: boolean
  deadlinePolicy?: SettlementDeadlinePolicy
  isResubmitted?: boolean
  hasSubmission?: boolean
  /**
   * 강의보고서 제출 여부.
   * `null`/`undefined`이면 강의보고서 상태를 모른다 — report_pending을 만들지 않는다.
   */
  lectureReportSubmitted?: boolean | null
  now?: Date
}

export type ResolveEducationSettlementStatusResult = {
  status: EducationSettlementStatus
  deadlineNotice?: SettlementDeadlineNotice
}

function isTimestampPassed(value: string | null | undefined, now: Date): boolean {
  const trimmed = value?.trim()
  if (!trimmed) return false
  const due = new Date(trimmed)
  return !Number.isNaN(due.getTime()) && now.getTime() > due.getTime()
}

export function resolveEducationSettlementStatus(
  input: ResolveEducationSettlementStatusInput,
): EducationSettlementStatus {
  return resolveEducationSettlementStatusResult(input).status
}

export function resolveEducationSettlementStatusResult(
  input: ResolveEducationSettlementStatusInput,
): ResolveEducationSettlementStatusResult {
  if (input.educationProgress === 'upcoming') return { status: 'upcoming' }

  const now = input.now ?? new Date()
  const payment = normalizeStatus(input.paymentStatus)
  const review = normalizeStatus(input.reviewStatus)
  const mapped = mapPaymentStatementServerStatus({
    statementStatus: input.statementStatus ?? input.reviewStatus,
    paymentStatus: input.paymentStatus,
    correctionStatus: input.correctionStatus,
    statementReapplyAvailable: input.statementReapplyAvailable,
  })

  if (input.deadlinePolicy === 'payment_statement') {
    if (mapped) return { status: mapped }
    if (input.hasSubmission === true) return { status: 'unresolved' }
    const hasBusinessEnd = Boolean(input.businessEndAt?.trim())
    const operationEnded = hasBusinessEnd
      ? isTimestampPassed(input.businessEndAt, now)
      : isTimestampPassed(input.operationEndAt, now)
    // 제출 마감 = 회차 settlementSubmitDeadlineAt(K20). 없을 때만 운영 기간 종료일로 대체
    const submitDeadline = input.receiptDeadlineAt?.trim()
      ? input.receiptDeadlineAt
      : hasBusinessEnd
        ? input.operationEndAt
        : null
    const deadlinePassed = isTimestampPassed(submitDeadline, now)
    // 운영 종료가 가장 우선, 그다음 강의보고서 미작성(마감 후면 마감 안내를 함께), 그다음 마감
    if (operationEnded) {
      return {
        status: input.lectureReportSubmitted === false ? 'report_pending' : 'overdue',
        deadlineNotice: 'operation_ended',
      }
    }
    if (input.lectureReportSubmitted === false) {
      return deadlinePassed
        ? { status: 'report_pending', deadlineNotice: 'overdue' }
        : { status: 'report_pending' }
    }
    if (deadlinePassed) return { status: 'overdue', deadlineNotice: 'overdue' }
    return { status: 'pending_submit' }
  }

  if (PAID_STATUSES.has(payment) || PAID_STATUSES.has(review)) return { status: 'paid' }
  if (REJECTED_STATUSES.has(review)) return { status: 'rejected' }
  if (REPORT_PENDING_STATUSES.has(review)) return { status: 'report_pending' }
  if (CONFIRMED_STATUSES.has(review) || payment === 'WAITING_PAYMENT') return { status: 'confirmed' }
  if (input.isResubmitted === true || REAPPLIED_STATUSES.has(review)) return { status: 'reapplied' }
  if (WAITING_STATUSES.has(review)) return { status: 'waiting_confirm' }
  if (input.hasSubmission === true) return { status: 'unresolved' }
  if (review && !UNSUBMITTED_STATUSES.has(review) && !OVERDUE_STATUSES.has(review)) {
    return { status: 'unresolved' }
  }
  if (OVERDUE_STATUSES.has(review)) return { status: 'overdue', deadlineNotice: 'overdue' }

  if (isTimestampPassed(input.receiptDeadlineAt, now)) {
    return { status: 'overdue', deadlineNotice: 'overdue' }
  }
  return { status: 'pending_submit' }
}

/** 강사 지급조서: 사업 운영 종료일이 지났는지 */
export function isPaymentStatementOperationEnded(
  businessEndAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return isTimestampPassed(businessEndAt, now)
}

export function canSubmitFromAvailableActions(
  actions: readonly string[] | undefined,
): boolean | undefined {
  if (!actions || actions.length === 0) return undefined
  return actions.some(action => {
    const normalized = action.trim().toUpperCase()
    return (
      normalized === 'SUBMIT' ||
      normalized === 'RESUBMIT' ||
      normalized === 'WRITE' ||
      normalized === 'SUBMIT_RECEIPT' ||
      normalized === 'CREATE'
    )
  })
}
