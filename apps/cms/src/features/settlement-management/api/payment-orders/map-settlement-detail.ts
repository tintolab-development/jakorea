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
    statementId:
      settlementId != null ? statementMap.get(settlementId) : undefined,
    instructorName: item.instructorName ?? '-',
    institutionName: '-',
    lectureDate: item.lectureDate ?? '',
    sessionOrdinal: item.scheduleId ?? index + 1,
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
    statementId:
      settlementId != null ? statementMap.get(settlementId) : undefined,
    programName: item.programNameKo ?? '-',
    institutionName: '-',
    lectureDate: item.lectureDate ?? '',
    sessionOrdinal: item.scheduleId ?? index + 1,
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
  const dates = filtered
    .map(i => i.lectureDate)
    .filter((d): d is string => Boolean(d))
    .sort()

  return {
    programNo: row.no,
    programName: row.programName,
    aggregateProcessingStatus: row.processingStatus,
    businessPeriodStart: dates[0] ?? '',
    businessPeriodEnd: dates[dates.length - 1] ?? '',
    sessionCompleted: instructorRows.length,
    sessionTotal: instructorRows.length,
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
    totalEstimatedAmount: row.estimatedAmount,
    programRows,
  }
}
