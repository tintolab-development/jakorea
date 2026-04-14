import { DeleteGuideModal } from '@/features/program/ui/manager-delete-guide-modal'

export interface SponsorContactDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  contactNames: string[]
}

function buildSponsorContactDeleteLines(names: string[]): string[] {
  if (names.length === 0) return []
  if (names.length === 1) {
    return [`[${names[0]}] 담당자를 목록에서 삭제하시겠습니까?`]
  }

  return [`선택한 ${names.length}명의 담당자를 후원사 담당자 목록에서 삭제하시겠습니까?`]
}

export function SponsorContactDeleteModal({
  open,
  onCancel,
  onConfirm,
  contactNames,
}: SponsorContactDeleteModalProps) {
  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="담당자 삭제"
      lines={buildSponsorContactDeleteLines(contactNames)}
      confirmText="담당자 삭제"
    />
  )
}
