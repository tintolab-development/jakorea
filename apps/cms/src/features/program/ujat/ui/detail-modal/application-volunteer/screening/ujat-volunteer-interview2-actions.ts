import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { patchUjatVolunteerSecondInterviewScreeningStatus } from '@/data/mock/ujat-volunteer-applicants-mock'

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
      content: '불합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  showConfirm({
    title: count === 1 ? '면접 불합격' : '선택 불합격',
    content:
      count === 1
        ? '해당 지원자를 면접 불합격 처리하시겠습니까?'
        : `선택한 ${count}건을 면접 불합격 처리하시겠습니까?`,
    confirmText: '불합격',
    danger: true,
    onConfirm,
  })
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
