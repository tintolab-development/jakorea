import {
} from '@/features/program/general/lib/volunteer-screening-constants'
import { buildApplicationProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import {
  isVolunteer1365ApprovalBlockedFailure,
  VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT,
} from '@/features/program/shared/lib/application-eligibility-conflict'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { BulkActionResponse } from '@/shared/api/generated/dashboard/schemas/bulkActionResponse'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

export function formatVolunteerBulkActionFailures(bulk: BulkActionResponse): {
  title: string
  content: string
} {
  const failures = bulk.failures ?? []
  const failureCount = bulk.failureCount ?? failures.length
  const successCount = bulk.successCount ?? bulk.successIds?.length ?? 0
  const requestedCount = bulk.requestedCount ?? successCount + failureCount
  const allFailuresAre1365 =
    failureCount > 0 &&
    failures.length > 0 &&
    failures.every(failure => isVolunteer1365ApprovalBlockedFailure(failure))
  if (allFailuresAre1365) {
    if (successCount === 0) return { ...VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT }
    return {
      title: VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT.title,
      content: `요청 ${requestedCount}건 중 성공 ${successCount}건, 실패 ${failureCount}건입니다.\n\n${VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT.content}`,
    }
  }
  const title = successCount > 0 && failureCount > 0 ? '일부 처리 실패' : '처리 실패'
  const summary = `요청 ${requestedCount}건 중 성공 ${successCount}건, 실패 ${failureCount}건입니다.`
  const lines = failures.map(failure => {
    const parts = [
      failure.id != null ? String(failure.id) : null,
      failure.code?.trim() || null,
      failure.message?.trim() || null,
    ].filter((part): part is string => Boolean(part))
    return parts.join(' ')
  })
  return {
    title,
    content: [summary, ...lines].filter(Boolean).join('\n'),
  }
}

export function canSelectVolunteerApplicationForDecision(row: {
  availableActions: readonly string[]
}): boolean {
  return row.availableActions.some(action => {
    const normalized = action.trim().toUpperCase()
    return normalized === 'APPROVE' || normalized === 'REJECT'
  })
}

function hasProcessedApplicationSelection(
  rows: readonly { availableActions: readonly string[] }[]
): boolean {
  return rows.some(row => !canSelectVolunteerApplicationForDecision(row))
}

export function requestGeneralVolunteerApplicationBulkApprove({
  selectedIds,
  selectedRows,
  onOpenSingleApprove,
  onOpenBulkApprove,
}: {
  selectedIds: string[]
  selectedRows: readonly { availableActions: readonly string[] }[]
  onOpenSingleApprove: () => void
  onOpenBulkApprove: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(NO_SELECTION_ALERT)
    return
  }
  if (hasProcessedApplicationSelection(selectedRows)) {
    cmsAlertModal.show(buildApplicationProcessedSelectionAlert('volunteer'))
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleApprove()
    return
  }
  onOpenBulkApprove()
}

export function requestGeneralVolunteerApplicationBulkReject({
  selectedIds,
  selectedRows,
  onOpenSingleReject,
  onOpenBulkReject,
}: {
  selectedIds: string[]
  selectedRows: readonly { availableActions: readonly string[] }[]
  onOpenSingleReject: () => void
  onOpenBulkReject: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(NO_SELECTION_ALERT)
    return
  }
  if (hasProcessedApplicationSelection(selectedRows)) {
    cmsAlertModal.show(buildApplicationProcessedSelectionAlert('volunteer'))
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleReject()
    return
  }
  onOpenBulkReject()
}
