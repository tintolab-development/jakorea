/**
 * 카테고리 삭제 불가 — 해당 카테고리에 게시물·문의·FAQ 등이 있을 때
 */

import { useMemo } from 'react'
import {
  type CategoryDeleteBlockedKind,
  resolveCategoryDeleteBlockedDescription,
} from '@/features/posts/ui/category-delete-blocked-copy'
import { resolveDeleteBlockedGuideCopy } from '@/shared/lib/delete-blocked-guide-copy'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'

const DEFAULT_Z = 1100

export type CategoryDeleteBlockedModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
  /** 미지정 시 `notice` */
  kind?: CategoryDeleteBlockedKind
  /** `kind` 기본 문구 override */
  description?: string
}

export function CategoryDeleteBlockedModal({
  open,
  onClose,
  zIndex = DEFAULT_Z,
  kind = 'notice',
  description,
}: CategoryDeleteBlockedModalProps) {
  const reasonLine = resolveCategoryDeleteBlockedDescription(kind, description)
  const copy = useMemo(
    () =>
      resolveDeleteBlockedGuideCopy({
        entityLabel: '카테고리',
        reasonLine,
        selectedCount: 1,
      }),
    [reasonLine]
  )

  return (
    <DeleteBlockedGuideModal
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      zIndex={zIndex}
      className="notice-category-delete-blocked-modal"
    />
  )
}
