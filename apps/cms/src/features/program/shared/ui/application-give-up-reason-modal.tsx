import { useCallback, useEffect, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import {
  APPLICATION_GIVE_UP_REASON_MAX_LENGTH,
  validateApplicationGiveUpReason,
} from '@/features/program/shared/lib/application-give-up'
import './application-give-up-reason-modal.css'

const MODAL_Z_INDEX = 1100

const DESCRIPTION =
  '활동 포기 처리 후에는 되돌릴 수 없습니다. 사유를 입력한 뒤 확인해 주세요.'

export type ApplicationGiveUpReasonModalPayload = {
  reason: string
}

export type ApplicationGiveUpReasonModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: ApplicationGiveUpReasonModalPayload) => void | Promise<void>
  confirming?: boolean
}

export function ApplicationGiveUpReasonModal({
  open,
  onCancel,
  onConfirm,
  confirming = false,
}: ApplicationGiveUpReasonModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReason('')
    setError(null)
  }, [open])

  const handleCancel = useCallback(() => {
    if (confirming) return
    onCancel()
  }, [confirming, onCancel])

  const handleConfirm = useCallback(() => {
    const validation = validateApplicationGiveUpReason(reason)
    if (validation) {
      setError(validation)
      return
    }
    void onConfirm({ reason: reason.trim() })
  }, [onConfirm, reason])

  const canConfirm = reason.trim().length >= 2 && !confirming

  const footer = (
    <div className="application-give-up-reason-modal__footer">
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        disabled={confirming}
        onClick={handleCancel} >
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        disabled={!canConfirm}
        onClick={handleConfirm} >
        활동 포기
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="활동 포기"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="application-give-up-reason-modal"
      wrapClassName="application-give-up-reason-modal-wrap"
      footer={footer}
      description={DESCRIPTION}
    >
      <div className="application-give-up-reason-modal__form">
        <CmsTextArea
          label="활동 포기 사유"
          required
          value={reason}
          onChange={event => {
            setReason(event.target.value)
            if (error) setError(null)
          }}
          maxLength={APPLICATION_GIVE_UP_REASON_MAX_LENGTH}
          placeholder="활동 포기 사유를 입력해 주세요."
          error={error != null}
          message={error ?? `${APPLICATION_GIVE_UP_REASON_MAX_LENGTH}자 이내`}
          rows={4}
          width="100%"
        />
      </div>
    </ContentModal>
  )
}
