import {
  PermissionRejectModal,
  type PermissionRejectPayload,
} from '@/shared/components/permission-reject-modal'

export type UjatInstitutionApplicationBulkModalAction =
  | 'application_reject'
  | 'temp_reject'
  | 'temp_assign'

export type UjatInstitutionApplicationActionModalProps = {
  open: boolean
  action: UjatInstitutionApplicationBulkModalAction
  variant: 'single' | 'bulk'
  institutionName?: string
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionRejectPayload) => void
}

function getModalCopy(
  action: UjatInstitutionApplicationBulkModalAction,
  variant: 'single' | 'bulk',
  institutionName: string,
  selectionCount: number
): {
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

  if (action === 'application_reject') {
    if (variant === 'single') {
      return {
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

  if (variant === 'single') {
    return {
      title: '기관 임시 배정 안내',
      message: `**[${displayName}]**에 임시 교육 배정을 진행하시겠습니까?\n임시 배정 시 담당 교사에게 알림이 발송됩니다.`,
      confirmLabel: '배정',
      confirmVariant: 'primary',
      requireReason: false,
      reasonLabel: '반려 사유',
      reasonPlaceholder: '반려 사유를 입력해 주세요.',
      reasonRequiredMessage: '반려 사유를 입력해 주세요.',
    }
  }

  return {
    title: '기관 일괄 임시 배정 안내',
    message: `선택한 **${selectionCount}개**의 모든 기관에 임시 교육 배정을 진행하시겠습니까?\n임시 배정 시 각 담당 교사에게 개별로 알림이 발송됩니다.`,
    confirmLabel: '배정',
    confirmVariant: 'primary',
    requireReason: false,
    reasonLabel: '반려 사유',
    reasonPlaceholder: '반려 사유를 입력해 주세요.',
    reasonRequiredMessage: '반려 사유를 입력해 주세요.',
  }
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
    <PermissionRejectModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
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
