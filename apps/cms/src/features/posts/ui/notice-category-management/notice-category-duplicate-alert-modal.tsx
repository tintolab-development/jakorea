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
      title="카테고리 중복 안내"
      width={WIDTH}
      zIndex={zIndex}
      className="notice-category-delete-blocked-modal"
      description={'동일한 카테고리명이 이미 등록되어 있습니다.\n다른 명칭으로 입력해 주세요.'}
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
