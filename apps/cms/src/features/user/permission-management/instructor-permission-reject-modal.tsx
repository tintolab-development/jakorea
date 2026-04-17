import { useEffect, useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsInput } from '@/shared/ui/cms-input'
import { ContentModal } from '@/shared/ui/content-modal'
import type {
  InstructorPermissionApproveNotifyTiming,
  PermissionApproveModalKind,
} from '@/features/user/permission-management/instructor-permission-approve-modal'
import './instructor-permission-reject-modal.css'

export interface InstructorPermissionRejectPayload {
  rejectionReason: string
  notifyTiming: InstructorPermissionApproveNotifyTiming
}

type InstructorPermissionRejectModalBaseProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: InstructorPermissionRejectPayload) => void
  zIndex?: number
  permissionKind?: PermissionApproveModalKind
}

export type InstructorPermissionRejectModalProps =
  | (InstructorPermissionRejectModalBaseProps & {
      variant: 'single'
      userDisplayName: string
    })
  | (InstructorPermissionRejectModalBaseProps & {
      variant: 'bulk'
      memberCount: number
    })

export function InstructorPermissionRejectModal(props: InstructorPermissionRejectModalProps) {
  const { open, onCancel, onConfirm, zIndex, variant, permissionKind = 'instructor' } = props
  const isAdmin = permissionKind === 'admin'
  const [rejectionReason, setRejectionReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [notifyTiming, setNotifyTiming] =
    useState<InstructorPermissionApproveNotifyTiming>('immediate')

  useEffect(() => {
    if (!open) return
    setRejectionReason('')
    setReasonError('')
    setNotifyTiming('immediate')
  }, [open])

  const displayName = variant === 'single' ? (props.userDisplayName ?? '').trim() || '회원' : null
  const memberCount = variant === 'bulk' ? props.memberCount : 0
  const hasRejectionReason = rejectionReason.trim().length > 0

  const handleConfirm = () => {
    const reason = rejectionReason.trim()
    if (!reason) {
      setReasonError('반려 사유를 입력해 주세요.')
      return
    }
    setReasonError('')
    onConfirm({ rejectionReason: reason, notifyTiming })
  }

  const title =
    variant === 'bulk'
      ? isAdmin
        ? '관리자 권한 일괄 반려'
        : '강사 권한 일괄 반려'
      : isAdmin
        ? '관리자 신청 반려'
        : '강사 승인 반려'

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={520}
      className="instructor-permission-reject-modal"
      zIndex={zIndex}
      footer={
        <div className="instructor-permission-reject-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="medium"
            type="button"
            disabled={!hasRejectionReason}
            onClick={handleConfirm}
          >
            반려
          </CmsButton>
        </div>
      }
    >
      <div className="instructor-permission-reject-modal__content">
        {variant === 'single' ? (
          <p className="instructor-permission-reject-modal__lead instructor-permission-reject-modal__lead--single">
            <strong>[{displayName}]</strong> 님의 {isAdmin ? '관리자' : '강사'} 권한 요청을 반려하시겠습니까? 반려 시
            아래에 반려 사유를 입력하여 주세요.
          </p>
        ) : (
          <>
            <p className="instructor-permission-reject-modal__lead">
              선택한 <strong>{memberCount}명의 회원</strong>의 {isAdmin ? '관리자' : '강사'} 권한 요청을
              반려하시겠습니까?
            </p>
            <p className="instructor-permission-reject-modal__sub">
              반려 시 해당 사용자는 {isAdmin ? '관리자' : '강사'} 권한을 부여받지 못합니다. 반려 사유는 아래에
              입력해 주세요.
            </p>
          </>
        )}

        <div className="instructor-permission-reject-modal__field">
          <span className="instructor-permission-reject-modal__label">반려 사유</span>
          <CmsInput
            inputSize="large"
            width="100%"
            value={rejectionReason}
            onChange={e => {
              setRejectionReason(e.target.value)
              if (reasonError) setReasonError('')
            }}
            placeholder="반려 사유를 입력해 주세요."
            maxLength={500}
          />
          {reasonError ? (
            <span className="instructor-permission-reject-modal__field-error" role="alert">
              {reasonError}
            </span>
          ) : null}
        </div>

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
      </div>
    </ContentModal>
  )
}
