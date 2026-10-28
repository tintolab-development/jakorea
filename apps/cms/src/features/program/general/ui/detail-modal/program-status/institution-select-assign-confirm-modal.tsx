import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { formatAssignedInstructorCountLine } from '@/features/program/general/lib/institution-select-assign'
import './institution-select-assign-modals.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

export interface InstitutionSelectAssignConfirmModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  institutionName: string
  instructorName: string
  currentCount: number | null
  requiredCount: number | null
  confirmLoading?: boolean
}

export function InstitutionSelectAssignConfirmModal({
  open,
  onCancel,
  onConfirm,
  institutionName,
  instructorName,
  currentCount,
  requiredCount,
  confirmLoading = false,
}: InstitutionSelectAssignConfirmModalProps) {
  const countLine = formatAssignedInstructorCountLine(currentCount, requiredCount)

  return (
    <ContentModal
      open={open}
      onCancel={confirmLoading ? () => undefined : onCancel}
      title="기관 선택 배정 안내"
      width={MODAL_WIDTH}
      zIndex={MODAL_Z_INDEX}
      footer={
        <div className="institution-assign-confirm__footer">
          <CmsButton
            variant="secondary"
            size="medium"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={onConfirm}
          >
            배정
          </CmsButton>
        </div>
      }
    >
      <div className="institution-assign-confirm">
        <div>
          <p className="institution-assign-confirm__message">
            <strong>[{institutionName}]</strong>
            {'에 '}
            <strong>[{instructorName}]</strong>
            {' 님을 배정하시겠습니까?'}
          </p>
          {countLine ? (
            <p className="institution-assign-confirm__count">{countLine}</p>
          ) : null}
        </div>
      </div>
    </ContentModal>
  )
}
