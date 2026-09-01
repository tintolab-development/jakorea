import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramDetail,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type {
  PaymentStatementListItemResponse,
  SettlementListItemResponse,
} from '@/shared/api/generated/settlement/schemas'
import {
  mapStatementStatusToLineStatus,
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

function toProgramDetailInstructorRow(
  item: SettlementListItemResponse,
  index: number,
  statementMap: Map<number, number>
): PaymentOrderAdminProgramDetailInstructorRow {
  const settlementId = item.settlementId
  return {
    id: settlementId != null ? String(settlementId) : `line-${index}`,
    no: index + 1,
    settlementId,
    statementId: resolveStatementId(item, statementMap),
    instructorName: item.instructorName ?? '-',
    institutionName: formatPaymentOrderInstitutionDisplay(item.institutionName),
    lectureDate: item.lectureDate ?? '',
    sessionOrdinal: item.sessionOrdinal ?? 0,
    processingStatus: mapStatementStatusToLineStatus(item.statementStatus),
    estimatedAmount: item.netPaymentAmount ?? 0,
    lectureFeePaymentScheduledDate: item.expectedTransferDate,
  }
}

function toInstructorDetailProgramRow(
  item: SettlementListItemResponse,
  index: number,
  statementMap: Map<number, number>
): PaymentOrderAdminInstructorDetailProgramRow {
  const settlementId = item.settlementId
  return {
    id: settlementId != null ? String(settlementId) : `line-${index}`,
    no: index + 1,
    settlementId,
    statementId: resolveStatementId(item, statementMap),
    programName: item.programNameKo ?? '-',
    institutionName: formatPaymentOrderInstitutionDisplay(item.institutionName),
    lectureDate: item.lectureDate ?? '',
    sessionOrdinal: item.sessionOrdinal ?? 0,
    processingStatus: mapStatementStatusToLineStatus(item.statementStatus),
    estimatedAmount: item.netPaymentAmount ?? 0,
    lectureFeePaymentScheduledDate: item.expectedTransferDate,
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
    sessionCompleted: progress?.sessionCompleted ?? 0,
    sessionTotal: progress?.sessionTotal ?? 0,
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
