import { useMemo } from 'react'
import { SPONSOR_DELETE_BLOCKED_REASON } from '@/features/sponsor/lib/sponsor-delete-blocked-copy'
import { resolveDeleteBlockedGuideCopy } from '@/shared/lib/delete-blocked-guide-copy'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'

export interface SponsorDeleteBlockedModalProps {
  open: boolean
  onClose: () => void
  /** 단건 1 · 일괄 2+ */
  selectedCount?: number
}

export function SponsorDeleteBlockedModal({
  open,
  onClose,
  selectedCount = 1,
}: SponsorDeleteBlockedModalProps) {
  const copy = useMemo(
    () =>
      resolveDeleteBlockedGuideCopy({
        entityLabel: '후원사',
        reasonLine: SPONSOR_DELETE_BLOCKED_REASON,
        selectedCount,
      }),
    [selectedCount]
  )

  return (
    <DeleteBlockedGuideModal
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
    />
  )
}
