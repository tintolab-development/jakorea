import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { buildSponsorDeleteMessageLines } from '@/features/sponsor/lib/sponsor-delete-guide-messages'
import { DeleteGuideModal } from '@/shared/ui'

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
  const lines = buildSponsorDeleteMessageLines(
    sponsorName.trim() ? [sponsorName.trim()] : []
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
