import { ContentModal, CmsButton } from '@/shared/ui'

const Z = 1100
const WIDTH = 600

export type BusinessAreaDeleteBlockedModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

export function BusinessAreaDeleteBlockedModal({
  open,
  onClose,
  zIndex = Z,
}: BusinessAreaDeleteBlockedModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="사업 분야 삭제 불가 안내"
      width={WIDTH}
      zIndex={zIndex}
      className="business-area-delete-blocked-modal notice-category-delete-blocked-modal"
      description="등록된 교재가 있는 사업 분야는 삭제할 수 없습니다."
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
