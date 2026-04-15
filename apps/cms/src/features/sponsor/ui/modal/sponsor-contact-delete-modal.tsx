import { DeleteGuideModal, buildDomainEntityDeleteMessageLines } from '@/shared/ui'

export interface SponsorContactDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  contactNames: string[]
}

export function SponsorContactDeleteModal({
  open,
  onCancel,
  onConfirm,
  contactNames,
}: SponsorContactDeleteModalProps) {
  const lines = buildDomainEntityDeleteMessageLines(contactNames, '후원사 담당자 목록')

  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="담당자 삭제"
      lines={lines}
      confirmText="담당자 삭제"
      requiredConfirmInput="삭제"
      confirmInputPlaceholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요."
    />
  )
}
