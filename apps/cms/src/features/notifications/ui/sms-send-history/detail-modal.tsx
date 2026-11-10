import { NotificationSendStatusText } from '@/features/notifications/ui/shared/send-status-text'
import { Fragment } from 'react'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ContentModal, useCmsAlert } from '@/shared/ui'
import { downloadSmsSendHistoryAttachment } from '@/features/notifications/model/sms-send-history/download-attachment'
import type {
  SmsSendHistoryAttachment,
  SmsSendHistoryRow,
} from '@/features/notifications/model/sms-send-history/types'
import { NOTIFICATION_SEND_FAILURE_SNAPSHOT_HINT } from '@/features/notifications/model/shared/send-ux-copy'
import { formatSmsMessageTypeCode } from '@/features/notifications/model/sms-template/message-type'
import { formatSmsSenderPhoneLabel } from '@/features/notifications/model/sms-template/sender-phone'
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

/** 발송자 값 세그먼트 — 시안 「유형 │ 번호」. `|`가 박힌 원문은 나눠서 디바이더로 다시 잇는다. */
function senderSegments(row: SmsSendHistoryRow): string[] {
  const type = row.senderNumberType?.trim()
  const phone = row.senderPhone?.trim() || row.senderInfo?.trim()
  if (type && phone && !phone.includes('|')) return [type, formatSmsSenderPhoneLabel(phone)]
  const info = row.senderInfo?.trim()
  if (info) {
    return info
      .split('|')
      .map(segment => segment.trim())
      .filter(Boolean)
      .map(formatSmsSenderPhoneLabel)
  }
  const fallback = phone || type
  return fallback ? [formatSmsSenderPhoneLabel(fallback)] : []
}

function SenderView({ row }: { row: SmsSendHistoryRow }) {
  const segments = senderSegments(row)
  if (segments.length === 0) return <>-</>
  return (
    <span className="sms-send-history-detail-modal__sender">
      {segments.map((segment, index) => (
        <Fragment key={`${segment}-${index}`}>
          {index > 0 ? <DetailInfoForm.TdDivider /> : null}
          <span>{segment}</span>
        </Fragment>
      ))}
    </span>
  )
}

function sendStatusView(row: SmsSendHistoryRow) {
  if (row.sendStatus === '발송 실패' && row.failedReason?.trim()) {
    return (
      <span className="sms-send-history-detail-modal__status-with-reason">
        <NotificationSendStatusText status={row.sendStatus} />
        <span
          className="sms-send-history-detail-modal__failed-reason"
          title={row.failedReason}
        >
          {row.failedReason}
        </span>
        <span className="sms-send-history-detail-modal__snapshot-hint">
          {NOTIFICATION_SEND_FAILURE_SNAPSHOT_HINT}
        </span>
      </span>
    )
  }
  return <NotificationSendStatusText status={row.sendStatus} />
}

export function DetailModal({ open, row, loading, onClose }: DetailModalProps) {
  const { showAlert } = useCmsAlert()
  const receiver = row?.receiverInfo?.trim() || row?.receiverPhone?.trim() || '-'
  const templateName = row?.templateName.trim() ? row.templateName : '미사용'
  const showSubject = row != null && row.messageType !== 'SMS'
  const showAttachments = row?.messageType === 'MMS'
  const attachments: SmsSendHistoryAttachment[] =
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
        <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      {loading && !row ? (
        <div
          className="sms-send-history-detail-modal__loading"
          role="status"
          aria-label="로딩 중"
          aria-busy="true"
        >
          <Spin size="large" />
        </div>
      ) : row ? (
        <div className="sms-send-history-detail-modal__content">
          <DetailInfoForm title="발송 정보" hideHeader mode="view">
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="발송일시" view={formatDateTime(row.sentAt)} />
              <DetailInfoForm.Field label="수신일시" view={formatDateTime(row.receivedAt)} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="발송자" view={<SenderView row={row} />} />
              <DetailInfoForm.Field label="수신자" view={receiver} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="발송 상태" view={sendStatusView(row)} />
              <DetailInfoForm.Field
                label="발송 유형"
                view={formatSmsMessageTypeCode(row.messageType)}
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="템플릿명" fullRow view={templateName} />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm title="문자 내용" hideHeader mode="view">
            {showSubject ? (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="제목" fullRow view={row.subject?.trim() || '-'} />
              </DetailInfoForm.Row>
            ) : null}
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="내용"
                fullRow
                view={
                  bodyText ? (
                    <pre className="sms-send-history-detail-modal__body">{bodyText}</pre>
                  ) : (
                    '-'
                  )
                }
              />
            </DetailInfoForm.Row>
            {showAttachments ? (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="첨부파일"
                  fullRow
                  view={
                    attachments.length > 0 ? (
                      <ul className="sms-send-history-detail-modal__attachment-list">
                        {attachments.map((item, index) => (
                          <li key={`${item.fileName}-${index}`}>
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
                    )
                  }
                />
              </DetailInfoForm.Row>
            ) : null}
          </DetailInfoForm>
        </div>
      ) : null}
    </ContentModal>
  )
}
