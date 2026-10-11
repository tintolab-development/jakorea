import { useMemo } from 'react'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import {
  buildSponsorDeleteMessageLines,
  resolveSponsorDeleteModalConfirmText,
  resolveSponsorDeleteModalTitle,
  type SponsorDeleteMessagePreset,
} from '@/features/sponsor/lib/sponsor-delete-guide-messages'
import { DeleteGuideModal } from '@/shared/ui'

export interface SponsorDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  /** 삭제 대상 후원사명 (단건·일괄) */
  sponsorNames: string[]
  /** 목록: 단건/일괄 안내 카피 · 상세: 기존 후원사 삭제 카피 */
  presentation?: SponsorDeleteMessagePreset
  confirmLoading?: boolean
}

export function SponsorDeleteModal({
  open,
  onCancel,
  onConfirm,
  sponsorNames,
  presentation = 'detail',
  confirmLoading = false,
}: SponsorDeleteModalProps) {
  const trimmedNameCount = useMemo(
    () => sponsorNames.map(name => name.trim()).filter(Boolean).length,
    [sponsorNames]
  )

  const lines = useMemo(
    () => buildSponsorDeleteMessageLines(sponsorNames, presentation),
    [presentation, sponsorNames]
  )

  const title = resolveSponsorDeleteModalTitle(presentation, trimmedNameCount)
  const confirmText = resolveSponsorDeleteModalConfirmText(presentation)

  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      lines={lines}
      confirmText={confirmText}
      requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
      confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
      confirmLoading={confirmLoading}
    />
  )
}
