import { useEffect, useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsInput } from '@/shared/ui/cms-input'
import { ContentModal } from '@/shared/ui/content-modal'
import type { UserDetailPermissionRole } from '@/pages/users/user-detail-fullpage-modal'
import type { InstructorPermissionApproveNotifyTiming } from '@/features/user/permission-management/instructor-permission-approve-modal'

type PermissionStatusResetConfirmModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: {
    cancellationReason: string
    notifyTiming: InstructorPermissionApproveNotifyTiming
  }) => void
  userDisplayName: string
  permissionRole: UserDetailPermissionRole
  fromStatus: 'APPROVED' | 'REJECTED'
  zIndex?: number
}

export function InstructorPermissionStatusResetConfirmModal({
  open,
  onCancel,
  onConfirm,
  userDisplayName,
  permissionRole,
  fromStatus,
  zIndex,
}: PermissionStatusResetConfirmModalProps) {
  const permissionLabel = permissionRole === 'admin' ? '관리자' : '강사'
  const actionLabel = fromStatus === 'APPROVED' ? '승인 취소' : '반려 취소'
  const normalizedName = userDisplayName.trim() || '회원'
  const [notifyTiming, setNotifyTiming] =
    useState<InstructorPermissionApproveNotifyTiming>('immediate')
  const [cancellationReason, setCancellationReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  useEffect(() => {
    if (!open) return
    setNotifyTiming('immediate')
    setCancellationReason('')
    setReasonError('')
  }, [open])

  const handleConfirm = () => {
    const reason = cancellationReason.trim()
    if (!reason) {
      setReasonError('취소 사유를 입력해 주세요.')
      return
    }
    setReasonError('')
    onConfirm({ cancellationReason: reason, notifyTiming })
  }

  const description =
    fromStatus === 'APPROVED'
      ? `취소 시 입력하신 취소 사유가 ${permissionLabel}님에게 전달되며, 알림이 발송됩니다.`
      : `취소 시 입력하신 취소 사유가 ${permissionLabel}님에게 전달되며, 알림이 발송됩니다.`

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={`${permissionLabel} 권한 ${actionLabel}`}
      width={600}
      zIndex={zIndex}
      footer={
        <div className="instructor-permission-approve-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant={fromStatus === 'APPROVED' ? 'delete' : 'primary'}
            size="medium"
            type="button"
            onClick={handleConfirm}
          >
            {actionLabel}
          </CmsButton>
        </div>
      }
    >
      <div className="instructor-permission-reject-modal__content">
        <p className="instructor-permission-reject-modal__lead instructor-permission-reject-modal__lead--single">
          <strong>[{normalizedName}]</strong> {permissionLabel}님의 {permissionLabel} 권한{' '}
          {actionLabel}
          하시겠습니까?
          <br />
          {description}
          <br />
          또한, 해당 {permissionLabel}님은 자동으로 일반 회원(개인 또는 교사)로 처리됩니다.
        </p>

        <div className="instructor-permission-reject-modal__field">
          <span className="instructor-permission-reject-modal__label">알림 발송</span>
          <CmsRadio.Group
            size="large"
            value={notifyTiming}
            onChange={e =>
              setNotifyTiming(e.target.value as InstructorPermissionApproveNotifyTiming)
            }
          >
            <CmsRadio value="immediate">즉시</CmsRadio>
            <CmsRadio value="manual">직접 설정</CmsRadio>
          </CmsRadio.Group>
        </div>

        <div className="instructor-permission-reject-modal__field">
          <span className="instructor-permission-reject-modal__label">취소 사유</span>
          <CmsInput
            inputSize="large"
            width="100%"
            value={cancellationReason}
            onChange={e => {
              setCancellationReason(e.target.value)
              if (reasonError) setReasonError('')
            }}
            placeholder="취소 사유를 입력해 주세요."
            maxLength={500}
          />
          {reasonError ? (
            <span className="instructor-permission-reject-modal__field-error" role="alert">
              {reasonError}
            </span>
          ) : null}
        </div>
      </div>
    </ContentModal>
  )
}
