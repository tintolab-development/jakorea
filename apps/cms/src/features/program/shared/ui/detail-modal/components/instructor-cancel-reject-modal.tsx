/**
 * 일반 프로그램 — 강사 반려 취소 확인
 * 반려 알림 발송 여부에 따라 PermissionModal(발송됨) / ContentModal(미발송) 분기
 */

import {
  buildInstructorCancelRejectionMessage,
  resolveInstructorCancelRejectionNotifyVariant,
  type InstructorCancelRejectionConfirmPayload,
} from '@/features/program/general/lib/instructor-cancel-rejection'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-bulk-approve-modal.css'
import './instructor-cancel-reject-modal.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

export type { InstructorCancelRejectionConfirmPayload }

export type InstructorCancelRejectModalProps = {
  open: boolean
  instructor: ApplicantInstructorRow | null
  onCancel: () => void
  onConfirm: (payload: InstructorCancelRejectionConfirmPayload) => void
  zIndex?: number
}

export function InstructorCancelRejectModal({
  open,
  instructor,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: InstructorCancelRejectModalProps) {
  const instructorName = instructor?.instructorName ?? ''
  const variant = instructor
    ? resolveInstructorCancelRejectionNotifyVariant(instructor)
    : 'pendingNotification'

  if (variant === 'pendingNotification') {
    return (
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="강사 반려 취소 안내"
        width={MODAL_WIDTH}
        zIndex={zIndex}
        className="instructor-cancel-reject-modal"
        description={buildInstructorCancelRejectionMessage(instructorName, variant)}
        footer={
          <div className="content-modal__footer-actions">
            <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              onClick={() => onConfirm({ variant: 'pendingNotification' })}
            >
              반려 취소
            </CmsButton>
          </div>
        }
      >
        {null}
      </ContentModal>
    )
  }

  const handleConfirm = (payload: PermissionModalPayload) => {
    onConfirm({
      variant: 'alreadySent',
      reason: payload.reason,
      notifyTiming: payload.notifyTiming,
      manualNotifyAt: payload.manualNotifyAt,
    })
  }

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="instructor-cancel-reject-modal"
      title="강사 반려 취소 안내"
      message={buildInstructorCancelRejectionMessage(instructorName, variant)}
      confirmLabel="반려 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions="two"
      notifyBeforeReason
      onCancel={onCancel}
      onConfirm={handleConfirm}
      zIndex={zIndex}
    />
  )
}
