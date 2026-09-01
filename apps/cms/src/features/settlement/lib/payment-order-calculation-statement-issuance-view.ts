/**
 * 산출 내역서 → 지급조서(발급용) 미리보기·PDF 바인딩
 */

import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderAdminProgramDetail,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
  PaymentOrderCalculationStatementSessionBlock,
  PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import {
  getMockPaymentOrderCalculationStatementFromInstructorDetailPage,
  getMockPaymentOrderCalculationStatementFromProgramDetailPage,
} from '@/data/mock/payment-order-admin-list'
import type { AccountPaymentStatusDetail } from '@/data/mock/account-payments-list'
import { PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE } from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/** 지급조서 양식 고정 문구 — 목 회원 데이터가 아님 */
const PAYMENT_STATEMENT_PAYMENT_PURPOSE = '강사비 또는 활동비 지급'

function presentText(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '–') return ''
  return trimmed
}

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
  const session = presentText(blocks[0]?.lectureSessionDisplay)
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
  const nameKo = presentText(input.instructorNameKo)
  return {
    nameKo,
    nameEn: presentText(input.nameEn),
    addressRoad: presentText(input.addressDisplay),
    addressDetail: '',
    bankName: presentText(input.bankName),
    accountNumber: presentText(input.accountNumber),
    accountHolder: presentText(input.accountHolder),
    paymentPurpose: PAYMENT_STATEMENT_PAYMENT_PURPOSE,
    affiliation: '',
    noAffiliation: false,
    residentFront: '',
    residentBack: '',
  }
}

function buildLectureFeeCalculationValues(
  input: PaymentStatementIssuanceFromCalculationInput
): Partial<LectureFeeCalculationAutofillValues> {
  const businessIncomeLabel = presentText(input.businessIncomeEarnerLabel)
  const isBusinessIncome =
    businessIncomeLabel === '해당' ||
    (businessIncomeLabel.includes('해당') && !businessIncomeLabel.includes('없음'))
  const hasTravel = input.blocks.some(b => b.lines.some(l => l.kind === 'travel'))
  const hasLodging = input.blocks.some(b => b.lines.some(l => l.kind === 'lodging'))
  const lectureFeeTotal = input.blocks
    .flatMap(b => b.lines)
    .filter(l => l.kind === 'lecture_fee')
    .reduce((s, l) => s + l.amount, 0)

  const sessionProgress = presentText(input.programSessionProgressDisplay)
  const sessionCountFromProgress = sessionProgress.split('/')[0]?.trim() ?? ''
  const sessionCount = presentText(sessionCountFromProgress)

  const lectureFeeType = presentText(input.lectureFeeStandardTitle)
  const lectureFeeAmount = presentText(input.lectureFeeStandardAmount)

  return {
    lectureFeeType,
    feeBasisLeft: '',
    feeBasisRight: lectureFeeAmount ? `기본 : ${lectureFeeAmount}` : '',
    businessIncomeLeft: businessIncomeLabel,
    businessIncomeRight: businessIncomeLabel
      ? isBusinessIncome
        ? '사업 소득 3.3% 적용'
        : '기타 소득 8.8% 적용'
      : '',
    sessionCount,
    sessionHours: '',
    transportFee: hasTravel,
    lodgingFee: hasLodging,
    totalStudents: '',
    totalLectureFee: lectureFeeTotal > 0 ? lectureFeeTotal.toLocaleString('ko-KR') : '',
  }
}

export function buildPaymentStatementIssuanceFileNameFromCalculation(
  input: PaymentStatementIssuanceFromCalculationInput
): string {
  const institution =
    presentText(input.blocks[0]?.institutionName) || presentText(input.programName) || '-'
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
    instructorNameKo: presentText(statement.basic.instructorNameKo),
    programName: presentText(statement.basic.programName),
    lectureFeeStandardTitle: presentText(statement.basic.lectureFeeStandardTitle),
    lectureFeeStandardAmount: presentText(statement.basic.lectureFeeStandardAmount),
    businessIncomeEarnerLabel: presentText(statement.basic.businessIncomeEarnerLabel),
    programSessionProgressDisplay: presentText(statement.basic.programSessionProgressDisplay),
    blocks: statement.blocks,
    formulaLabel: statement.formulaLabel,
    totalAmount: statement.totalAmount,
  }
}

export function mapInstructorCalculationStatementToIssuanceInput(
  statement: Extract<PaymentOrderProgramCalculationStatement, { context: 'instructor' }>
): PaymentStatementIssuanceFromCalculationInput {
  const bankParts = presentText(statement.basic.settlementAccountBankNumberPart).split(/\s+/)
  const bankName = presentText(bankParts[0])
  const accountNumber = presentText(bankParts.slice(1).join(' '))
  return {
    instructorNameKo: presentText(statement.basic.nameKo),
    nameEn: presentText(statement.basic.nameEn),
    addressDisplay: presentText(statement.basic.addressDisplay),
    bankName,
    accountNumber,
    accountHolder: presentText(statement.basic.settlementAccountHolderPart),
    programName:
      presentText(statement.basic.programName) ||
      presentText(statement.blocks[0]?.institutionName) ||
      '',
    lectureFeeStandardTitle: presentText(statement.basic.lectureFeeStandardTitle),
    lectureFeeStandardAmount: presentText(statement.basic.lectureFeeStandardAmount),
    businessIncomeEarnerLabel: presentText(statement.basic.businessIncomeEarnerLabel),
    blocks: statement.blocks,
    formulaLabel: statement.formulaLabel,
    totalAmount: statement.totalAmount,
  }
}

export function mapAccountPaymentStatusDetailToIssuanceInput(
  detail: AccountPaymentStatusDetail
): PaymentStatementIssuanceFromCalculationInput {
  const bankParts = presentText(detail.basic.settlementAccountBankNumberPart).split(/\s+/)
  const bankName = presentText(bankParts[0])
  const accountNumber = presentText(bankParts.slice(1).join(' '))
  return {
    instructorNameKo: presentText(detail.basic.nameKo),
    nameEn: presentText(detail.basic.nameEn),
    addressDisplay: presentText(detail.basic.addressDisplay),
    bankName,
    accountNumber,
    accountHolder: presentText(detail.basic.settlementAccountHolderPart),
    programName: presentText(detail.basic.programName),
    lectureFeeStandardTitle: presentText(detail.basic.lectureFeeStandardTitle),
    lectureFeeStandardAmount: presentText(detail.basic.lectureFeeStandardAmount),
    businessIncomeEarnerLabel: presentText(detail.basic.businessIncomeEarnerLabel),
    programSessionProgressDisplay: presentText(detail.basic.programSessionProgressDisplay),
    blocks: detail.blocks,
    formulaLabel: detail.formulaLabel,
    totalAmount: detail.totalAmount,
  }
}

export type PaymentStatementIssuancePayload = {
  paragraphBodyOptions: RenderFormParagraphBodyOptions
  fileName: string
}

export function buildPaymentStatementIssuancePayloadFromCalculationStatement(
  statement: PaymentOrderProgramCalculationStatement
): PaymentStatementIssuancePayload | null {
  if (statement.context !== 'program' && statement.context !== 'instructor') {
    return null
  }

  const input =
    statement.context === 'program'
      ? mapProgramCalculationStatementToIssuanceInput(statement)
      : mapInstructorCalculationStatementToIssuanceInput(statement)

  return {
    paragraphBodyOptions: buildPaymentStatementIssuanceViewOptionsFromCalculation(input),
    fileName: buildPaymentStatementIssuanceFileNameFromCalculation(input),
  }
}

export function buildMockProgramDetailLinePaymentStatementIssuancePayload(
  programRow: PaymentOrderAdminProgramRow,
  programDetail: PaymentOrderAdminProgramDetail,
  lineRow: PaymentOrderAdminProgramDetailInstructorRow
): PaymentStatementIssuancePayload {
  const statement = getMockPaymentOrderCalculationStatementFromProgramDetailPage(
    programRow,
    programDetail,
    lineRow
  )
  const payload = buildPaymentStatementIssuancePayloadFromCalculationStatement(statement)
  if (!payload) {
    throw new Error('program detail line issuance payload could not be built')
  }
  return payload
}

export function buildMockInstructorDetailLinePaymentStatementIssuancePayload(
  instructorRow: PaymentOrderAdminInstructorRow,
  instructorDetail: PaymentOrderAdminInstructorDetail,
  lineRow: PaymentOrderAdminInstructorDetailProgramRow
): PaymentStatementIssuancePayload {
  const statement = getMockPaymentOrderCalculationStatementFromInstructorDetailPage(
    instructorRow,
    instructorDetail,
    lineRow
  )
  const payload = buildPaymentStatementIssuancePayloadFromCalculationStatement(statement)
  if (!payload) {
    throw new Error('instructor detail line issuance payload could not be built')
  }
  return payload
}
