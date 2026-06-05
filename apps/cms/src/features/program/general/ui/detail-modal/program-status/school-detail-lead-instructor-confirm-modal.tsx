/**
 * 대표 강사 지정 변경 확인 모달
 * 추가 배정 · 배정된 강사 역할 변경 시 기존 대표 강사가 있을 때 노출
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './school-detail-lead-instructor-confirm-modal.css'

/** 부모 모달(강사 배정 안내 등) 위 중첩 표시 */
const DEFAULT_LEAD_CONFIRM_Z_INDEX = 2600
const LEAD_CONFIRM_MODAL_WIDTH = 600

export interface SchoolDetailLeadInstructorConfirmModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  /** 현재 대표 강사명 */
  currentLeadInstructorName: string
  /** 변경 대상 강사명 */
  newLeadInstructorName: string
  zIndex?: number
}

export function SchoolDetailLeadInstructorConfirmModal({
  open,
  onCancel,
  onConfirm,
  currentLeadInstructorName,
  newLeadInstructorName,
  zIndex = DEFAULT_LEAD_CONFIRM_Z_INDEX,
}: SchoolDetailLeadInstructorConfirmModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="대표 강사 지정 안내"
      width={LEAD_CONFIRM_MODAL_WIDTH}
      zIndex={zIndex}
      className="school-detail-lead-instructor-confirm-modal"
      footer={
        <div className="school-detail-lead-instructor-confirm-modal__footer">
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large" onClick={onConfirm}>
            변경
          </CmsButton>
        </div>
      }
    >
      <div className="school-detail-lead-instructor-confirm-modal__body">
        <p>
          현재 [<strong>{currentLeadInstructorName}</strong>] 강사가 대표 강사로 지정되어 있습니다.
        </p>
        <p>
          [<strong>{newLeadInstructorName}</strong>] 강사로 대표 강사를 변경하시겠습니까?
        </p>
      </div>
    </ContentModal>
  )
}
