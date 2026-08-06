/**
 * 카테고리 삭제 불가 — 등록된 게시글이 있을 때
 */

import { ContentModal, CmsButton } from '@/shared/ui'

import './category-management-modal.css'

const Z = 1100
const WIDTH = 600

type Props = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

export function CategoryDeleteBlockedModal({ open, onClose, zIndex = Z }: Props) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="카테고리 삭제 불가"
      width={WIDTH}
      zIndex={zIndex}
      className="is-category-delete-blocked"
      description={
        '현재 해당 카테고리에 등록된 게시글이 있습니다.\n카테고리를 삭제하려면 등록된 게시글을 삭제하거나 다른 카테고리로 변경해 주세요.'
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
