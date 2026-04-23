import { CmsButton } from './cms-button'
import { ContentModal } from './content-modal'

export interface ProgramHistoryDeleteBlockedModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 프로그램 이력 일괄 삭제 시 — 진행 중인 건이 포함된 경우 안내.
 * 레이아웃은 `institution-delete-blocked-modal.tsx` 와 동일(ContentModal 480·단일 확인 버튼).
 */
export function ProgramHistoryDeleteBlockedModal({ open, onClose }: ProgramHistoryDeleteBlockedModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="이력 삭제 불가 안내"
      width={480}
      description={
        <>
          <span className="fs-16">진행 중인 프로그램 정보는 삭제 불가합니다.</span>
        </>
      }
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
