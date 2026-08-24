/**
 * 산출 내역서 → 지급조서(발급용) 미리보기·PDF 바인딩
 */

import type {
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderCalculationStatementSessionBlock,
  PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import type { AccountPaymentStatusDetail } from '@/data/mock/account-payments-list'
import { PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE } from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import { LECTURE_FEE_CALCULATION_SAMPLE_VALUES } from '@/features/template/model/lecture-fee-calculation-sample'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/** 지급조서 확인 완료·계좌 지급 완료(라인 `rejected` 라벨) */
export const PAYMENT_ORDER_LINE_STATUSES_ELIGIBLE_FOR_PAYMENT_STATEMENT_ISSUE: readonly PaymentOrderAdminLineProcessingStatus[] =
  ['confirmed', 'rejected']

export function isPaymentOrderLineEligibleForPaymentStatementIssue(
  status: PaymentOrderAdminLineProcessingStatus
): boolean {
  return PAYMENT_ORDER_LINE_STATUSES_ELIGIBLE_FOR_PAYMENT_STATEMENT_ISSUE.includes(status)
}

export interface PaymentStatementIssuanceFromCalculationInput {
  instructorNameKo: string
  nameEn?: string
  addressDisplay?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  programName: string
  lectureFeeStandardTitle: string
  lectureFeeStandardAmount: string
  businessIncomeEarnerLabel: string
  programSessionProgressDisplay?: string
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
}

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim() || '-'
}

function stripAmountDisplayOverrides(
  blocks: PaymentOrderCalculationStatementSessionBlock[]
): PaymentOrderCalculationStatementSessionBlock[] {
  return blocks.map(block => ({
    ...block,
    lines: block.lines.map(line => {
      const { amountDisplayOverride: _omit, ...rest } = line
      return rest
    }),
  }))
}

function parseSessionPartFromBlocks(
  blocks: PaymentOrderCalculationStatementSessionBlock[]
): string {
  const session = blocks[0]?.lectureSessionDisplay?.trim()
  if (!session) return '정산'
  const match = session.match(/(\d+)\s*~?\s*(\d+)?\s*(?:차시|회차)/)
  if (match?.[1]) {
    return match[2] && match[2] !== match[1] ? `${match[1]}-${match[2]}회차` : `${match[1]}회차`
  }
  return sanitizeFileNamePart(session)
}

function buildCalculationLines(
  input: PaymentStatementIssuanceFromCalculationInput
): PaymentStatementCalculationLinesViewModel {
  return {
    blocks: stripAmountDisplayOverrides(input.blocks),
    formulaLabel: input.formulaLabel,
    totalAmount: input.totalAmount,
  }
}

function buildBasicInfoValues(
  input: PaymentStatementIssuanceFromCalculationInput
): Partial<PaymentStatementBasicInfoAutofillValues> {
  const sample = PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES
  const nameKo = input.instructorNameKo.trim() || sample.nameKo
  return {
    nameKo,
    nameEn: input.nameEn?.trim() || sample.nameEn,
    addressRoad: input.addressDisplay?.trim() || sample.addressRoad,
    addressDetail: sample.addressDetail,
    bankName: input.bankName?.trim() || sample.bankName,
    accountNumber: input.accountNumber?.trim() || sample.accountNumber,
    accountHolder: input.accountHolder?.trim() || nameKo,
    paymentPurpose: sample.paymentPurpose,
    affiliation: sample.affiliation,
    noAffiliation: sample.noAffiliation,
    residentFront: sample.residentFront,
    residentBack: sample.residentBack,
  }
}

function buildLectureFeeCalculationValues(
  input: PaymentStatementIssuanceFromCalculationInput
): Partial<LectureFeeCalculationAutofillValues> {
  const sample = LECTURE_FEE_CALCULATION_SAMPLE_VALUES
  const businessIncomeLabel = input.businessIncomeEarnerLabel.trim()
  const isBusinessIncome =
    businessIncomeLabel === '해당' ||
    (businessIncomeLabel.includes('해당') && !businessIncomeLabel.includes('없음'))
  const hasTravel = input.blocks.some(b => b.lines.some(l => l.kind === 'travel'))
  const hasLodging = input.blocks.some(b => b.lines.some(l => l.kind === 'lodging'))
  const lectureFeeTotal = input.blocks
    .flatMap(b => b.lines)
    .filter(l => l.kind === 'lecture_fee')
    .reduce((s, l) => s + l.amount, 0)

  const sessionProgress = input.programSessionProgressDisplay?.trim()
  const sessionCount =
    sessionProgress?.split('/')[0]?.trim() || String(input.blocks.length || sample.sessionCount)

  return {
    ...sample,
    lectureFeeType: input.lectureFeeStandardTitle.trim() || sample.lectureFeeType,
    feeBasisRight: input.lectureFeeStandardAmount.trim()
      ? `기본 : ${input.lectureFeeStandardAmount.trim()}`
      : sample.feeBasisRight,
    businessIncomeLeft: businessIncomeLabel || sample.businessIncomeLeft,
    businessIncomeRight: isBusinessIncome ? '사업 소득 3.3% 적용' : '기타 소득 8.8% 적용',
    sessionCount,
    transportFee: hasTravel,
    lodgingFee: hasLodging,
    totalLectureFee:
      lectureFeeTotal > 0 ? lectureFeeTotal.toLocaleString('ko-KR') : sample.totalLectureFee,
  }
}

export function buildPaymentStatementIssuanceFileNameFromCalculation(
  input: PaymentStatementIssuanceFromCalculationInput
): string {
  const institution = input.blocks[0]?.institutionName?.trim() || input.programName
  return [
    PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE,
    sanitizeFileNamePart(institution),
    sanitizeFileNamePart(input.instructorNameKo),
    sanitizeFileNamePart(parseSessionPartFromBlocks(input.blocks)),
  ].join('_')
}

/** 산출 내역서(프로그램 맥락) → 지급조서 발급용 본문 옵션 */
export function buildPaymentStatementIssuanceViewOptionsFromCalculation(
  input: PaymentStatementIssuanceFromCalculationInput
): RenderFormParagraphBodyOptions {
  return {
    paymentStatementBasicInfoValues: buildBasicInfoValues(input),
    lectureFeeCalculationValues: buildLectureFeeCalculationValues(input),
    paymentStatementCalculationLines: buildCalculationLines(input),
    paymentStatementDisplayMode: 'document',
  }
}

export function mapProgramCalculationStatementToIssuanceInput(
  statement: Extract<PaymentOrderProgramCalculationStatement, { context: 'program' }>
): PaymentStatementIssuanceFromCalculationInput {
  return {
    instructorNameKo: statement.basic.instructorNameKo,
    programName: statement.basic.programName,
    lectureFeeStandardTitle: statement.basic.lectureFeeStandardTitle,
    lectureFeeStandardAmount: statement.basic.lectureFeeStandardAmount,
    businessIncomeEarnerLabel: statement.basic.businessIncomeEarnerLabel,
    programSessionProgressDisplay: statement.basic.programSessionProgressDisplay,
    blocks: statement.blocks,
    formulaLabel: statement.formulaLabel,
    totalAmount: statement.totalAmount,
  }
}

export function mapInstructorCalculationStatementToIssuanceInput(
  statement: Extract<PaymentOrderProgramCalculationStatement, { context: 'instructor' }>
): PaymentStatementIssuanceFromCalculationInput {
  const bankParts = statement.basic.settlementAccountBankNumberPart.trim().split(/\s+/)
  const bankName = bankParts[0]
  const accountNumber = bankParts.slice(1).join(' ')
  return {
    instructorNameKo: statement.basic.nameKo,
    nameEn: statement.basic.nameEn,
    addressDisplay: statement.basic.addressDisplay,
    bankName,
    accountNumber,
    accountHolder: statement.basic.settlementAccountHolderPart,
    programName: statement.basic.programName?.trim() || statement.blocks[0]?.institutionName || '—',
    lectureFeeStandardTitle: statement.basic.lectureFeeStandardTitle,
    lectureFeeStandardAmount: statement.basic.lectureFeeStandardAmount,
    businessIncomeEarnerLabel: statement.basic.businessIncomeEarnerLabel,
    blocks: statement.blocks,
    formulaLabel: statement.formulaLabel,
    totalAmount: statement.totalAmount,
  }
}

export function mapAccountPaymentStatusDetailToIssuanceInput(
  detail: AccountPaymentStatusDetail
): PaymentStatementIssuanceFromCalculationInput {
  const bankParts = detail.basic.settlementAccountBankNumberPart.trim().split(/\s+/)
  const bankName = bankParts[0]
  const accountNumber = bankParts.slice(1).join(' ')
  return {
    instructorNameKo: detail.basic.nameKo,
    nameEn: detail.basic.nameEn,
    addressDisplay: detail.basic.addressDisplay,
    bankName,
    accountNumber,
    accountHolder: detail.basic.settlementAccountHolderPart,
    programName: detail.basic.programName,
    lectureFeeStandardTitle: detail.basic.lectureFeeStandardTitle,
    lectureFeeStandardAmount: detail.basic.lectureFeeStandardAmount,
    businessIncomeEarnerLabel: detail.basic.businessIncomeEarnerLabel,
    programSessionProgressDisplay: detail.basic.programSessionProgressDisplay,
    blocks: detail.blocks,
    formulaLabel: detail.formulaLabel,
    totalAmount: detail.totalAmount,
  }
}
