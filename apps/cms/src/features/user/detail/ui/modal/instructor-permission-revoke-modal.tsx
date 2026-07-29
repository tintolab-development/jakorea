import { useEffect, useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { ContentModal } from '@/shared/ui/content-modal'
import type { InstructorPermissionRevokeNotifyTiming } from '@/features/user/detail/lib/use-user-detail-controller'
import './instructor-permission-revoke-modal.css'

export interface InstructorPermissionRevokeModalProps {
  open: boolean
  instructorName: string
  onCancel: () => void
  onConfirm: (payload: {
    reason: string
    notifyTiming: InstructorPermissionRevokeNotifyTiming
  }) => void | Promise<void>
}

export function InstructorPermissionRevokeModal({
  open,
  instructorName,
  onCancel,
  onConfirm,
}: InstructorPermissionRevokeModalProps) {
  const [notifyTiming, setNotifyTiming] =
    useState<InstructorPermissionRevokeNotifyTiming>('immediate')
  const [reason, setReason] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setNotifyTiming('immediate')
    setReason('')
    setConfirmLoading(false)
  }, [open])

  const trimmedReason = reason.trim()
  const canConfirm = trimmedReason.length > 0 && !confirmLoading
  const displayName = instructorName.trim() || '강사'

  const handleConfirm = async () => {
    if (!trimmedReason || confirmLoading) return
    setConfirmLoading(true)
    try {
      await onConfirm({ reason: trimmedReason, notifyTiming })
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={confirmLoading ? () => undefined : onCancel}
      title="강사 권한 박탈 안내"
      titleBodyGap="always"
      width={600}
      className="instructor-permission-revoke-modal"
      footer={
        <div className="instructor-permission-revoke-modal__footer">
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            type="button"
            disabled={!canConfirm}
            loading={confirmLoading}
            size="medium"
            onClick={() => {
              void handleConfirm()
            }}
          >
            권한 박탈
          </CmsButton>
        </div>
      }
    >
      <div className="instructor-permission-revoke-modal__content">
        <span className="instructor-permission-revoke-modal__line">
          <strong>[{displayName}]</strong> 강사님의 강사 권한을 박탈하시겠습니까? <br />
          박탈 시 입력하신 박탈 사유가 강사님에게 전달되며, 알림이 발송됩니다.
          <br />
          또한, 해당 강사님은 자동으로 일반 회원(개인 또는 교사)으로 처리됩니다.
        </span>

        <div className="instructor-permission-revoke-modal__field">
          <span className="instructor-permission-revoke-modal__label">알림 발송</span>
          <CmsRadio.Group
            size="large"
            value={notifyTiming}
            onChange={e =>
              setNotifyTiming(e.target.value as InstructorPermissionRevokeNotifyTiming)
            }
            disabled={confirmLoading}
          >
            <CmsRadio value="immediate">즉시</CmsRadio>
            <CmsRadio value="manual">직접 설정</CmsRadio>
          </CmsRadio.Group>
        </div>

        <div className="instructor-permission-revoke-modal__field">
          <span className="instructor-permission-revoke-modal__label">권한 박탈 사유</span>
          <CmsInput
            width="100%"
            inputSize="large"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="권한 박탈 사유를 입력해 주세요."
            maxLength={200}
            disabled={confirmLoading}
          />
        </div>
      </div>
    </ContentModal>
  )
}
