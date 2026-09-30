import { useMemo } from 'react'
import { PlatformPreviewModal } from '@/features/program/shared/ui/platform-preview/platform-preview-modal'
import {
  buildPlatformPreviewMessage,
  toPreviewAttachments,
} from '@/features/program/shared/lib/platform-preview/build-message'
import type { GeminiRecruitmentAddFormSnapshot } from '../../lib/recruitment/add-local-save'
import { buildGeminiRecruitmentPortalPreview } from '../../lib/recruitment/platform-preview-payload'

export function GeminiRecruitmentAddPreviewModal({
  open,
  snapshot,
  onClose,
}: {
  open: boolean
  snapshot: GeminiRecruitmentAddFormSnapshot | null
  onClose: () => void
}) {
  const message = useMemo(() => {
    if (!open || snapshot == null) return null
    return buildPlatformPreviewMessage(buildGeminiRecruitmentPortalPreview(snapshot), {
      attachments: toPreviewAttachments(snapshot.attachmentFileNames),
    })
  }, [open, snapshot])

  if (snapshot == null) return null

  return (
    <PlatformPreviewModal open={open} onClose={onClose} title="공고 미리보기" message={message} />
  )
}
