import { DeleteGuideModal, buildDomainEntityDeleteMessageLines } from '@/shared/ui'

export interface SponsorDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  sponsorName: string
}

export function SponsorDeleteModal({
  open,
  onCancel,
  onConfirm,
  sponsorName,
}: SponsorDeleteModalProps) {
  const lines = buildDomainEntityDeleteMessageLines(
    sponsorName.trim() ? [sponsorName.trim()] : [],
    '후원사'
  )

  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="후원사 삭제"
      lines={lines}
      confirmText="후원사 삭제"
      requiredConfirmInput="삭제"
      confirmInputPlaceholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요."
    />
  )
}
