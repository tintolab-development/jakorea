import { useMemo } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { RichTextViewer } from '@/shared/rich-text'
import { MAIL_VARIABLE_EXTENSIONS } from '@/features/notifications/model/mail-template/variable-node'
import {
  applyMailPreviewBody,
  applyMailPreviewTokens,
  formatMailPreviewAttachment,
  formatMailPreviewDateTime,
  formatMailPreviewPerson,
  formatMailPreviewRecipient,
  MAIL_SEND_PREVIEW_TITLE,
  type MailPreviewAttachment,
  type MailPreviewRecipient,
} from '@/features/notifications/model/mail-template/preview'
import './preview-modal.css'

type PreviewModalProps = {
  open: boolean
  /** 기본 「메일 미리보기」 — 템플릿 미리보기 화면은 MAIL_TEMPLATE_PREVIEW_TITLE */
  title?: string
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
  /** 시안 「템플릿 사용」(주색) — 목록: 발송 화면으로 이동 / 발송 피커: 템플릿 선택 */
  onUseTemplate?: () => void
  /** 현재 조건에서 사용 불가 템플릿 — 버튼 비활성 + 사유 title */
  useTemplateDisabledReason?: string | null
  zIndex?: number
}

export function PreviewModal({
  open,
  title = MAIL_SEND_PREVIEW_TITLE,
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
  onUseTemplate,
  useTemplateDisabledReason,
  zIndex,
}: PreviewModalProps) {
  const previewSubject = useMemo(() => applyMailPreviewTokens(subject), [subject])
  const previewHtml = useMemo(() => applyMailPreviewBody(bodyHtml), [bodyHtml])
  const sender = formatMailPreviewPerson(senderName, senderEmail)
  const attachmentLines = attachments.map(formatMailPreviewAttachment).filter(Boolean)
  const hasRecipient = recipient != null
  const showListActions = onEdit != null || onDelete != null || onUseTemplate != null
  const useTemplateDisabled = Boolean(useTemplateDisabledReason)

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
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
                <CmsButton variant="secondary" size="large" type="button" onClick={onEdit}>
                  수정
                </CmsButton>
              ) : null}
              {onUseTemplate ? (
                <CmsButton
                  variant="primary"
                  size="large"
                  type="button"
                  disabled={useTemplateDisabled}
                  title={useTemplateDisabledReason ?? undefined}
                  onClick={onUseTemplate}
                >
                  템플릿 사용
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
            {hasRecipient ? (
              <div className="mail-template-preview__meta-row">
                <dt>받는 사람</dt>
                <dd>{formatMailPreviewRecipient(recipient)}</dd>
              </div>
            ) : null}
            <div className="mail-template-preview__meta-row">
              <dt>첨부 파일</dt>
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
          <div
            className="mail-template-preview__body-shell"
            onClickCapture={event => {
              if (event.target instanceof Element && event.target.closest('a')) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            onKeyDownCapture={event => {
              if (
                (event.key === 'Enter' || event.key === ' ') &&
                event.target instanceof Element &&
                event.target.closest('a')
              ) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
          >
            <RichTextViewer
              className="mail-template-preview__body mail-template-rich-body"
              content={previewHtml}
              contentFormat="html"
              extraExtensions={MAIL_VARIABLE_EXTENSIONS}
              maxHeight="none"
            />
          </div>
        </div>
      </div>
    </ContentModal>
  )
}
