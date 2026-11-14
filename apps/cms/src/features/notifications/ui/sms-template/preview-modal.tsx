import { ContentModal, CmsButton } from '@/shared/ui'
import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import { renderNotificationVariableText } from '@/features/notifications/model/shared/render-notification-variable-text'
import './preview-modal.css'

type PreviewModalProps = {
  open: boolean
  messageType: SmsMessageType
  subject: string
  bodyText: string
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  /** 시안 「템플릿 사용」 — 목록: 발송 화면을 이 템플릿으로 연다 / 발송 템플릿 선택: 이 템플릿을 고른다 */
  onUseTemplate?: () => void
  zIndex?: number
}

/**
 * 문자 템플릿 미리보기 (QA 2026-11-13) — 메일 미리보기와 같은 구성.
 * 테두리 본문 박스 안에 문자 제목(20/700)과 문자 내용만 보인다. SMS 유형은 제목이 없다.
 */
export function PreviewModal({
  open,
  messageType,
  subject,
  bodyText,
  onClose,
  onEdit,
  onDelete,
  onUseTemplate,
  zIndex,
}: PreviewModalProps) {
  const showSubject = messageType !== 'SMS'
  const subjectText = subject.trim()
  const body = bodyText.trim()

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="템플릿 미리보기"
      size="medium"
      zIndex={zIndex}
      className="sms-template-preview-modal"
      footer={
        <div className="sms-template-preview-modal__footer">
          <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
            닫기
          </CmsButton>
          {onDelete ? (
            <CmsButton variant="delete" size="large" type="button" onClick={onDelete}>
              삭제
            </CmsButton>
          ) : null}
          {onEdit ? (
            <CmsButton variant="secondary" size="large" type="button" onClick={onEdit}>
              수정
            </CmsButton>
          ) : null}
          {onUseTemplate ? (
            <CmsButton variant="primary" size="large" type="button" onClick={onUseTemplate}>
              템플릿 사용
            </CmsButton>
          ) : null}
        </div>
      }
    >
      <div className="sms-template-preview">
        <div className="sms-template-preview__card">
          {showSubject ? (
            <>
              <h3 className="sms-template-preview__subject">
                {subjectText ? renderNotificationVariableText(subjectText) : '-'}
              </h3>
              <hr className="sms-template-preview__divider" />
            </>
          ) : null}
          <p className="sms-template-preview__body">
            {body ? renderNotificationVariableText(body) : '-'}
          </p>
        </div>
      </div>
    </ContentModal>
  )
}
