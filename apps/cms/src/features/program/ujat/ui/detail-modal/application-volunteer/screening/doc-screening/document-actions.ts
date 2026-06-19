import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { UjatDocumentScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'

export type UjatDocumentScreeningConfirmRequest = {
  title: string
  content: string
  confirmText: string
  danger?: boolean
  onConfirm: () => void
}

export function patchUjatVolunteerDocumentScreeningStatus(
  rows: UjatVolunteerApplicantRow[],
  ids: string[],
  status: UjatDocumentScreeningStatus
): UjatVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row => (idSet.has(row.id) ? { ...row, documentScreeningStatus: status } : row))
}

export function confirmUjatVolunteerDocumentReject({
  showConfirm,
  count,
  onConfirm,
}: {
  showConfirm: (options: UjatDocumentScreeningConfirmRequest) => void
  count: number
  onConfirm: () => void
}): void {
  if (count === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '반려할 항목을 선택해 주세요.',
    })
    return
  }
  showConfirm({
    title: count === 1 ? '서류 반려' : '선택 반려',
    content:
      count === 1
        ? '해당 지원자를 서류 불합격 처리하시겠습니까?'
        : `선택한 ${count}건을 서류 불합격 처리하시겠습니까?`,
    confirmText: '반려',
    danger: true,
    onConfirm,
  })
}

export function confirmUjatVolunteerDocumentApprove({
  showConfirm,
  count,
  onConfirm,
}: {
  showConfirm: (options: UjatDocumentScreeningConfirmRequest) => void
  count: number
  onConfirm: () => void
}): void {
  if (count === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '승인할 항목을 선택해 주세요.',
    })
    return
  }
  showConfirm({
    title: count === 1 ? '서류 승인' : '선택 승인',
    content:
      count === 1
        ? '해당 지원자를 서류 합격 처리하시겠습니까?'
        : `선택한 ${count}건을 서류 합격 처리하시겠습니까?`,
    confirmText: '승인',
    onConfirm,
  })
}
