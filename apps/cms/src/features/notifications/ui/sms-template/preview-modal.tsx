import { ContentModal, CmsButton, SmsPhonePreview } from '@/shared/ui'
import {
  formatMailPreviewAttachment,
  formatMailPreviewDateTime,
  type MailPreviewAttachment,
} from '@/features/notifications/model/mail-template/preview'
import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import { formatSmsMessageTypeCode } from '@/features/notifications/model/sms-template/message-type'
import './preview-modal.css'

type PreviewModalProps = {
  open: boolean
  templateName: string
  senderPhone: string
  messageType: SmsMessageType
  subject: string
  bodyText: string
  attachments?: MailPreviewAttachment[]
  previewAt?: string
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  /** 시안 「템플릿 사용」 — 목록: 발송 화면을 이 템플릿으로 연다 / 발송 템플릿 선택: 이 템플릿을 고른다 */
  onUseTemplate?: () => void
  zIndex?: number
}

export function PreviewModal({
  open,
  templateName,
  senderPhone,
  messageType,
  subject,
  bodyText,
  attachments = [],
  previewAt,
  onClose,
  onEdit,
  onDelete,
  onUseTemplate,
  zIndex,
}: PreviewModalProps) {
  const attachmentLines = attachments.map(formatMailPreviewAttachment).filter(Boolean)
  const showSubject = messageType !== 'SMS'
  const showAttachments = messageType === 'MMS'

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
        <section className="sms-template-preview__meta">
          <dl className="sms-template-preview__meta-list">
            <div className="sms-template-preview__meta-row">
              <dt>템플릿명</dt>
              <dd>{templateName.trim() || '-'}</dd>
            </div>
            <div className="sms-template-preview__meta-row">
              <dt>보낸사람</dt>
              <dd>{senderPhone.trim() || '-'}</dd>
            </div>
            <div className="sms-template-preview__meta-row">
              <dt>발송 유형</dt>
              <dd>{formatSmsMessageTypeCode(messageType)}</dd>
            </div>
            <div className="sms-template-preview__meta-row">
              <dt>미리보기 시각</dt>
              <dd>{formatMailPreviewDateTime(previewAt)}</dd>
            </div>
            {showAttachments ? (
              <div className="sms-template-preview__meta-row">
                <dt>첨부파일</dt>
                <dd>
                  {attachmentLines.length > 0 ? (
                    attachmentLines.map(line => (
                      <span key={line} className="sms-template-preview__attachment">
                        {line}
                      </span>
                    ))
                  ) : (
                    <span className="sms-template-preview__attachment-empty">
                      첨부된 파일이 없습니다.
                    </span>
                  )}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="sms-template-preview__phone-shell" aria-label="문자 프리뷰">
          <SmsPhonePreview
            size="compact"
            senderPhone={senderPhone}
            subject={subject}
            bodyText={bodyText}
            showSubject={showSubject}
          />
        </section>
      </div>
    </ContentModal>
  )
}
