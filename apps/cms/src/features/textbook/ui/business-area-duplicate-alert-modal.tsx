import { ContentModal, CmsButton } from '@/shared/ui'

const Z = 1100
const WIDTH = 600

export type BusinessAreaDuplicateAlertModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

/** Notion: 동일한 사업 분야명이 존재하는 경우 중복 안내 팝업 */
export function BusinessAreaDuplicateAlertModal({
  open,
  onClose,
  zIndex = Z,
}: BusinessAreaDuplicateAlertModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="사업 분야명 중복 안내"
      width={WIDTH}
      zIndex={zIndex}
      className="business-area-delete-blocked-modal notice-category-delete-blocked-modal"
      description="동일한 사업 분야명이 존재합니다."
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
