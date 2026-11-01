import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal, CmsButton, useCmsAlert } from '@/shared/ui'
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
  confirmLoading?: boolean
}

export function UjatScheduleConfirmRevisionRequestModal({
  open,
  institutionName,
  onCancel,
  onConfirm,
  confirmLoading = false,
}: UjatScheduleConfirmRevisionRequestModalProps) {
  const { showAlert } = useCmsAlert()
  const [message, setMessage] = useState('')
  const displayName = institutionName.trim() || '기관'
  const canSubmit = message.trim().length > 0

  useEffect(() => {
    if (!open) return
    setMessage('')
  }, [open])

  const handleCancel = useCallback(() => {
    if (confirmLoading) return
    setMessage('')
    onCancel()
  }, [confirmLoading, onCancel])

  const handleConfirm = useCallback(() => {
    if (confirmLoading) return
    const trimmed = message.trim()
    if (!trimmed) {
      showAlert({
        title: '필수 항목 미입력 안내',
        content: '수정사항을 작성해 주세요.',
      })
      return
    }
    onConfirm({ message: trimmed })
  }, [confirmLoading, message, onConfirm, showAlert])

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="수정 요청"
      width={800}
      className="ujat-schedule-confirm-revision-request-modal"
      wrapClassName="ujat-schedule-confirm-revision-request-modal-wrap"
      description={`**[${displayName}]**의 담당 교사에게 전달할 수정사항을 작성해 주세요.`}
      footer={
        <div className="ujat-schedule-confirm-revision-request-modal__footer">
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            disabled={confirmLoading}
            onClick={handleCancel}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading || !canSubmit}
            onClick={handleConfirm}
          >
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
            label="수정사항"
            required
            fullRow
            edit={
              <CmsTextArea
                inputSize="small"
                width="100%"
                rows={4}
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="수정사항을 작성해 주세요"
                aria-label="수정사항"
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
