import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './revision-request-modal.css'

export type UjatScheduleConfirmRevisionRequestModalPayload = {
  message: string
}

export type UjatScheduleConfirmRevisionRequestModalProps = {
  open: boolean
  institutionName: string
  onCancel: () => void
  onConfirm: (payload: UjatScheduleConfirmRevisionRequestModalPayload) => void
}

export function UjatScheduleConfirmRevisionRequestModal({
  open,
  institutionName,
  onCancel,
  onConfirm,
}: UjatScheduleConfirmRevisionRequestModalProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) return
    setMessage('')
  }, [open])

  const handleCancel = useCallback(() => {
    setMessage('')
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    onConfirm({ message: message.trim() })
    setMessage('')
  }, [message, onConfirm])

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="수정 요청"
      width={760}
      className="ujat-schedule-confirm-revision-request-modal"
      wrapClassName="ujat-schedule-confirm-revision-request-modal-wrap"
      description={`**[${institutionName}]** 담당교사님에게 전달한 수정사항을 작성해 주세요.`}
      footer={
        <div className="ujat-schedule-confirm-revision-request-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" width={140} onClick={handleCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large" type="button" width={140} onClick={handleConfirm}>
            수정 요청
          </CmsButton>
        </div>
      }
    >
      <DetailInfoForm
        title=""
        hideHeader
        mode="edit"
        className="ujat-schedule-confirm-revision-request-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="수정 요청"
            fullRow
            edit={
              <CmsTextArea
                inputSize="large"
                width="100%"
                rows={4}
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="수정사항을 작성해 주세요"
                aria-label="수정 요청"
                className="ujat-schedule-confirm-revision-request-modal__textarea"
              />
            }
            view={message}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
