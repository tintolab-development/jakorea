import { DeleteGuideModal } from '@/features/program/ui/manager-delete-guide-modal'

export interface SponsorDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  sponsorName: string
}

function buildSponsorDeleteLines(sponsorName: string): string[] {
  if (!sponsorName.trim()) return []
  return [
    `[${sponsorName}]를 후원사에서 삭제하시겠습니까?`,
    '후원사에서 삭제 시 관련 정보들도 모두 삭제됩니다.',
    '삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
  ]
}

export function SponsorDeleteModal({
  open,
  onCancel,
  onConfirm,
  sponsorName,
}: SponsorDeleteModalProps) {
  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="후원사 삭제"
      lines={buildSponsorDeleteLines(sponsorName)}
      confirmText="후원사 삭제"
      requiredConfirmInput="삭제"
      confirmInputPlaceholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요."
    />
  )
}
