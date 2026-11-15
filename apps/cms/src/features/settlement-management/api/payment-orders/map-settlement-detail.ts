import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramDetail,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type {
  PaymentStatementListItemResponse,
  SettlementListItemResponse,
} from '@/shared/api/generated/settlement/schemas'
import {
  canConfirmPaymentStatement,
  CONFIRM_PAYMENT_STATEMENT_ACTION,
  mapSettlementAxesToLineStatus,
} from '@/features/settlement-management/api/shared/settlement-status-mappers'
import {
  pickBusinessPeriodFromListItems,
  pickProgramSessionProgressFromListItems,
} from '@/features/settlement-management/api/shared/map-frontend-fields'
import {
  formatPaymentOrderInstitutionDisplay,
  sumCountablePaymentOrderLineAmounts,
} from '@/features/settlement-management/api/payment-orders/payment-order-line-amounts'

function statementIdBySettlementId(
  statements: PaymentStatementListItemResponse[]
): Map<number, number> {
  const map = new Map<number, number>()
  for (const s of statements) {
    if (s.settlementId != null && s.statementId != null) {
      map.set(s.settlementId, s.statementId)
    }
  }
  return map
}

function resolveStatementId(
  item: SettlementListItemResponse,
  statementMap: Map<number, number>
): number | undefined {
  if (item.statementId != null) return item.statementId
  const settlementId = item.settlementId
  return settlementId != null ? statementMap.get(settlementId) : undefined
}

/** 지급조서 확인 목록의 확정 전 신청서 행. statementStatus만으로 구분하지 않는다. */
export function isSettlementApplicationListItem(item: {
  rowType?: string | null
  settlementId?: number | null
  settlementApplicationId?: number | null
}): boolean {
  if (item.rowType === 'SETTLEMENT_APPLICATION') return true
  return item.settlementId == null && item.settlementApplicationId != null
}

/** 지급조서 확인 목록의 영수증 정산 신청 행(개인 참여자·봉사자). 지급조서가 없어 검토 모달로 처리한다. */
export function isIndividualSettlementApplicationListItem(item: {
  rowType?: string | null
  individualSettlementApplicationId?: number | null
}): boolean {
  if (item.rowType === 'INDIVIDUAL_SETTLEMENT_APPLICATION') return true
  return item.individualSettlementApplicationId != null
}

function paymentOrderLineId(item: SettlementListItemResponse, index: number): string {
  if (item.settlementId != null) return String(item.settlementId)
  if (item.settlementApplicationId != null) return `application-${item.settlementApplicationId}`
  if (item.individualSettlementApplicationId != null) {
    return `receipt-${item.individualSettlementApplicationId}`
  }
  return `line-${index}`
}

function sharedPaymentOrderLineFields(
  item: SettlementListItemResponse,
  index: number,
  statementMap: Map<number, number>
) {
  const availableActions = item.availableActions
  const applicationLine = isSettlementApplicationListItem(item)
  return {
    id: paymentOrderLineId(item, index),
    no: index + 1,
    settlementId: item.settlementId ?? undefined,
    settlementApplicationId: item.settlementApplicationId ?? undefined,
    rowType: item.rowType ?? undefined,
    payeeType: item.payeeType ?? undefined,
    individualSettlementApplicationId: item.individualSettlementApplicationId ?? undefined,
    revisionNo: item.revisionNo ?? undefined,
    payeeBankName: item.payeeBankName?.trim() || undefined,
    payeeAccountNumberMasked: item.payeeAccountNumberMasked?.trim() || undefined,
    payeeAccountHolder: item.payeeAccountHolder?.trim() || undefined,
    programId: item.programId ?? undefined,
    statementId: applicationLine ? undefined : resolveStatementId(item, statementMap),
    lectureDate: item.lectureDate ?? '',
    sessionOrdinal: item.sessionOrdinal ?? null,
    processingStatus: mapSettlementAxesToLineStatus(item.statementStatus, item.paymentStatus),
    estimatedAmount: item.netPaymentAmount ?? 0,
    lectureFeePaymentScheduledDate: item.expectedTransferDate ?? undefined,
    correctionRequestId: item.settlementCorrectionRequestId ?? undefined,
    correctionReason: item.correctionReason?.trim() || undefined,
    statementStatus: item.statementStatus ?? undefined,
    paymentStatus: item.paymentStatus ?? undefined,
    availableActions,
    canConfirmPaymentStatement: applicationLine
      ? (availableActions ?? []).includes(CONFIRM_PAYMENT_STATEMENT_ACTION)
      : canConfirmPaymentStatement({
          availableActions,
          statementStatus: item.statementStatus,
        }),
  }
}

function toProgramDetailInstructorRow(
  item: SettlementListItemResponse,
  index: number,
  statementMap: Map<number, number>
): PaymentOrderAdminProgramDetailInstructorRow {
  return {
    ...sharedPaymentOrderLineFields(item, index, statementMap),
    instructorName: item.instructorName ?? '-',
    institutionName: formatPaymentOrderInstitutionDisplay(item.institutionName) || '-',
  }
}

/** 정산 목록 단건 → 산출 내역서(프로그램형) 라인 행 — 참여 강사 상세 등 단건 진입용 */
export function mapSettlementListItemToProgramDetailLineRow(
  item: SettlementListItemResponse,
  index = 0
): PaymentOrderAdminProgramDetailInstructorRow {
  return toProgramDetailInstructorRow(item, index, new Map())
}

function toInstructorDetailProgramRow(
  item: SettlementListItemResponse,
  index: number,
  statementMap: Map<number, number>
): PaymentOrderAdminInstructorDetailProgramRow {
  return {
    ...sharedPaymentOrderLineFields(item, index, statementMap),
    programName: item.programNameKo ?? '-',
    institutionName: formatPaymentOrderInstitutionDisplay(item.institutionName) || '-',
  }
}

export function buildProgramDetailFromSettlements(
  row: PaymentOrderAdminProgramRow,
  items: SettlementListItemResponse[],
  statements: PaymentStatementListItemResponse[]
): PaymentOrderAdminProgramDetail {
  const programId = row.programId
  const filtered =
    programId != null
      ? items.filter(i => i.programId === programId)
      : items.filter(i => i.programNameKo === row.programName)
  const statementMap = statementIdBySettlementId(statements)
  const instructorRows = filtered.map((item, index) =>
    toProgramDetailInstructorRow(item, index, statementMap)
  )
  const period = pickBusinessPeriodFromListItems(filtered)
  const progress = pickProgramSessionProgressFromListItems(filtered)

  return {
    programNo: row.no,
    programName: row.programName,
    aggregateProcessingStatus: row.processingStatus,
    businessPeriodStart: period.businessPeriodStart,
    businessPeriodEnd: period.businessPeriodEnd,
    sessionCompleted: progress?.sessionCompleted ?? null,
    sessionTotal: progress?.sessionTotal ?? null,
    instructorRows,
  }
}

export function buildInstructorDetailFromSettlements(
  row: PaymentOrderAdminInstructorRow,
  items: SettlementListItemResponse[],
  statements: PaymentStatementListItemResponse[]
): PaymentOrderAdminInstructorDetail {
  const instructorMemberId = row.instructorMemberId
  const filtered =
    instructorMemberId != null
      ? items.filter(i => i.instructorMemberId === instructorMemberId)
      : items.filter(i => i.instructorName === row.instructorName)
  const statementMap = statementIdBySettlementId(statements)
  const programRows = filtered.map((item, index) =>
    toInstructorDetailProgramRow(item, index, statementMap)
  )

  return {
    instructorNo: row.no,
    nameKo: row.instructorName,
    nameEn: '-',
    address: '-',
    phone: '-',
    email: '-',
    bankName: '-',
    accountNumber: '-',
    accountHolder: '-',
    totalEstimatedAmount: sumCountablePaymentOrderLineAmounts(programRows),
    genderBirthDisplay: '-',
    programRows,
  }
}
