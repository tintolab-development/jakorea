import { useCallback, useState } from 'react'
import { Input } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'

const { TextArea } = Input

export type UjatFeedbackModalMode = 'write' | 'view'

interface UjatAssignmentFeedbackModalProps {
  open: boolean
  onCancel: () => void
  mode: UjatFeedbackModalMode
  volunteerName: string
  docTypeLabel: string
  existingFeedback?: string
  onSubmit: (feedback: string) => void
}

export function UjatAssignmentFeedbackModal({
  open,
  onCancel,
  mode,
  volunteerName,
  docTypeLabel,
  existingFeedback = '',
  onSubmit,
}: UjatAssignmentFeedbackModalProps) {
  const [text, setText] = useState('')

  const handleOpen = useCallback(() => {
    setText('')
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }, [text, onSubmit])

  const isWrite = mode === 'write'
  const title = isWrite
    ? `${volunteerName} 봉사자 ${docTypeLabel} 피드백 작성`
    : `${volunteerName} 봉사자 ${docTypeLabel} 피드백 내용`

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={640}
      className="ujat-assignment-feedback-modal"
      footer={
        isWrite ? (
          <>
            <CmsButton variant="secondary" size="medium" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              width={120}
              disabled={!text.trim()}
              onClick={handleSubmit}
            >
              피드백 제출
            </CmsButton>
          </>
        ) : (
          <CmsButton variant="secondary" size="medium" onClick={onCancel}>
            닫기
          </CmsButton>
        )
      }
    >
      {isWrite ? (
        <div className="ujat-assignment-feedback-modal__write-body">
          <p className="ujat-assignment-feedback-modal__guide">
            봉사자가 제출한 {docTypeLabel}에 대한 피드백을 작성해 주세요.
            <br />
            피드백 전달 시 봉사자가 내용을 확인하고 수정 후 재제출할 수 있습니다.
          </p>
          <TextArea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="피드백 내용을 입력해 주세요."
            rows={8}
            maxLength={1000}
            showCount
            autoFocus
            onCompositionStart={() => handleOpen()}
          />
        </div>
      ) : (
        <div className="ujat-assignment-feedback-modal__view-body">
          <div className="ujat-assignment-feedback-modal__feedback-content">
            {existingFeedback || '-'}
          </div>
        </div>
      )}
    </ContentModal>
  )
}
