import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { PaymentOrderCalculationStatementLine } from '@/data/mock/payment-order-admin-list'
import {
  isInstructorSettlementEligibleForPaymentStatementIssue,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'
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

function presentText(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '–') return ''
  return trimmed
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
  const { lectureDateDisplay, lectureSessionDisplay } = parseEducationScheduleParts(
    row.educationScheduleLabel
  )

  if (row.scheduledSettlementAmount == null) {
    return {
      blocks: [
        {
          institutionName: presentText(row.schoolName) || '-',
          lectureDateDisplay,
          lectureSessionDisplay,
          lines: [],
        },
      ],
      formulaLabel: '',
      totalAmount: 0,
    }
  }

  const lectureFee = Math.round(row.scheduledSettlementAmount / (1 - 0.088))
  const withholdingAmount = -Math.round(lectureFee * 0.088)
  const totalAmount = lectureFee + withholdingAmount

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
        institutionName: presentText(row.schoolName) || '-',
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
  return {
    nameKo: presentText(instructor.instructorName),
    nameEn: presentText(instructor.nameEnglish),
    addressRoad: presentText(instructor.address) || presentText(instructor.region),
    addressDetail: '',
    bankName: presentText(instructor.bankName),
    accountNumber: presentText(instructor.accountNumber),
    accountHolder: presentText(instructor.accountHolder),
    paymentPurpose: PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES.paymentPurpose ?? '',
    affiliation: '',
    noAffiliation: false,
    residentFront: '',
    residentBack: '',
  }
}

function buildLectureFeeCalculationValues(
  instructor: ParticipatingInstructorRow,
  settlementRow: ParticipatingInstructorPaymentStatementSettlementContext
): Partial<LectureFeeCalculationAutofillValues> {
  const lectureFeeTotal =
    settlementRow.scheduledSettlementAmount != null
      ? Math.round(settlementRow.scheduledSettlementAmount / (1 - 0.088))
      : 0

  return {
    lectureFeeType: '',
    feeBasisLeft: '',
    feeBasisRight: '',
    businessIncomeLeft: '',
    businessIncomeRight: '',
    sessionCount: presentText(instructor.lectureRound),
    sessionHours: '',
    transportFee: false,
    lodgingFee: false,
    totalStudents: instructor.studentCount > 0 ? String(instructor.studentCount) : '',
    totalLectureFee: lectureFeeTotal > 0 ? lectureFeeTotal.toLocaleString('ko-KR') : '',
  }
}

/** 참여 강사 정산 — 지급조서(발급용) 미리보기 본문 옵션 */
export function buildParticipatingInstructorPaymentStatementViewOptions(
  instructor: ParticipatingInstructorRow,
  settlementRow: ParticipatingInstructorPaymentStatementSettlementContext
): RenderFormParagraphBodyOptions {
  return {
    paymentStatementBasicInfoValues: buildBasicInfoValues(instructor),
    lectureFeeCalculationValues: buildLectureFeeCalculationValues(instructor, settlementRow),
    paymentStatementCalculationLines: buildCalculationLines(settlementRow),
    paymentStatementDisplayMode: 'document',
  }
}
