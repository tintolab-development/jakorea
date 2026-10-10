import { ContentModal, CmsButton } from '@/shared/ui'

const Z = 1100
const WIDTH = 600

export type NoticeCategoryDuplicateAlertModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

export function NoticeCategoryDuplicateAlertModal({
  open,
  onClose,
  zIndex = Z,
}: NoticeCategoryDuplicateAlertModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="카테고리명 중복 안내"
      width={WIDTH}
      zIndex={zIndex}
      className="notice-category-delete-blocked-modal"
      description={'동일한 카테고리명이 존재합니다.'}
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
