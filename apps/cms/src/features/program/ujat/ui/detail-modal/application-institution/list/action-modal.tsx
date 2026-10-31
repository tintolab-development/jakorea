import {
  PermissionModal,
  type PermissionModalPayload,
  type PermissionModalVariant,
} from '@/shared/components/permission-modal'
import { ProgramApplicationRejectModal } from '@/features/program/shared/ui/detail-modal/components/program-application-reject-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'

/** 목록·신청 기관 상세 일괄/단건 실제 신청 반려 */
export type UjatInstitutionApplicationRejectModalAction = 'application_reject'

/** 실제 신청 반려 + 임시 배정 기관 확인 승인. 임시 반려는 TemporaryActionModal. */
export type UjatInstitutionApplicationModalAction =
  | UjatInstitutionApplicationRejectModalAction
  | 'application_approve'

/** @deprecated `UjatInstitutionApplicationRejectModalAction` (반려) 또는 `UjatInstitutionApplicationModalAction` 사용 */
export type UjatInstitutionApplicationBulkModalAction = UjatInstitutionApplicationModalAction

export type UjatInstitutionApplicationActionModalProps = {
  open: boolean
  action: UjatInstitutionApplicationModalAction
  variant: 'single' | 'bulk'
  institutionName?: string
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  confirmLoading?: boolean
}

function getModalCopy(
  action: UjatInstitutionApplicationModalAction,
  variant: 'single' | 'bulk',
  institutionName: string,
  selectionCount: number
): {
  permissionVariant: PermissionModalVariant
  title: string
  message: string
  confirmLabel: string
  confirmVariant: 'delete' | 'primary'
  requireReason: boolean
  reasonLabel: string
  reasonPlaceholder: string
  reasonRequiredMessage: string
} {
  const displayName = institutionName.trim() || '기관'

  if (action === 'application_approve') {
    if (variant === 'single') {
      return {
        permissionVariant: 'approve',
        title: '프로그램 신청 승인 안내',
        message: `**[${displayName}]**의 프로그램 신청을 승인하시겠습니까?\n승인 시 선택한 일정으로 교육이 배정되며, 담당 교사에게 승인 알림이 발송됩니다.`,
        confirmLabel: '승인',
        confirmVariant: 'primary',
        requireReason: false,
        reasonLabel: '',
        reasonPlaceholder: '',
        reasonRequiredMessage: '',
      }
    }
    return {
      permissionVariant: 'approve',
      title: '프로그램 신청 일괄 승인 안내',
      message: `선택한 **${selectionCount}개**의 프로그램 신청을 일괄 승인하시겠습니까?\n승인 시 선택한 일정으로 교육이 배정되며, 담당 교사에게 승인 알림이 발송됩니다.`,
      confirmLabel: '승인',
      confirmVariant: 'primary',
      requireReason: false,
      reasonLabel: '',
      reasonPlaceholder: '',
      reasonRequiredMessage: '',
    }
  }

  throw new Error(`Unknown action: ${action}`)
}

export function UjatInstitutionApplicationActionModal({
  open,
  action,
  variant,
  institutionName = '',
  selectionCount,
  onCancel,
  onConfirm,
  confirmLoading = false,
}: UjatInstitutionApplicationActionModalProps) {
  if (action === 'application_reject') {
    return (
      <ProgramApplicationRejectModal
        open={open}
        audience="institution"
        variant={variant}
        subjectName={institutionName}
        selectionCount={selectionCount}
        onCancel={onCancel}
        onConfirm={onConfirm}
        notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
        confirmLoading={confirmLoading}
      />
    )
  }

  const copy = getModalCopy(action, variant, institutionName, selectionCount)

  return (
    <PermissionModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      variant={copy.permissionVariant}
      title={copy.title}
      message={copy.message}
      confirmLabel={copy.confirmLabel}
      confirmVariant={copy.confirmVariant}
      requireReason={copy.requireReason}
      reasonLabel={copy.reasonLabel}
      reasonPlaceholder={copy.reasonPlaceholder}
      reasonRequiredMessage={copy.reasonRequiredMessage}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
      confirmLoading={confirmLoading}
    />
  )
}
