import { formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type UjatVolunteerDocumentResultModalAction = 'approve' | 'reject'
export type UjatVolunteerDocumentResultModalVariant = 'single' | 'bulk'

export type UjatVolunteerDocumentResultModalProps = {
  open: boolean
  action: UjatVolunteerDocumentResultModalAction
  variant: UjatVolunteerDocumentResultModalVariant
  volunteerName?: string
  selectionCount?: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
}

export function buildUjatVolunteerDocumentApproveMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '봉사자')
  return `${subject} 봉사자의 1차 서류 합격을 승인하시겠습니까?\n승인 시 봉사자에게 합격 알림이 발송됩니다.`
}

export function buildUjatVolunteerDocumentRejectMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '봉사자')
  return `${subject} 봉사자의 1차 서류 합격을 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 봉사자에게 전달되며, 알림이 발송됩니다.`
}

export function buildUjatVolunteerDocumentBulkApproveMessage(selectionCount: number): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 1차 서류 합격을 일괄 승인하시겠습니까?\n승인 시 각 봉사자에게 개별로 합격 알림이 발송됩니다.`
}

export function buildUjatVolunteerDocumentBulkRejectMessage(selectionCount: number): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 1차 서류 합격을 일괄 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 각 봉사자에게 개별로 전달되며, 알림이 발송됩니다.`
}

function getModalCopy(
  action: UjatVolunteerDocumentResultModalAction,
  variant: UjatVolunteerDocumentResultModalVariant,
  volunteerName: string,
  selectionCount: number
): {
  title: string
  message: string
  confirmLabel: string
  confirmVariant: 'delete' | 'primary'
  requireReason: boolean
} {
  if (action === 'approve') {
    if (variant === 'single') {
      return {
        title: '봉사자 1차 승인 안내',
        message: buildUjatVolunteerDocumentApproveMessage(volunteerName),
        confirmLabel: '승인',
        confirmVariant: 'primary',
        requireReason: false,
      }
    }
    return {
      title: '봉사자 일괄 승인 안내',
      message: buildUjatVolunteerDocumentBulkApproveMessage(selectionCount),
      confirmLabel: '승인',
      confirmVariant: 'primary',
      requireReason: false,
    }
  }

  if (variant === 'single') {
    return {
      title: '봉사자 1차 반려 안내',
      message: buildUjatVolunteerDocumentRejectMessage(volunteerName),
      confirmLabel: '반려',
      confirmVariant: 'delete',
      requireReason: true,
    }
  }

  return {
    title: '봉사자 일괄 반려 안내',
    message: buildUjatVolunteerDocumentBulkRejectMessage(selectionCount),
    confirmLabel: '반려',
    confirmVariant: 'delete',
    requireReason: true,
  }
}

export function UjatVolunteerDocumentResultModal({
  open,
  action,
  variant,
  volunteerName = '',
  selectionCount = 0,
  onCancel,
  onConfirm,
}: UjatVolunteerDocumentResultModalProps) {
  const copy = getModalCopy(action, variant, volunteerName, selectionCount)

  return (
    <PermissionModal
      open={open}
      variant={action}
      className={
        action === 'reject' && variant === 'bulk'
          ? 'ujat-volunteer-document-result-modal instructor-bulk-reject-modal'
          : 'ujat-volunteer-document-result-modal'
      }
      title={copy.title}
      message={copy.message}
      confirmLabel={copy.confirmLabel}
      confirmVariant={copy.confirmVariant}
      requireReason={copy.requireReason}
      reasonLabel={copy.requireReason ? '반려 사유' : undefined}
      reasonPlaceholder={copy.requireReason ? '반려 사유를 입력해 주세요.' : undefined}
      reasonRequiredMessage={copy.requireReason ? '반려 사유를 입력해 주세요.' : undefined}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
