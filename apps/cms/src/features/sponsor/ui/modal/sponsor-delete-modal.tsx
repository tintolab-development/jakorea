import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
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
      requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
      confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
    />
  )
}
