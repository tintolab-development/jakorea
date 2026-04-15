import { CmsButton } from './cms-button'
import { ContentModal } from './content-modal'

export interface ActionResultModalProps {
  open: boolean
  action: string
  onClose: () => void
  zIndex?: number
}

/**
 * 등록/수정/삭제 완료 안내 공통 모달입니다.
 * 제목은 `{action} 완료`, 본문은 `{action}가 완료 되었습니다.` 형식으로 렌더링됩니다.
 */
export function ActionResultModal({ open, action, onClose, zIndex }: ActionResultModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={`${action} 완료`}
      width={420}
      zIndex={zIndex}
      footer={
        <CmsButton variant="secondary" width={70} type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      <span style={{ fontSize: '16px', lineHeight: '150%' }}>{`${action} 완료 되었습니다.`}</span>
    </ContentModal>
  )
}
