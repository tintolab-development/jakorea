import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './ujat-assignment-feedback-modal.css'

export type UjatFeedbackModalMode = 'write' | 'view'

/** 문서 보기(풀페이지) 위에 뜨는 컨텐츠 모달 */
const FEEDBACK_MODAL_Z_INDEX = 1200

interface UjatAssignmentFeedbackModalProps {
  open: boolean
  onCancel: () => void
  mode: UjatFeedbackModalMode
  volunteerName: string
  docTypeLabel: string
  existingFeedback?: string
  submitting?: boolean
  onSubmit: (feedback: string) => void | Promise<void>
}

export function UjatAssignmentFeedbackModal({
  open,
  onCancel,
  mode,
  volunteerName,
  docTypeLabel,
  existingFeedback = '',
  submitting = false,
  onSubmit,
}: UjatAssignmentFeedbackModalProps) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (open && mode === 'write') {
      setText('')
    }
  }, [mode, open])

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    void onSubmit(trimmed)
  }, [text, onSubmit, submitting])

  const isWrite = mode === 'write'
  const title = isWrite ? '피드백 작성' : '피드백 보기'
  const description = isWrite
    ? `**[${volunteerName}]** 님에게 전달할 피드백을 작성해 주세요.`
    : `**[${volunteerName}]** 님에게 전달된 피드백입니다.`
  const formClassName = [
    'ujat-assignment-feedback-modal__form',
    !isWrite && 'ujat-assignment-feedback-modal__form--view',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={800}
      className="ujat-assignment-feedback-modal"
      description={description}
      zIndex={FEEDBACK_MODAL_Z_INDEX}
      footer={
        isWrite ? (
          <>
            <CmsButton variant="secondary" size="medium" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              disabled={!text.trim() || submitting}
              onClick={handleSubmit}
            >
              저장
            </CmsButton>
          </>
        ) : (
          <CmsButton variant="secondary" size="medium" onClick={onCancel}>
            확인
          </CmsButton>
        )
      }
    >
      <DetailInfoForm
        title={`${docTypeLabel} 피드백`}
        hideHeader
        mode={isWrite ? 'edit' : 'view'}
        className={formClassName}
      >
        <DetailInfoForm.Row>
          <DetailInfoForm.Field
            label="피드백"
            required={isWrite}
            view={
              <div className="ujat-assignment-feedback-modal__feedback-content">
                {existingFeedback || '-'}
              </div>
            }
            edit={
              <CmsTextArea
                inputSize="small"
                width="100%"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="피드백을 작성해 주세요"
                rows={4}
                maxLength={4000}
                autoFocus
                className="ujat-assignment-feedback-modal__textarea"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
