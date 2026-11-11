import type { EducationSettlementStatus } from '../model/types.ts'
import type { SettlementAmountKind } from './settlement-rules.ts'

export type SettlementDocumentKind = 'receipt' | 'payment_statement'

export type SettlementStatusAction = 'write' | 'view' | 'reject-reason' | 'reapply' | 'view-correction'

export type SettlementStatusUiConfig = {
  message?: string
  markLabel?: string
  markTone?: 'success' | 'alert' | 'neutral'
  statusLabel?: string
  statusTone?: 'submitted' | 'unsubmitted'
  guideVariant?: 'default' | 'submitted' | 'feedback'
  cardTone?: 'default' | 'danger'
  amountKind?: SettlementAmountKind
  actionHint?: string
  writeDisabled?: boolean
  writeLabel?: string
  viewLabel?: string
  actions?: SettlementStatusAction[]
}

type SettlementCopy = {
  submitMessage: string
  overdueMessage: string
  overdueMark: string
  upcomingHint: string
  reportHint: string
  writeLabel: string
  viewLabel: string
  waitingMessage: string
  reappliedMessage: string
}

const RECEIPT_COPY: SettlementCopy = {
  submitMessage: '기한 내에 영수증을 제출해 주세요',
  overdueMessage: '미제출 영수증 제출 기한이 지났어요',
  overdueMark: '영수증 미제출',
  upcomingHint: '교육 진행 완료 이후에 영수증 작성이 가능합니다',
  reportHint: '강의보고서 작성 이후에 영수증 작성이 가능합니다',
  writeLabel: '영수증 작성하기',
  viewLabel: '영수증 확인하기',
  waitingMessage: '영수증 신청이 완료되었어요',
  reappliedMessage: '영수증 수정 제출이 완료되었어요',
}

const PAYMENT_STATEMENT_COPY: SettlementCopy = {
  submitMessage: '기한 내에 지급조서를 제출해 주세요',
  overdueMessage: '지급조서 제출 기한이 지났어요',
  overdueMark: '지급조서 미제출',
  upcomingHint: '강의보고서 작성 이후에 지급조서 작성이 가능합니다',
  reportHint: '강의보고서 작성 이후에 지급조서 작성이 가능합니다',
  writeLabel: '지급조서 작성하기',
  viewLabel: '지급조서 확인하기',
  waitingMessage: '지급조서 신청이 완료되었어요',
  reappliedMessage: '지급조서 재신청이 완료되었어요',
}

export const PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE =
  '프로그램 운영이 종료되어 지급조서를 제출할 수 없어요'

export function resolveSettlementDocumentKind(
  applicationType: string | null | undefined,
): SettlementDocumentKind {
  return applicationType === 'INSTRUCTOR' ? 'payment_statement' : 'receipt'
}

function copyFor(kind: SettlementDocumentKind): SettlementCopy {
  return kind === 'payment_statement' ? PAYMENT_STATEMENT_COPY : RECEIPT_COPY
}

export function resolveSettlementStatusUi(
  status: EducationSettlementStatus,
  kind: SettlementDocumentKind = 'receipt',
): SettlementStatusUiConfig {
  const copy = copyFor(kind)
  const configs: Record<EducationSettlementStatus, SettlementStatusUiConfig> = {
    report_pending: {
      message: copy.submitMessage,
      actionHint: copy.reportHint,
      writeDisabled: true,
      writeLabel: copy.writeLabel,
      actions: ['write'],
    },
    pending_submit: {
      message: copy.submitMessage,
      writeLabel: copy.writeLabel,
      actions: ['write'],
    },
    overdue: {
      message: copy.overdueMessage,
      markLabel: copy.overdueMark,
      markTone: 'alert',
      cardTone: kind === 'payment_statement' ? 'danger' : undefined,
      writeDisabled: kind === 'payment_statement' ? undefined : true,
      writeLabel: copy.writeLabel,
      actions: ['write'],
    },
    waiting_confirm: {
      message: copy.waitingMessage,
      markLabel: '확인 대기',
      markTone: 'neutral',
      statusLabel: '제출 완료',
      statusTone: 'submitted',
      guideVariant: 'submitted',
      amountKind: 'expected',
      viewLabel: copy.viewLabel,
      actions: ['view'],
    },
    reapplied: {
      message: copy.reappliedMessage,
      markLabel: '재신청',
      markTone: 'neutral',
      statusLabel: '제출 완료',
      statusTone: 'submitted',
      guideVariant: 'submitted',
      amountKind: 'expected',
      viewLabel: copy.viewLabel,
      actions: ['view'],
    },
    confirmed: {
      message: '담당자 확인이 완료되어 계좌 지급 예정이에요',
      markLabel: '확인 완료',
      markTone: 'success',
      amountKind: 'expected',
      viewLabel: copy.viewLabel,
      actions: ['view'],
    },
    paid: {
      message: '계좌 지급이 완료되었어요',
      markLabel: '지급 완료',
      markTone: 'success',
      amountKind: 'completed',
      viewLabel: copy.viewLabel,
      actions: ['view'],
    },
    correction_requested: {
      message: '지급조서 정정 요청이 완료되었어요',
      markLabel: kind === 'payment_statement' ? '정정 요청' : '지급 정정 요청',
      markTone: 'alert',
      statusLabel: kind === 'payment_statement' ? '제출 완료' : undefined,
      statusTone: kind === 'payment_statement' ? 'submitted' : undefined,
      guideVariant: kind === 'payment_statement' ? 'submitted' : undefined,
      amountKind: 'expected',
      actionHint: '정정 요청이 처리될 때까지 기다려 주세요',
      viewLabel: copy.viewLabel,
      actions: kind === 'payment_statement' ? ['view'] : [],
    },
    correction_completed: {
      message: '정정된 내역으로 재신청이 가능해요',
      markLabel: kind === 'payment_statement' ? '정정 요청' : '지급 정정 요청',
      markTone: 'neutral',
      statusLabel: kind === 'payment_statement' ? '정정 완료' : undefined,
      amountKind: 'expected',
      writeLabel: kind === 'payment_statement' ? '지급조서 재신청' : copy.writeLabel,
      viewLabel: '정정 내역 확인하기',
      actions: kind === 'payment_statement' ? ['view-correction', 'reapply'] : [],
    },
    rejected: {
      message: kind === 'payment_statement' ? '지급조서 신청이 반려되었어요' : '영수증 신청이 반려되었어요',
      markLabel: '신청 반려',
      markTone: 'alert',
      amountKind: 'expected',
      cardTone: kind === 'receipt' ? undefined : 'danger',
      guideVariant: kind === 'receipt' ? 'feedback' : undefined,
      writeLabel: kind === 'payment_statement' ? '지급조서 재신청' : '영수증 재신청',
      viewLabel: copy.viewLabel,
      actions: ['reject-reason', 'reapply'],
    },
    upcoming:
      kind === 'payment_statement'
        ? {}
        : {
            message: copy.submitMessage,
            actionHint: copy.upcomingHint,
            writeDisabled: true,
            writeLabel: copy.writeLabel,
            actions: ['write'],
          },
    unresolved: {},
  }
  return configs[status]
}

/** 일반회원(영수증) 기본 카피 — 테스트·하위 호환 */
export const EDUCATION_SETTLEMENT_STATUS_UI: Record<
  EducationSettlementStatus,
  SettlementStatusUiConfig
> = {
  report_pending: resolveSettlementStatusUi('report_pending', 'receipt'),
  pending_submit: resolveSettlementStatusUi('pending_submit', 'receipt'),
  overdue: resolveSettlementStatusUi('overdue', 'receipt'),
  waiting_confirm: resolveSettlementStatusUi('waiting_confirm', 'receipt'),
  reapplied: resolveSettlementStatusUi('reapplied', 'receipt'),
  confirmed: resolveSettlementStatusUi('confirmed', 'receipt'),
  paid: resolveSettlementStatusUi('paid', 'receipt'),
  rejected: resolveSettlementStatusUi('rejected', 'receipt'),
  correction_requested: resolveSettlementStatusUi('correction_requested', 'receipt'),
  correction_completed: resolveSettlementStatusUi('correction_completed', 'receipt'),
  upcoming: resolveSettlementStatusUi('upcoming', 'receipt'),
  unresolved: resolveSettlementStatusUi('unresolved', 'receipt'),
}

export function readProgramOperationEndAt(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === '1970-01-01' || trimmed.startsWith('1970-01-01')) return undefined
  return trimmed
}

export function isSettlementDeadlinePassed(deadlineAt: string | undefined, now = new Date()): boolean {
  if (!deadlineAt?.trim()) return false
  const due = new Date(deadlineAt)
  if (Number.isNaN(due.getTime())) return false
  return now.getTime() > due.getTime()
}

/** 영수증 작성 CTA. 지급항목 미확인(undefined)은 막지 않는다. 명시적 없음·적격 아님만 비활성. */
export function isSettlementWriteCtaDisabled(input: {
  documentKind: SettlementDocumentKind
  writeDisabledByStatus?: boolean
  hasPayableItems?: boolean
  eligible?: boolean
  evidencePolicyUnconfigured?: boolean
  canSubmit?: boolean
  status?: EducationSettlementStatus
}): boolean {
  if (input.writeDisabledByStatus === true) return true
  if (input.documentKind === 'payment_statement') {
    if (input.status === 'overdue' && input.canSubmit === false) return true
    return false
  }
  if (input.documentKind !== 'receipt') return false
  if (input.hasPayableItems === false) return true
  if (input.evidencePolicyUnconfigured === true) return true
  if (input.eligible === false && input.status !== 'rejected') return true
  if (input.status === 'pending_submit' && input.canSubmit === false) return true
  return false
}
