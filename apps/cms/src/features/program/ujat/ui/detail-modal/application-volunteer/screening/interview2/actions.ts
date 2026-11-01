import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { buildInterview2ProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { patchUjatVolunteerSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import {
  isUjatVolunteerInterview2SelectableForResult,
  type UjatVolunteerInterview2ResultSelectRow,
} from './display'

export type UjatInterview2ConfirmRequest = {
  title: string
  content: string
  confirmText: string
  danger?: boolean
  onConfirm: () => void
}

export function patchUjatVolunteerInterview2ListStatus(
  rows: UjatVolunteerApplicantRow[],
  ids: string[],
  status: UjatSecondInterviewScreeningStatus
): UjatVolunteerApplicantRow[] {
  return patchUjatVolunteerSecondInterviewScreeningStatus(rows, ids, status)
}

export function confirmUjatVolunteerInterview2Fail({
  count,
  onOpen,
}: {
  count: number
  onOpen: () => void
}): void {
  if (count === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '불합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  onOpen()
}

export function confirmUjatVolunteerInterview2Pass({
  showConfirm,
  count,
  onConfirm,
}: {
  showConfirm: (options: UjatInterview2ConfirmRequest) => void
  count: number
  onConfirm: () => void
}): void {
  if (count === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  showConfirm({
    title: count === 1 ? '면접 합격' : '선택 합격',
    content:
      count === 1
        ? '해당 지원자를 면접 합격 처리하시겠습니까?'
        : `선택한 ${count}건을 면접 합격 처리하시겠습니까?`,
    confirmText: '합격',
    onConfirm,
  })
}

function hasProcessedInterview2Selection(
  rows: readonly UjatVolunteerInterview2ResultSelectRow[]
): boolean {
  return rows.some(row => !isUjatVolunteerInterview2SelectableForResult(row))
}

/** 목록 일괄 합격 — 선택 건수·이미 처리 행 검증 후 BulkPassModal 오픈 */
export function openUjatVolunteerInterview2BulkPassModal({
  selectedIds,
  selectedRows,
  onOpen,
}: {
  selectedIds: string[]
  selectedRows: readonly UjatVolunteerInterview2ResultSelectRow[]
  onOpen: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  if (hasProcessedInterview2Selection(selectedRows)) {
    cmsAlertModal.show(buildInterview2ProcessedSelectionAlert('volunteer'))
    return
  }
  onOpen()
}
