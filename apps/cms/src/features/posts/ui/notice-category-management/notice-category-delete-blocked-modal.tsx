/**
 * 카테고리 삭제 불가 — 등록된 게시물이 있을 때(더블 모달 상단)
 */

import { ContentModal, CmsButton } from '@/shared/ui'

const Z = 1100
const WIDTH = 600

export type NoticeCategoryDeleteBlockedModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

export function NoticeCategoryDeleteBlockedModal({
  open,
  onClose,
  zIndex = Z,
}: NoticeCategoryDeleteBlockedModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="카테고리 삭제 불가"
      width={WIDTH}
      zIndex={zIndex}
      className="notice-category-delete-blocked-modal"
      description={
        '현재 해당 카테고리에 등록된 게시물이 있습니다.\n카테고리를 삭제하려면 등록된 게시물을 삭제하거나 다른 카테고리로 변경해 주세요.'
      }
      footer={
        <CmsButton variant="primary" size="large" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
