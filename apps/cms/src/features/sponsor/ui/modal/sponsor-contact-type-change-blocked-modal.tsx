import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './sponsor-contact-type-change-blocked-modal.css'

export interface SponsorContactTypeChangeBlockedModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 유일한 주 담당자를 일반 담당자로 바꾸려 할 때 노출하는 안내 모달 (시안·노션).
 */
export function SponsorContactTypeChangeBlockedModal({
  open,
  onClose,
}: SponsorContactTypeChangeBlockedModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="후원 담당자 유형 변경 불가 안내"
      width={600}
      footer={
        <CmsButton variant="secondary" size="h40" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      <div className="sponsor-contact-type-change-blocked-modal__content">
        <span>주 담당자는 반드시 1명이 지정되어야 합니다.</span>
        <br />
        <span>다른 구성원을 주 담당자로 지정해 주세요.</span>
        <br />
        <span>기존의 주 담당자는 자동으로 일반 담당자로 전환됩니다.</span>
      </div>
    </ContentModal>
  )
}
