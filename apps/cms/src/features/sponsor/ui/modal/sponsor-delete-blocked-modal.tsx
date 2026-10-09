import { ContentModal, CmsButton } from '@/shared/ui'

const SPONSOR_DELETE_BLOCKED_DESCRIPTION =
  '현재 진행중인 프로그램이 있습니다.\n후원사를 삭제하려면 진행중인 프로그램을 삭제하거나 후원사를 제외해주세요.'

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
      description={SPONSOR_DELETE_BLOCKED_DESCRIPTION}
      footer={
        <CmsButton variant="primary" size="medium" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
