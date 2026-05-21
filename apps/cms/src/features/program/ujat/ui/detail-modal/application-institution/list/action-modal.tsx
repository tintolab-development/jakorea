import {
  PermissionModal,
  type PermissionModalPayload,
  type PermissionModalVariant,
} from '@/shared/components/permission-modal'

/** 목록·신청 기관 상세 일괄/단건 반려 */
export type UjatInstitutionApplicationRejectModalAction =
  | 'application_reject'
  | 'temp_reject'

/** 반려 + 임시 배정 기관 확인 승인 */
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
        title: '기관 승인 안내',
        message: `**[${displayName}]**의 프로그램 참여를 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.`,
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
      title: '기관 일괄 승인 안내',
      message: `선택한 **${selectionCount}개**의 모든 기관의 프로그램 참여를 일괄 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.`,
      confirmLabel: '승인',
      confirmVariant: 'primary',
      requireReason: false,
      reasonLabel: '',
      reasonPlaceholder: '',
      reasonRequiredMessage: '',
    }
  }

  if (action === 'application_reject') {
    if (variant === 'single') {
      return {
        permissionVariant: 'reject',
        title: '기관 반려 안내',
        message: `**[${displayName}]**의 프로그램 참여를 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 담당 교사에게 전달되며, 알림이 발송됩니다.`,
        confirmLabel: '반려',
        confirmVariant: 'delete',
        requireReason: true,
        reasonLabel: '반려 사유',
        reasonPlaceholder: '반려 사유를 입력해 주세요.',
        reasonRequiredMessage: '반려 사유를 입력해 주세요.',
      }
    }

    return {
      permissionVariant: 'reject',
      title: '기관 일괄 반려 안내',
      message: `선택한 **${selectionCount}개**의 모든 기관의 프로그램 참여를 일괄 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 각 담당 교사에게 개별로 전달되며, 알림이 발송됩니다.`,
      confirmLabel: '반려',
      confirmVariant: 'delete',
      requireReason: true,
      reasonLabel: '반려 사유',
      reasonPlaceholder: '반려 사유를 입력해 주세요.',
      reasonRequiredMessage: '반려 사유를 입력해 주세요.',
    }
  }

  if (action === 'temp_reject') {
    if (variant === 'single') {
      return {
        permissionVariant: 'reject',
        title: '기관 임시 반려 안내',
        message: `**[${displayName}]**의 프로그램 참여를 임시 반려하시겠습니까?\n임시 반려 시 입력하신 임시 반려 사유가 담당 교사에게 전달되며, 알림이 발송됩니다.`,
        confirmLabel: '임시 반려',
        confirmVariant: 'delete',
        requireReason: true,
        reasonLabel: '임시 반려 사유',
        reasonPlaceholder: '임시 반려 사유를 입력해 주세요.',
        reasonRequiredMessage: '임시 반려 사유를 입력해 주세요.',
      }
    }

    return {
      permissionVariant: 'reject',
      title: '기관 일괄 임시 반려 안내',
      message: `선택한 **${selectionCount}개**의 모든 기관의 프로그램 참여를 일괄 임시 반려하시겠습니까?\n임시 반려 시 입력하신 임시 반려 사유가 각 담당 교사에게 개별로 전달되며, 알림이 발송됩니다.`,
      confirmLabel: '임시 반려',
      confirmVariant: 'delete',
      requireReason: true,
      reasonLabel: '임시 반려 사유',
      reasonPlaceholder: '임시 반려 사유를 입력해 주세요.',
      reasonRequiredMessage: '임시 반려 사유를 입력해 주세요.',
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
}: UjatInstitutionApplicationActionModalProps) {
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
    />
  )
}
