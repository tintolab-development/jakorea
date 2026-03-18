/**
 * 강사 배정 완료 안내 모달
 * 배정 처리 직후 노출. 승인&배정이 함께 이뤄진 경우에만 "승인 알람 발송" 영역 노출.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import { ApprovalAlarmSendSection } from './approval-alarm-send-section'
import './school-detail-assign-complete-modal.css'

export interface SchoolDetailAssignCompleteModalProps {
  open: boolean
  onClose: () => void
  /** 배정된 강사명 */
  instructorName: string
  /** 배정 대상 기관명 */
  schoolName: string
  /** 현재 배정 인원 (배정 반영 후 기준) */
  currentCount: number
  /** 필요 배정 인원 수 */
  requiredCount: number
  /** true면 승인 알람 발송 영역 노출 (승인+배정 동시 처리 시) */
  showApprovalAlarmSection?: boolean
}

export function SchoolDetailAssignCompleteModal({
  open,
  onClose,
  instructorName,
  schoolName,
  currentCount,
  requiredCount,
  showApprovalAlarmSection = false,
}: SchoolDetailAssignCompleteModalProps) {
  const footer = (
    <AppButton variant="primary" size="large" modalTeal onClick={onClose}>
      확인
    </AppButton>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 배정 완료 안내"
      width={560}
      footer={footer}
      className="school-detail-assign-complete-modal"
    >
      <div className="school-detail-assign-complete-modal__body">
        <p className="school-detail-assign-complete-modal__main">
          [<strong>{instructorName}</strong>] 강사님의 [<strong>{schoolName}</strong>] 배정이
          완료되었습니다.
        </p>
        <p className="school-detail-assign-complete-modal__sub">
          (현재 배정 인원 : {currentCount}/{requiredCount}명)
        </p>
        {showApprovalAlarmSection && (
          <div className="school-detail-assign-complete-modal__alarm">
            <ApprovalAlarmSendSection />
          </div>
        )}
      </div>
    </ContentModal>
  )
}
