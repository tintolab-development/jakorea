import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { isParticipatingInstructorSettlementEligibleForPaymentStatementDownload } from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import {
  bulkDownloadPaymentStatementsRemote,
  downloadPaymentStatementRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import {
  getSettlementApiErrorMessage,
  isFileDownloadPasswordApiError,
} from '@/features/settlement-management/api/get-settlement-api-error'

export function filterParticipatingInstructorSettlementDownloadRows(
  rows: ParticipatingInstructorSettlementApiRow[]
): ParticipatingInstructorSettlementApiRow[] {
  return rows.filter(row =>
    isParticipatingInstructorSettlementEligibleForPaymentStatementDownload({
      lectureProgressLabel: row.lectureProgressLabel,
      hasPaymentStatementApplication: row.hasPaymentStatementApplication,
      paymentStatementStatus: row.paymentStatementStatus,
    })
  )
}

export async function bulkDownloadParticipatingInstructorPaymentStatements(
  rows: ParticipatingInstructorSettlementApiRow[],
  filenamePrefix = '지급조서_일괄',
  options: { password: string }
): Promise<void> {
  const settlementIds = rows.map(row => row.settlementId)
  if (settlementIds.length === 0) {
    throw new Error('다운로드할 정산 건이 없습니다.')
  }
  void filenamePrefix
  const password = options.password

  try {
    await bulkDownloadPaymentStatementsRemote({ settlementIds, password })
    return
  } catch (error) {
    if (isFileDownloadPasswordApiError(error)) throw error
  }

  for (const settlementId of settlementIds) {
    await downloadPaymentStatementRemote(settlementId, { password })
  }
}

export function getParticipatingInstructorSettlementBulkDownloadErrorMessage(error: unknown): string {
  return getSettlementApiErrorMessage(error, '지급조서 일괄 다운로드에 실패했습니다.')
}
