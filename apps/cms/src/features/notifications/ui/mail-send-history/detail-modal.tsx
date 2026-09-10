import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ContentModal, useCmsAlert } from '@/shared/ui'
import { RichTextViewer } from '@/shared/rich-text'
import { downloadMailSendHistoryAttachment } from '@/features/notifications/model/mail-send-history/download-attachment'
import type { MailSendHistoryRow } from '@/features/notifications/model/mail-send-history/types'
import { NOTIFICATION_SEND_FAILURE_SNAPSHOT_HINT } from '@/features/notifications/model/shared/send-ux-copy'
import './detail-modal.css'

type DetailModalProps = {
  open: boolean
  row: MailSendHistoryRow | null
  loading?: boolean
  onClose: () => void
}

const DATETIME_FORMAT = 'YYYY.MM.DD HH:mm:ss'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(DATETIME_FORMAT) : '-'
}

function sendStatusView(row: MailSendHistoryRow) {
  if (row.sendStatus === '발송 실패' && row.failedReason?.trim()) {
    return (
      <span className="mail-send-history-detail-modal__status-with-reason">
        <span>{row.sendStatus}</span>
        <span
          className="mail-send-history-detail-modal__failed-reason"
          title={row.failedReason}
        >
          {row.failedReason}
        </span>
        <span className="mail-send-history-detail-modal__snapshot-hint">
          {NOTIFICATION_SEND_FAILURE_SNAPSHOT_HINT}
        </span>
      </span>
    )
  }
  return row.sendStatus
}

export function DetailModal({ open, row, loading, onClose }: DetailModalProps) {
  const { showAlert } = useCmsAlert()
  const sender = row?.senderInfo?.trim() || '-'
  const receiver = row?.receiverInfo?.trim() || '-'
  const templateName = row?.templateName.trim() ? row.templateName : '미사용'
  const attachments =
    row?.attachments && row.attachments.length > 0
      ? row.attachments
      : (row?.attachmentFileNames ?? []).map(fileName => ({ fileName }))
  const bodyHtml = row?.bodyHtml?.trim() || ''

  const handleDownload = async (fileName: string) => {
    const attachment = attachments.find(item => item.fileName === fileName) ?? { fileName }
    try {
      await downloadMailSendHistoryAttachment(attachment)
    } catch (error) {
      showAlert({
        title: '다운로드 실패',
        content:
          error instanceof Error && error.message.trim()
            ? error.message
            : '첨부파일 다운로드에 실패했습니다.',
      })
    }
  }

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
      {loading && !row ? (
        <div className="mail-send-history-detail-modal__loading" aria-busy="true">
          불러오는 중…
        </div>
      ) : row ? (
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
              <DetailInfoForm.Field label="발송 상태" view={sendStatusView(row)} />
              <DetailInfoForm.Field label="읽음 여부" view={row.readStatus} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="템플릿명" fullRow view={templateName} />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <div className="mail-send-history-detail-modal__mail">
            <h3 className="mail-send-history-detail-modal__subject">{row.subject || '-'}</h3>
            {bodyHtml ? (
              <RichTextViewer
                className="mail-send-history-detail-modal__body"
                content={bodyHtml}
                contentFormat="html"
                maxHeight="none"
              />
            ) : (
              <p className="mail-send-history-detail-modal__body-empty">-</p>
            )}
            <div className="mail-send-history-detail-modal__attachments">
              <span className="mail-send-history-detail-modal__attachments-label">첨부파일</span>
              {attachments.length > 0 ? (
                <ul className="mail-send-history-detail-modal__attachment-list">
                  {attachments.map(item => (
                    <li key={item.fileName}>
                      <button
                        type="button"
                        className="mail-send-history-detail-modal__attachment-link"
                        onClick={() => {
                          void handleDownload(item.fileName)
                        }}
                      >
                        {item.fileName}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="mail-send-history-detail-modal__attachment-empty">
                  첨부된 파일이 없습니다.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
