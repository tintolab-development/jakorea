import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './institution-select-assign-modals.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

export interface InstitutionAssignCompleteModalProps {
  open: boolean
  onClose: () => void
  institutionName: string
  instructorName: string
}

export function InstitutionAssignCompleteModal({
  open,
  onClose,
  institutionName,
  instructorName,
}: InstitutionAssignCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 배정 완료"
      width={MODAL_WIDTH}
      zIndex={MODAL_Z_INDEX}
      footer={
        <div className="institution-assign-confirm__footer">
          <CmsButton variant="primary" size="medium" onClick={onClose}>
            확인
          </CmsButton>
        </div>
      }
    >
      <div className="institution-assign-confirm">
        <p className="institution-assign-confirm__message">
          <strong>[{institutionName}]</strong>
          {'에 '}
          <strong>[{instructorName}]</strong>
          {' 님의 배정이 완료되었습니다.'}
        </p>
      </div>
    </ContentModal>
  )
}
