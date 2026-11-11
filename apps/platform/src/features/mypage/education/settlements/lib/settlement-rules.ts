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

const IN_REVIEW_STATUSES: readonly EducationSettlementStatus[] = ['waiting_confirm', 'reapplied']

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
  if (items.some(item => IN_REVIEW_STATUSES.includes(item.status))) {
    return '확인진행중'
  }
  const unwritten = countUnwrittenSettlements(items)
  if (unwritten > 0) return `미작성 ${unwritten}건`
  if (items.some(item => item.status === 'rejected')) return '신청 반려'
  const actionable = items.filter(
    item => item.status !== 'upcoming' && item.status !== 'unresolved',
  )
  if (actionable.length > 0 && actionable.every(item => item.status === 'paid')) {
    return '지급 완료'
  }
  if (items.some(item => item.status === 'confirmed' || item.status === 'paid')) {
    return '확인 완료'
  }
  return '확인진행중'
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
  operationEndAt?: string | null
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
    if (input.lectureReportSubmitted === false) return { status: 'report_pending' }
    if (isTimestampPassed(input.operationEndAt, now)) {
      return { status: 'overdue', deadlineNotice: 'operation_ended' }
    }
    if (isTimestampPassed(input.receiptDeadlineAt, now)) {
      return { status: 'overdue', deadlineNotice: 'overdue' }
    }
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
