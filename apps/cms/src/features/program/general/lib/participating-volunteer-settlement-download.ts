import type { ParticipatingVolunteerSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-volunteer-settlement-row'
import { isInstructorSettlementEligibleForPaymentStatementIssue } from '@/shared/constants/instructor-settlement-status'
import {
  bulkDownloadPaymentStatementsRemote,
  downloadPaymentStatementRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import {
  getSettlementApiErrorMessage,
  isFileDownloadPasswordApiError,
} from '@/features/settlement-management/api/get-settlement-api-error'

/** 지급조서 일괄 다운로드 — 진행 완료 + 확인 완료·계좌 지급 완료 */
export function isParticipatingVolunteerSettlementEligibleForPaymentStatementDownload(row: {
  volunteerProgress: ParticipatingVolunteerSettlementApiRow['volunteerProgress']
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: ParticipatingVolunteerSettlementApiRow['paymentStatementStatus']
}): boolean {
  return (
    row.volunteerProgress === 'completed' &&
    row.hasPaymentStatementApplication &&
    isInstructorSettlementEligibleForPaymentStatementIssue(row.paymentStatementStatus)
  )
}

export function filterParticipatingVolunteerSettlementDownloadRows(
  rows: ParticipatingVolunteerSettlementApiRow[]
): ParticipatingVolunteerSettlementApiRow[] {
  return rows.filter(row => isParticipatingVolunteerSettlementEligibleForPaymentStatementDownload(row))
}

export async function bulkDownloadParticipatingVolunteerPaymentStatements(
  rows: ParticipatingVolunteerSettlementApiRow[],
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

export function getParticipatingVolunteerSettlementBulkDownloadErrorMessage(error: unknown): string {
  return getSettlementApiErrorMessage(error, '지급조서 일괄 다운로드에 실패했습니다.')
}
