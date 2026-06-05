/**
 * 일반 프로그램 — 강사 반려 취소 확인
 * - alreadySent(1번 시안): PermissionModal — 알림 발송 + 취소 사유 → 완료 모달
 * - pendingNotification(2번 시안): ContentModal — 안내 확인 → 완료 모달
 */

import {
  buildInstructorCancelRejectionMessage,
  resolveInstructorCancelRejectionNotifyVariant,
  type InstructorCancelRejectionConfirmPayload,
  type InstructorCancelRejectionNotifyVariant,
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

export function resolveInstructorCancelRejectionNotifyVariantFromRow(
  instructor: ApplicantInstructorRow | null
): InstructorCancelRejectionNotifyVariant {
  if (!instructor) return 'pendingNotification'
  return resolveInstructorCancelRejectionNotifyVariant(instructor)
}

function InstructorCancelRejectPendingNotificationModal({
  open,
  instructorName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  instructorName: string
  onCancel: () => void
  onConfirm: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 반려 취소 안내"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="instructor-cancel-reject-modal"
      description={buildInstructorCancelRejectionMessage(
        instructorName,
        'pendingNotification'
      )}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="delete" size="medium" type="button" onClick={onConfirm}>
            반려 취소
          </CmsButton>
        </>
      }
    >
      {null}
    </ContentModal>
  )
}

function InstructorCancelRejectAlreadySentModal({
  open,
  instructorName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  instructorName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="instructor-cancel-reject-modal"
      title="강사 반려 취소 안내"
      message={buildInstructorCancelRejectionMessage(instructorName, 'alreadySent')}
      confirmLabel="반려 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions="two"
      notifyBeforeReason
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

export function InstructorCancelRejectModal({
  open,
  instructor,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: InstructorCancelRejectModalProps) {
  const variant = resolveInstructorCancelRejectionNotifyVariantFromRow(instructor)
  const instructorName = instructor?.instructorName ?? ''

  if (variant === 'pendingNotification') {
    return (
      <InstructorCancelRejectPendingNotificationModal
        open={open}
        instructorName={instructorName}
        onCancel={onCancel}
        onConfirm={() => onConfirm({ variant: 'pendingNotification' })}
        zIndex={zIndex}
      />
    )
  }

  return (
    <InstructorCancelRejectAlreadySentModal
      open={open}
      instructorName={instructorName}
      onCancel={onCancel}
      onConfirm={payload => {
        onConfirm({
          variant: 'alreadySent',
          reason: payload.reason,
          notifyTiming: payload.notifyTiming,
          manualNotifyAt: payload.manualNotifyAt,
        })
      }}
      zIndex={zIndex}
    />
  )
}
