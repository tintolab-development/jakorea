import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ContentModal, useCmsAlert } from '@/shared/ui'
import { downloadSmsSendHistoryAttachment } from '@/features/notifications/model/sms-send-history/download-attachment'
import type { SmsSendHistoryRow } from '@/features/notifications/model/sms-send-history/types'
import './detail-modal.css'

type DetailModalProps = {
  open: boolean
  row: SmsSendHistoryRow | null
  loading?: boolean
  onClose: () => void
}

const DATETIME_FORMAT = 'YYYY.MM.DD HH:mm:ss'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(DATETIME_FORMAT) : '-'
}

function formatSender(row: SmsSendHistoryRow): string {
  const type = row.senderNumberType?.trim()
  const phone = row.senderPhone?.trim() || row.senderInfo?.trim()
  if (type && phone && !phone.includes('|')) return `${type} | ${phone}`
  if (row.senderInfo?.trim()) return row.senderInfo.trim()
  return phone || type || '-'
}

function sendStatusView(row: SmsSendHistoryRow) {
  if (row.sendStatus === '발송 실패' && row.failedReason?.trim()) {
    return (
      <span className="sms-send-history-detail-modal__status-with-reason">
        <span>{row.sendStatus}</span>
        <span
          className="sms-send-history-detail-modal__failed-reason"
          title={row.failedReason}
        >
          {row.failedReason}
        </span>
      </span>
    )
  }
  return row.sendStatus
}

export function DetailModal({ open, row, loading, onClose }: DetailModalProps) {
  const { showAlert } = useCmsAlert()
  const sender = row ? formatSender(row) : '-'
  const receiver = row?.receiverInfo?.trim() || row?.receiverPhone?.trim() || '-'
  const templateName = row?.templateName.trim() ? row.templateName : '미사용'
  const showSubject = row != null && row.messageType !== 'SMS'
  const showAttachments = row?.messageType === 'MMS'
  const attachments =
    row?.attachments && row.attachments.length > 0
      ? row.attachments
      : (row?.attachmentFileNames ?? []).map(fileName => ({ fileName }))
  const bodyText = row?.bodyText?.trim() || row?.content?.trim() || ''

  const handleDownload = async (fileName: string) => {
    const attachment = attachments.find(item => item.fileName === fileName) ?? { fileName }
    try {
      await downloadSmsSendHistoryAttachment(attachment)
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
      title="문자 발송 조회 상세"
      className="sms-send-history-detail-modal"
      size="wide"
      footer={
        <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      {loading && !row ? (
        <div className="sms-send-history-detail-modal__loading" aria-busy="true">
          불러오는 중…
        </div>
      ) : row ? (
        <div className="sms-send-history-detail-modal__content">
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
              <DetailInfoForm.Field label="발송 유형" view={row.messageType} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="템플릿명" fullRow view={templateName} />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <div className="sms-send-history-detail-modal__message">
            {showSubject ? (
              <h3 className="sms-send-history-detail-modal__subject">{row.subject || '-'}</h3>
            ) : null}
            {bodyText ? (
              <pre className="sms-send-history-detail-modal__body">{bodyText}</pre>
            ) : (
              <p className="sms-send-history-detail-modal__body-empty">-</p>
            )}
            {showAttachments ? (
              <div className="sms-send-history-detail-modal__attachments">
                <span className="sms-send-history-detail-modal__attachments-label">첨부파일</span>
                {attachments.length > 0 ? (
                  <ul className="sms-send-history-detail-modal__attachment-list">
                    {attachments.map(item => (
                      <li key={item.fileName}>
                        <button
                          type="button"
                          className="sms-send-history-detail-modal__attachment-link"
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
                  <span className="sms-send-history-detail-modal__attachment-empty">
                    첨부된 파일이 없습니다.
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
