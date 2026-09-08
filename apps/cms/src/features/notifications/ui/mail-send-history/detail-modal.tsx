import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ContentModal } from '@/shared/ui'
import { RichTextViewer } from '@/shared/rich-text'
import { formatMailPreviewPerson } from '@/features/notifications/model/mail-template/preview'
import { downloadMailAttachmentMock } from '@/features/notifications/model/mail-send-history/download-attachment'
import type { MailSendHistoryRow } from '@/features/notifications/model/mail-send-history/types'
import './detail-modal.css'

type DetailModalProps = {
  open: boolean
  row: MailSendHistoryRow | null
  onClose: () => void
}

const DATETIME_FORMAT = 'YYYY.MM.DD HH:mm:ss'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(DATETIME_FORMAT) : '-'
}

export function DetailModal({ open, row, onClose }: DetailModalProps) {
  const sender = row
    ? formatMailPreviewPerson(row.senderName, row.senderEmail)
    : '-'
  const receiver = row
    ? formatMailPreviewPerson(row.receiverName, row.receiverEmail)
    : '-'
  const templateName = row?.templateName.trim() ? row.templateName : '미사용'

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="메일 발송 조회 상세"
      className="mail-send-history-detail-modal"
      size="wide"
      footer={
        <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      {row ? (
        <div className="mail-send-history-detail-modal__content">
          <DetailInfoForm title="발송 정보" hideHeader mode="view">
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="발송일시" view={formatDateTime(row.sentAt)} />
              <DetailInfoForm.Field label="수신일시" view={formatDateTime(row.receivedAt)} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="발송자" view={sender} />
              <DetailInfoForm.Field label="수신자" view={receiver} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="발송 상태" view={row.sendStatus} />
              <DetailInfoForm.Field label="읽음 여부" view={row.readStatus} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="템플릿명" fullRow view={templateName} />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <div className="mail-send-history-detail-modal__mail">
            <h3 className="mail-send-history-detail-modal__subject">{row.subject || '-'}</h3>
            <RichTextViewer
              className="mail-send-history-detail-modal__body"
              content={row.bodyHtml}
              contentFormat="html"
              maxHeight="none"
            />
            <div className="mail-send-history-detail-modal__attachments">
              <span className="mail-send-history-detail-modal__attachments-label">첨부파일</span>
              {row.attachmentFileNames.length > 0 ? (
                <ul className="mail-send-history-detail-modal__attachment-list">
                  {row.attachmentFileNames.map(name => (
                    <li key={name}>
                      <button
                        type="button"
                        className="mail-send-history-detail-modal__attachment-link"
                        onClick={() => {
                          void downloadMailAttachmentMock(name)
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="mail-send-history-detail-modal__attachment-empty">-</span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
