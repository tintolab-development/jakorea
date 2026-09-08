import { useMemo } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { RichTextViewer } from '@/shared/rich-text'
import {
  applyMailPreviewHtml,
  applyMailPreviewTokens,
  formatMailPreviewAttachment,
  formatMailPreviewDateTime,
  formatMailPreviewPerson,
  formatMailPreviewRecipient,
  type MailPreviewAttachment,
  type MailPreviewRecipient,
} from '@/features/notifications/model/mail-template/preview'
import './preview-modal.css'

type PreviewModalProps = {
  open: boolean
  subject: string
  bodyHtml: string
  senderName?: string
  senderEmail?: string
  attachments?: MailPreviewAttachment[]
  recipient?: MailPreviewRecipient
  previewAt?: string
  onClose: () => void
  /** 템플릿 목록 미리보기에서만 — 수정 화면 이동 */
  onEdit?: () => void
  /** 템플릿 목록 미리보기에서만 — 삭제 확인 */
  onDelete?: () => void
  zIndex?: number
}

export function PreviewModal({
  open,
  subject,
  bodyHtml,
  senderName,
  senderEmail,
  attachments = [],
  recipient,
  previewAt,
  onClose,
  onEdit,
  onDelete,
  zIndex,
}: PreviewModalProps) {
  const previewSubject = useMemo(() => applyMailPreviewTokens(subject), [subject])
  const previewHtml = useMemo(() => applyMailPreviewHtml(bodyHtml), [bodyHtml])
  const sender = formatMailPreviewPerson(senderName, senderEmail)
  const attachmentLines = attachments.map(formatMailPreviewAttachment).filter(Boolean)
  const showListActions = onEdit != null || onDelete != null

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="메일 미리보기"
      size="medium"
      zIndex={zIndex}
      className="mail-template-preview-modal"
      footer={
        <div className="mail-template-preview-modal__footer">
          <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
            닫기
          </CmsButton>
          {showListActions ? (
            <div className="mail-template-preview-modal__footer-actions">
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
      <div className="mail-template-preview">
        <div className="mail-template-preview__card">
          <h3 className="mail-template-preview__subject">{previewSubject || '-'}</h3>
          <p className="mail-template-preview__datetime">{formatMailPreviewDateTime(previewAt)}</p>
          <dl className="mail-template-preview__meta">
            <div className="mail-template-preview__meta-row">
              <dt>보낸 사람</dt>
              <dd>{sender}</dd>
            </div>
            <div className="mail-template-preview__meta-row">
              <dt>받는 사람</dt>
              <dd>{formatMailPreviewRecipient(recipient)}</dd>
            </div>
            <div className="mail-template-preview__meta-row">
              <dt>첨부파일</dt>
              <dd>
                {attachmentLines.length > 0 ? (
                  attachmentLines.map(line => (
                    <span key={line} className="mail-template-preview__attachment">
                      {line}
                    </span>
                  ))
                ) : (
                  <span className="mail-template-preview__attachment-empty">
                    첨부된 파일이 없습니다.
                  </span>
                )}
              </dd>
            </div>
          </dl>
          <hr className="mail-template-preview__divider" />
          <RichTextViewer
            className="mail-template-preview__body"
            content={previewHtml}
            contentFormat="html"
            maxHeight="none"
          />
        </div>
      </div>
    </ContentModal>
  )
}
