/**
 * 문의 카테고리 삭제 불가 — 해당 카테고리 문의가 있을 때
 */

import { ContentModal, CmsButton } from '@/shared/ui'

const Z = 1100
const WIDTH = 600

export type InquiryCategoryDeleteBlockedModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

export function InquiryCategoryDeleteBlockedModal({
  open,
  onClose,
  zIndex = Z,
}: InquiryCategoryDeleteBlockedModalProps) {
  const description = (
    <div className="notice-category-delete-blocked-modal__copy">
      <p>현재 해당 카테고리에 등록된 문의가 있습니다.</p>
      <p>
        카테고리를 삭제하려면 해당 문의를 삭제하거나 다른 카테고리로 변경해 주세요.
      </p>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="카테고리 삭제 불가"
      width={WIDTH}
      zIndex={zIndex}
      className="notice-category-delete-blocked-modal"
      description={description}
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
