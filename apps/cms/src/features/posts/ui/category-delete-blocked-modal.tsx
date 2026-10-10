/**
 * 카테고리 삭제 불가 — 해당 카테고리에 게시물·문의·FAQ 등이 있을 때
 */

import { ContentModal, CmsButton } from '@/shared/ui'
import {
  type CategoryDeleteBlockedKind,
  resolveCategoryDeleteBlockedDescription,
} from '@/features/posts/ui/category-delete-blocked-copy'

const DEFAULT_Z = 1100
const WIDTH = 600

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
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="카테고리 삭제 불가 안내"
      width={WIDTH}
      zIndex={zIndex}
      className="notice-category-delete-blocked-modal"
      description={resolveCategoryDeleteBlockedDescription(kind, description)}
      footer={
        <CmsButton variant="secondary" size="h40" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
