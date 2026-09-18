import type { SettlementFrontendResponse, SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { PaymentOrderCalculationStatementLine } from '@/data/mock/payment-order-admin-list'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'
import { mapSettlementFrontendItemTypeToLineKind } from '@/features/settlement/lib/resolve-settlement-item-setting-for-calculation-row'
import { buildParticipatingInstructorEducationScheduleLabel } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'

function presentText(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '–') return ''
  return trimmed
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

function buildCalculationLinesFromSettlement(
  detail: SettlementFrontendResponse,
  listItem: SettlementListItemResponse,
  institutionName: string,
  scheduleLabel: string
): PaymentStatementCalculationLinesViewModel {
  const { lectureDateDisplay, lectureSessionDisplay } = parseEducationScheduleParts(scheduleLabel)
  const items = detail.items ?? []

  const lines: PaymentOrderCalculationStatementLine[] = items.map((item, index) => {
    const amount = item.amount ?? 0
    const kind = mapSettlementFrontendItemTypeToLineKind(item.type, amount)
    return {
      id: `settlement-${listItem.settlementId}-line-${index}`,
      itemLabel: formatPaymentOrderCalculationItemLabel(item.type, amount),
      description: item.description?.trim() || '—',
      amount,
      kind,
    }
  })

  const positiveLines = lines.filter(line => line.kind !== 'withholding')
  const withholdingLines = lines.filter(line => line.kind === 'withholding')
  const formulaLabel =
    positiveLines.length > 0 && withholdingLines.length > 0
      ? `${positiveLines.map(line => line.itemLabel).join(' + ')} - ${withholdingLines.map(line => line.itemLabel).join(' - ')}`
      : '정산 항목 합계'

  return {
    blocks: [
      {
        institutionName: presentText(institutionName) || presentText(detail.institutionName) || '-',
        lectureDateDisplay: presentText(detail.lectureSessionDisplay) || lectureDateDisplay,
        lectureSessionDisplay,
        lines,
      },
    ],
    formulaLabel,
    totalAmount: detail.totalAmount ?? listItem.netPaymentAmount ?? 0,
  }
}

function buildBasicInfoValues(
  instructor: ParticipatingInstructorRow,
  detail: SettlementFrontendResponse
): Partial<PaymentStatementBasicInfoAutofillValues> {
  return {
    nameKo: presentText(detail.instructorName) || presentText(instructor.instructorName),
    nameEn: presentText(instructor.nameEnglish),
    addressRoad: presentText(instructor.address) || presentText(instructor.region),
    addressDetail: '',
    bankName: presentText(instructor.bankName),
    accountNumber: presentText(instructor.accountNumber),
    accountHolder: presentText(instructor.accountHolder),
    paymentPurpose: PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES.paymentPurpose ?? '',
    affiliation: presentText(detail.institutionName) || presentText(instructor.affiliation),
    noAffiliation: false,
    residentFront: '',
    residentBack: '',
  }
}

function buildLectureFeeCalculationValues(
  detail: SettlementFrontendResponse,
  listItem: SettlementListItemResponse
): Partial<LectureFeeCalculationAutofillValues> {
  const lectureFeeTotal = detail.lectureFeeStandardAmount ?? listItem.grossAmount ?? 0
  return {
    lectureFeeType: presentText(detail.lectureFeeStandardTitle),
    feeBasisLeft: presentText(detail.wageItemType),
    feeBasisRight: presentText(detail.feeGrade),
    businessIncomeLeft: presentText(detail.businessIncomeEarnerLabel),
    businessIncomeRight: '',
    sessionCount:
      detail.sessionTotal != null && detail.sessionTotal > 0 ? String(detail.sessionTotal) : '',
    sessionHours: '',
    transportFee: false,
    lodgingFee: false,
    totalStudents: '',
    totalLectureFee: lectureFeeTotal > 0 ? lectureFeeTotal.toLocaleString('ko-KR') : '',
  }
}

export function buildPaymentStatementPreviewOptionsFromSettlement(input: {
  instructor: ParticipatingInstructorRow
  listItem: SettlementListItemResponse
  detail: SettlementFrontendResponse
  institutionName?: string
}): RenderFormParagraphBodyOptions {
  const scheduleLabel = buildParticipatingInstructorEducationScheduleLabel(input.listItem)
  const institutionName =
    input.institutionName?.trim() ||
    input.listItem.institutionName?.trim() ||
    input.detail.institutionName?.trim() ||
    '-'

  return {
    paymentStatementBasicInfoValues: buildBasicInfoValues(input.instructor, input.detail),
    lectureFeeCalculationValues: buildLectureFeeCalculationValues(input.detail, input.listItem),
    paymentStatementCalculationLines: buildCalculationLinesFromSettlement(
      input.detail,
      input.listItem,
      institutionName,
      scheduleLabel
    ),
    paymentStatementDisplayMode: 'document',
  }
}
