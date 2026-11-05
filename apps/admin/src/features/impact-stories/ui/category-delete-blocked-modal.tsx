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
      title="카테고리 삭제 불가 안내"
      width={WIDTH}
      zIndex={zIndex}
      className="is-category-delete-blocked"
      description="등록된 게시글이 있는 카테고리는 삭제할 수 없습니다."
      footer={
        <CmsButton variant="primary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
