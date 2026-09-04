import { useMemo } from 'react'
import { DeleteGuideModal } from '@/shared/ui'

export interface SponsorContactDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  contactNames: string[]
}

function buildSponsorContactDeleteMessageLines(names: string[]): string[] {
  const trimmed = names.map(n => n.trim()).filter(Boolean)
  if (trimmed.length === 0) return []

  if (trimmed.length === 1) {
    return [`[${trimmed[0]}] 담당자를 목록에서 삭제하시겠습니까?`]
  }

  const count = trimmed.length
  return [`선택한 ${count}명의 담당자를 목록에서 삭제하시겠습니까?`]
}

export function SponsorContactDeleteModal({
  open,
  onCancel,
  onConfirm,
  contactNames,
}: SponsorContactDeleteModalProps) {
  const lines = useMemo(() => buildSponsorContactDeleteMessageLines(contactNames), [contactNames])

  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="후원사 담당자 삭제"
      lines={lines}
      confirmText="담당자 삭제"
    />
  )
}
