import { useMemo } from 'react'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { resolveSponsorContactDeleteConfirmCopy } from '@/features/sponsor/lib/sponsor-contact-delete-copy'

export interface SponsorContactDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  contactNames: string[]
  confirmLoading?: boolean
}

export function SponsorContactDeleteModal({
  open,
  onCancel,
  onConfirm,
  contactNames,
  confirmLoading = false,
}: SponsorContactDeleteModalProps) {
  const copy = useMemo(
    () => resolveSponsorContactDeleteConfirmCopy(contactNames),
    [contactNames]
  )

  return (
    <NoticeDeleteConfirmModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={copy.title}
      line1={copy.line1}
      line2={copy.line2}
      confirmLoading={confirmLoading}
    />
  )
}
