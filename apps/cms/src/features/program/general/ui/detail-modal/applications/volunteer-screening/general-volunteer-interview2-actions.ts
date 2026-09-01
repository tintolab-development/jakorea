import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export function requestGeneralVolunteerInterview2BulkPass({
  selectedIds,
  onOpenSinglePass,
  onOpenBulkPass,
}: {
  selectedIds: string[]
  onOpenSinglePass: () => void
  onOpenBulkPass: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  if (selectedIds.length === 1) {
    onOpenSinglePass()
    return
  }
  onOpenBulkPass()
}

export function requestGeneralVolunteerInterview2BulkFail({
  selectedIds,
  onOpenSingleFail,
  onOpenBulkFail,
}: {
  selectedIds: string[]
  onOpenSingleFail: () => void
  onOpenBulkFail: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '불합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleFail()
    return
  }
  onOpenBulkFail()
}
