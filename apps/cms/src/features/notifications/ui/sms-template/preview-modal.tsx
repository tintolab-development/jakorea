import { ContentModal, CmsButton, SmsPhonePreview } from '@/shared/ui'
import {
  formatMailPreviewAttachment,
  formatMailPreviewDateTime,
  type MailPreviewAttachment,
} from '@/features/notifications/model/mail-template/preview'
import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
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
  zIndex,
}: PreviewModalProps) {
  const attachmentLines = attachments.map(formatMailPreviewAttachment).filter(Boolean)
  const showSubject = messageType !== 'SMS'
  const showAttachments = messageType === 'MMS'
  const showListActions = onEdit != null || onDelete != null

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="문자 미리보기"
      size="medium"
      zIndex={zIndex}
      className="sms-template-preview-modal"
      footer={
        <div className="sms-template-preview-modal__footer">
          <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
            닫기
          </CmsButton>
          {showListActions ? (
            <div className="sms-template-preview-modal__footer-actions">
              {onDelete ? (
                <CmsButton variant="delete" size="large" type="button" onClick={onDelete}>
                  삭제
                </CmsButton>
              ) : null}
              {onEdit ? (
                <CmsButton variant="primary" size="large" type="button" onClick={onEdit}>
                  수정
                </CmsButton>
              ) : null}
            </div>
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
              <dt>메시지 유형</dt>
              <dd>{messageType}</dd>
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
