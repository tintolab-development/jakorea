import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { isParticipatingInstructorSettlementEligibleForPaymentStatementDownload } from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import { bulkDownloadPaymentStatementsRemote } from '@/features/settlement-management/api/settlement-api-client'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'

export function filterParticipatingInstructorSettlementDownloadRows(
  rows: ParticipatingInstructorSettlementApiRow[]
): ParticipatingInstructorSettlementApiRow[] {
  // 확정 전 신청서 행(settlementId null)은 지급조서 다운로드 대상이 아니다.
  return rows.filter(row =>
    row.settlementId != null &&
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
  const settlementIds = rows
    .map(row => row.settlementId)
    .filter((id): id is number => id != null)
  if (settlementIds.length === 0) {
    throw new Error('다운로드할 정산 건이 없습니다.')
  }
  void filenamePrefix
  const password = options.password

  // 일괄 ZIP 실패 시 건별 다운로드로 대체하지 않는다. 건마다 다운로드 횟수·이력이 쌓이고
  // 같은 실패가 건수만큼 반복되므로, 오류를 그대로 올려 호출부의 실패 안내를 띄운다.
  await bulkDownloadPaymentStatementsRemote({ settlementIds, password })
}

export function getParticipatingInstructorSettlementBulkDownloadErrorMessage(error: unknown): string {
  return getSettlementApiErrorMessage(error, '지급조서 일괄 다운로드에 실패했습니다.')
}
