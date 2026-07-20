import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { PaymentOrderCalculationStatementLine } from '@/data/mock/payment-order-admin-list'
import {
  isInstructorSettlementEligibleForPaymentStatementIssue,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import {
  LECTURE_FEE_CALCULATION_LINES_SAMPLE,
  type PaymentStatementCalculationLinesViewModel,
} from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { LECTURE_FEE_CALCULATION_SAMPLE_VALUES } from '@/features/template/model/lecture-fee-calculation-sample'
import { PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE = '지급조서'

export interface ParticipatingInstructorPaymentStatementSettlementContext {
  id: string
  schoolName: string
  educationScheduleLabel: string
  scheduledSettlementAmount: number | null
}

export interface PaymentStatementIssuancePreviewContext {
  instructor: ParticipatingInstructorRow
  settlementRow: ParticipatingInstructorPaymentStatementSettlementContext
}

export function buildPaymentStatementIssuancePreviewContext(
  instructor: ParticipatingInstructorRow,
  settlementRow: ParticipatingInstructorPaymentStatementSettlementContext
): PaymentStatementIssuancePreviewContext {
  return { instructor, settlementRow }
}

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim()
}

export function buildPaymentStatementIssuancePreviewFileName(
  context: PaymentStatementIssuancePreviewContext
): string {
  const sessionMatch = context.settlementRow.educationScheduleLabel.match(/\|\s*(\d+)회차/)
  const sessionPart = sessionMatch ? `${sessionMatch[1]}회차` : '정산'
  return [
    PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE,
    sanitizeFileNamePart(context.settlementRow.schoolName),
    sanitizeFileNamePart(context.instructor.instructorName),
    sanitizeFileNamePart(sessionPart),
  ].join('_')
}

/** 지급조서 일괄 다운로드 대상 — 지급조서 확인 완료·계좌 지급 완료 */
export function isParticipatingInstructorSettlementEligibleForPaymentStatementDownload(row: {
  lectureProgressLabel: '진행 완료' | '진행 예정'
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
}): boolean {
  return (
    row.lectureProgressLabel === '진행 완료' &&
    row.hasPaymentStatementApplication &&
    isInstructorSettlementEligibleForPaymentStatementIssue(row.paymentStatementStatus)
  )
}

function parseEducationScheduleParts(label: string): {
  lectureDateDisplay: string
  lectureSessionDisplay: string
} {
  const trimmed = label.trim()
  const pipeIdx = trimmed.indexOf('|')
  const dateTimePart = (pipeIdx >= 0 ? trimmed.slice(0, pipeIdx) : trimmed).trim()
  const sessionPart = pipeIdx >= 0 ? trimmed.slice(pipeIdx + 1).trim() : ''
  return {
    lectureDateDisplay: dateTimePart || '-',
    lectureSessionDisplay: sessionPart || '-',
  }
}

function buildCalculationLines(
  row: ParticipatingInstructorPaymentStatementSettlementContext
): PaymentStatementCalculationLinesViewModel {
  const lectureFee =
    row.scheduledSettlementAmount != null
      ? Math.round(row.scheduledSettlementAmount / (1 - 0.088))
      : (LECTURE_FEE_CALCULATION_LINES_SAMPLE.blocks[0]?.lines.find(l => l.kind === 'lecture_fee')
          ?.amount ?? 240_000)
  const withholdingAmount = -Math.round(lectureFee * 0.088)
  const totalAmount = lectureFee + withholdingAmount

  const { lectureDateDisplay, lectureSessionDisplay } = parseEducationScheduleParts(
    row.educationScheduleLabel
  )

  const lines: PaymentOrderCalculationStatementLine[] = [
    {
      id: `pi-payment-statement-${row.id}-lecture`,
      itemLabel: '강사비',
      description: '프로그램 1회 강의비',
      amount: lectureFee,
      kind: 'lecture_fee',
    },
    {
      id: `pi-payment-statement-${row.id}-withholding`,
      itemLabel: '원천징수',
      description: '원천징수 8.8%',
      amount: withholdingAmount,
      kind: 'withholding',
    },
  ]

  return {
    blocks: [
      {
        institutionName: row.schoolName,
        lectureDateDisplay,
        lectureSessionDisplay,
        lines,
      },
    ],
    formulaLabel: '강의비 - 원천징수',
    totalAmount: row.scheduledSettlementAmount ?? totalAmount,
  }
}

function buildBasicInfoValues(
  instructor: ParticipatingInstructorRow
): Partial<PaymentStatementBasicInfoAutofillValues> {
  const sample = PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES
  return {
    nameKo: instructor.instructorName || sample.nameKo,
    nameEn: instructor.nameEnglish?.trim() || sample.nameEn,
    addressRoad: instructor.address?.trim() || instructor.region?.trim() || sample.addressRoad,
    addressDetail: sample.addressDetail,
    bankName: sample.bankName,
    accountNumber: instructor.accountNumber?.trim() || sample.accountNumber,
    accountHolder: instructor.accountHolder?.trim() || instructor.instructorName || sample.accountHolder,
    paymentPurpose: sample.paymentPurpose,
    affiliation: sample.affiliation,
    noAffiliation: sample.noAffiliation,
    residentFront: sample.residentFront,
    residentBack: sample.residentBack,
  }
}

/** 참여 강사 정산 — 지급조서(발급용) 미리보기 본문 옵션 */
export function buildParticipatingInstructorPaymentStatementViewOptions(
  instructor: ParticipatingInstructorRow,
  settlementRow: ParticipatingInstructorPaymentStatementSettlementContext
): RenderFormParagraphBodyOptions {
  return {
    paymentStatementBasicInfoValues: buildBasicInfoValues(instructor),
    lectureFeeCalculationValues: LECTURE_FEE_CALCULATION_SAMPLE_VALUES,
    paymentStatementCalculationLines: buildCalculationLines(settlementRow),
    paymentStatementDisplayMode: 'document',
  }
}
