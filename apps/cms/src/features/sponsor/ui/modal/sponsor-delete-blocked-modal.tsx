import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './sponsor-delete-blocked-modal.css'

export interface SponsorDeleteBlockedModalProps {
  open: boolean
  onClose: () => void
}

export function SponsorDeleteBlockedModal({ open, onClose }: SponsorDeleteBlockedModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="후원사 삭제 불가"
      width={600}
      footer={
        <CmsButton variant="primary" size="medium" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      <div className="sponsor-delete-blocked-modal__content">
        <span>현재 진행중인 프로그램이 있습니다.</span>
        <br />
        <span>후원사를 삭제하려면 진행중인 프로그램을 삭제하거나 후원사를 제외해주세요.</span>
      </div>
    </ContentModal>
  )
}
