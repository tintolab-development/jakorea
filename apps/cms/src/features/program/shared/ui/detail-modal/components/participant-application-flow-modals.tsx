/**
 * 일반 프로그램 — 개인(참여자) 신청 승인·반려 플로우 모달
 * 기관(Institution*) 모달과 동일 PermissionModal·ContentModal 패턴, 카피만 참여자 명칭으로 변경
 */

import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import {
  buildParticipantCancelApprovalMessage,
  resolveParticipantCancelApprovalNotifyVariant,
  resolveParticipantCancelApprovalReasonLabel,
} from '@/features/program/general/lib/participant-cancel-approval'
import {
  buildParticipantCancelRejectionMessage,
  resolveParticipantCancelRejectionNotifyVariant,
  type ParticipantCancelRejectionConfirmPayload,
} from '@/features/program/general/lib/participant-cancel-rejection'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui/cms-button'
import './instructor-bulk-approve-modal.css'
import './instructor-approval-complete-modal.css'
import './instructor-reject-complete-modal.css'
import './instructor-bulk-approve-complete-modal.css'
import './instructor-bulk-reject-complete-modal.css'
import './instructor-cancel-approval-complete-modal.css'
import './instructor-cancel-reject-modal.css'

const MODAL_WIDTH = 600
const FLOW_MODAL_Z = 2500
const COMPLETE_MODAL_Z = 2550

export type { ParticipantCancelRejectionConfirmPayload }

// ——— 승인 ———

export function buildParticipantApproveMessage(participantName: string): string {
  const subject = formatModalBracketedSubjectName(participantName, '참여자')
  return `${subject}의 프로그램 참여를 승인하시겠습니까?\n승인 시 해당 참여자에게 승인 알림이 발송됩니다.`
}

export function ParticipantApproveModal({
  open,
  participantName,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  participantName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="participant-approve-modal"
      title="참여자 승인 안내"
      message={buildParticipantApproveMessage(participantName)}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

export function buildParticipantApprovalCompleteDescription(participantName: string): string {
  const trimmedName = participantName.trim() || '참여자'
  return `${formatModalBracketedSubjectName(trimmedName, '참여자')}의 프로그램 참여가 ${formatModalBoldPhrase('승인')} 되었습니다.`
}

export function ParticipantApprovalCompleteModal({
  open,
  participantName,
  onClose,
  zIndex = COMPLETE_MODAL_Z,
}: {
  open: boolean
  participantName: string
  onClose: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="참여자 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="participant-approval-complete-modal"
      description={buildParticipantApprovalCompleteDescription(participantName)}
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

// ——— 반려 ———

export function buildParticipantRejectMessage(participantName: string): string {
  const subject = formatModalBracketedSubjectName(participantName, '참여자')
  return `${subject}의 프로그램 참여를 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 해당 참여자에게 전달되며, 알림이 발송됩니다.`
}

export function ParticipantRejectModal({
  open,
  participantName,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  participantName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="participant-reject-modal"
      title="참여자 반려 안내"
      message={buildParticipantRejectMessage(participantName)}
      confirmLabel="반려"
      confirmVariant="delete"
      requireReason
      reasonLabel="반려 사유"
      reasonPlaceholder="반려 사유를 입력해 주세요."
      reasonRequiredMessage="반려 사유를 입력해 주세요."
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

export function buildParticipantRejectCompleteDescription(
  participantName: string,
  rejectionReason: string
): string {
  const trimmedName = participantName.trim() || '참여자'
  const trimmedReason = rejectionReason.trim() || '-'
  return `${formatModalBracketedSubjectName(trimmedName, '참여자')}의 프로그램 참여가 ${formatModalBoldPhrase('반려')} 되었습니다.\n(사유 : ${trimmedReason})`
}

export function ParticipantRejectCompleteModal({
  open,
  participantName,
  rejectionReason,
  onClose,
  zIndex = COMPLETE_MODAL_Z,
}: {
  open: boolean
  participantName: string
  rejectionReason: string
  onClose: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="참여자 반려 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="participant-reject-complete-modal"
      description={buildParticipantRejectCompleteDescription(participantName, rejectionReason)}
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

// ——— 일괄 승인·반려 ———

export function ParticipantBulkApproveModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="participant-bulk-approve-modal"
      title="참여자 일괄 승인 안내"
      message={`선택한 **${selectionCount}개**의 모든 참여자의 프로그램 참여를 일괄 승인하시겠습니까?\n승인 시 각 참여자에게 개별로 승인 알림이 발송됩니다.`}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

export function ParticipantBulkApproveCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = COMPLETE_MODAL_Z,
}: {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="참여자 일괄 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="participant-bulk-approve-complete-modal"
      description={`선택한 **${selectionCount}개**의 모든 참여자의 프로그램 참여가 일괄 승인 되었습니다.`}
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

export function ParticipantBulkRejectModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="participant-bulk-reject-modal"
      title="참여자 일괄 반려 안내"
      message={`선택한 **${selectionCount}개**의 모든 참여자의 프로그램 참여를 일괄 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 각 참여자에게 개별로 전달되며, 알림이 발송됩니다.`}
      confirmLabel="반려"
      confirmVariant="delete"
      requireReason
      reasonLabel="반려 사유"
      reasonPlaceholder="반려 사유를 입력해 주세요."
      reasonRequiredMessage="반려 사유를 입력해 주세요."
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

export function ParticipantBulkRejectCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = COMPLETE_MODAL_Z,
}: {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="참여자 일괄 반려 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="participant-bulk-reject-complete-modal"
      description={`선택한 **${selectionCount}개**의 모든 참여자의 프로그램 참여가 일괄 반려 되었습니다.`}
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

// ——— 승인 취소 ———

export function ParticipantCancelApprovalModal({
  open,
  participant,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  participant: GeneralIndividualApplicantRow | null
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  const variant = participant
    ? resolveParticipantCancelApprovalNotifyVariant(participant)
    : 'alreadySent'
  const participantName = participant?.applicantName ?? ''

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="participant-cancel-approval-modal"
      title="참여자 승인 취소 안내"
      message={buildParticipantCancelApprovalMessage(participantName, variant)}
      confirmLabel="승인 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel={resolveParticipantCancelApprovalReasonLabel(variant)}
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions={variant === 'alreadySent' ? 'two' : 'three'}
      notifyBeforeReason
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

export function buildParticipantCancelApprovalCompleteDescription(
  participantName: string,
  cancellationReason: string
): string {
  const trimmedName = participantName.trim() || '참여자'
  const trimmedReason = cancellationReason.trim() || '-'
  return `${formatModalBracketedSubjectName(trimmedName, '참여자')}의 프로그램 참여 ${formatModalBoldPhrase('승인 취소')} 되었습니다.\n(사유 : ${trimmedReason})`
}

export function ParticipantCancelApprovalCompleteModal({
  open,
  participantName,
  cancellationReason,
  onClose,
  zIndex = COMPLETE_MODAL_Z,
}: {
  open: boolean
  participantName: string
  cancellationReason: string
  onClose: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="참여자 승인 취소 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="participant-cancel-approval-complete-modal"
      description={buildParticipantCancelApprovalCompleteDescription(
        participantName,
        cancellationReason
      )}
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

// ——— 반려 취소 ———

function ParticipantCancelRejectPendingNotificationModal({
  open,
  participantName,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  participantName: string
  onCancel: () => void
  onConfirm: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="참여자 반려 취소 안내"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="participant-cancel-reject-modal"
      description={buildParticipantCancelRejectionMessage(participantName, 'pendingNotification')}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            type="button"
            onClick={onCancel}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            type="button"
            onClick={onConfirm}
          >
            반려 취소
          </CmsButton>
        </>
      }
    >
      {null}
    </ContentModal>
  )
}

function ParticipantCancelRejectAlreadySentModal({
  open,
  participantName,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  participantName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="participant-cancel-reject-modal"
      title="참여자 반려 취소 안내"
      message={buildParticipantCancelRejectionMessage(participantName, 'alreadySent')}
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

export function ParticipantCancelRejectModal({
  open,
  participant,
  onCancel,
  onConfirm,
  zIndex = FLOW_MODAL_Z,
}: {
  open: boolean
  participant: GeneralIndividualApplicantRow | null
  onCancel: () => void
  onConfirm: (payload: ParticipantCancelRejectionConfirmPayload) => void
  zIndex?: number
}) {
  const variant = participant
    ? resolveParticipantCancelRejectionNotifyVariant(participant)
    : 'pendingNotification'
  const participantName = participant?.applicantName ?? ''

  if (variant === 'pendingNotification') {
    return (
      <ParticipantCancelRejectPendingNotificationModal
        open={open}
        participantName={participantName}
        onCancel={onCancel}
        onConfirm={() => onConfirm({ variant: 'pendingNotification' })}
        zIndex={zIndex}
      />
    )
  }

  return (
    <ParticipantCancelRejectAlreadySentModal
      open={open}
      participantName={participantName}
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

export function buildParticipantCancelRejectCompleteDescription(participantName: string): string {
  const trimmedName = participantName.trim() || '참여자'
  return `${formatModalBracketedSubjectName(trimmedName, '참여자')}의 프로그램 참여 ${formatModalBoldPhrase('반려 취소')} 되었습니다.\n해당 참여자는 신청 목록 또는 상세에서 ${formatModalBoldPhrase('승인 및 반려')}가 가능합니다.`
}

export function ParticipantCancelRejectCompleteModal({
  open,
  participantName,
  onClose,
  zIndex = COMPLETE_MODAL_Z,
}: {
  open: boolean
  participantName: string
  onClose: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="참여자 반려 취소 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="participant-cancel-reject-complete-modal"
      description={buildParticipantCancelRejectCompleteDescription(participantName)}
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
