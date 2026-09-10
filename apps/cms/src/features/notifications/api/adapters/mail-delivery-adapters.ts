import type {
  NotificationDeliveryDetailResponse,
  NotificationDeliveryResponse,
} from '@/shared/api/generated/notifications/schemas'
import { formatMailPreviewPerson } from '@/features/notifications/model/mail-template/preview'
import { formatNotificationFailedReason } from '@/features/notifications/model/shared/format-notification-failed-reason'
import type {
  MailBroadcastTiming,
  MailReceiveStatus,
  MailSendHistoryAttachment,
  MailSendHistoryRow,
  MailSendStatus,
} from '@/features/notifications/model/mail-send-history/types'

/** BE sendStatus → UI 라벨 (알림톡과 동일 SSOT) */
const SEND_STATUS_MAP: Record<string, Exclude<MailSendStatus, '전체'>> = {
  REQUESTED: '발송 요청',
  SCHEDULED: '예약',
  WAITED: '대기',
  QUEUED: '대기',
  PENDING: '대기',
  IN_PROGRESS: '발송중',
  SENDING: '발송중',
  SENT: '발송 성공',
  SUCCESS: '발송 성공',
  DELIVERED: '발송 성공',
  SEND_FAILED: '발송 실패',
  FAILED: '발송 실패',
  FAILURE: '발송 실패',
  CANCELED: '취소',
  CANCELLED: '취소',
  UNKNOWN: '확인불가',
}

/** BE receiptStatus → UI 라벨 */
const RECEIVE_STATUS_MAP: Record<string, Exclude<MailReceiveStatus, '전체'>> = {
  REQUESTED: '요청됨',
  CONFIRM_WAITED: '확인 대기중',
  WAITING_CONFIRM: '확인 대기중',
  WAITED: '대기중',
  PENDING: '대기중',
  SCHEDULED: '예약됨',
  IN_PROGRESS: '대기중',
  SENT: '수신 성공',
  SUCCESS: '수신 성공',
  DELIVERED: '수신 성공',
  OPENED: '수신 성공',
  SEND_FAILED: '수신 실패',
  DELIVERY_FAILED: '수신 실패',
  FAILED: '수신 실패',
  FAILURE: '수신 실패',
  CANCELED: '취소됨',
  CANCELLED: '취소됨',
  UNKNOWN: '확인불가',
}

function mapSendStatus(raw?: string | null): Exclude<MailSendStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (SEND_STATUS_MAP[key]) return SEND_STATUS_MAP[key]
  if ((Object.values(SEND_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<MailSendStatus, '전체'>
  }
  // 미지 코드는 REQUESTED로 떨어뜨리지 않음 (알림톡과 동일)
  return '확인불가'
}

function mapReceiveStatus(raw?: string | null): Exclude<MailReceiveStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (RECEIVE_STATUS_MAP[key]) return RECEIVE_STATUS_MAP[key]
  if ((Object.values(RECEIVE_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<MailReceiveStatus, '전체'>
  }
  return '확인불가'
}

function mapBroadcastTiming(
  item: NotificationDeliveryResponse
): Exclude<MailBroadcastTiming, '전체'> {
  const timing = (item.sendTiming ?? '').trim().toUpperCase()
  if (timing === 'SCHEDULED' || timing === '예약' || item.scheduledAt) return '예약'
  return '즉시'
}

function asPreviewRecord(
  preview: NotificationDeliveryDetailResponse['preview']
): Record<string, unknown> | null {
  if (preview == null || typeof preview !== 'object' || Array.isArray(preview)) return null
  return preview as Record<string, unknown>
}

function previewString(preview: Record<string, unknown> | null, keys: string[]): string {
  if (!preview) return ''
  for (const key of keys) {
    const value = preview[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

function previewAttachmentItems(
  preview: Record<string, unknown> | null
): MailSendHistoryAttachment[] {
  if (!preview) return []
  const raw = preview.attachments
  if (Array.isArray(raw)) {
    return raw
      .map(item => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const fileName =
          typeof record.fileName === 'string' ? record.fileName.trim() : ''
        if (!fileName) return null
        const fileObjectId =
          typeof record.fileObjectId === 'number' && Number.isFinite(record.fileObjectId)
            ? record.fileObjectId
            : undefined
        const downloadHint =
          typeof record.downloadHint === 'string' ? record.downloadHint.trim() : undefined
        const byteSize =
          typeof record.byteSize === 'number' && Number.isFinite(record.byteSize)
            ? record.byteSize
            : undefined
        const mapped: MailSendHistoryAttachment = { fileName }
        if (fileObjectId != null) mapped.fileObjectId = fileObjectId
        if (downloadHint) mapped.downloadHint = downloadHint
        if (byteSize != null) mapped.byteSize = byteSize
        return mapped
      })
      .filter((row): row is MailSendHistoryAttachment => row != null)
  }
  const names = preview.attachmentFileNames
  if (!Array.isArray(names)) return []
  return names
    .map(name => String(name).trim())
    .filter(Boolean)
    .map(fileName => ({ fileName }))
}

export function mapMailDeliveryToSendHistoryRow(
  item: NotificationDeliveryResponse,
  preview?: NotificationDeliveryDetailResponse['preview']
): MailSendHistoryRow | null {
  if (item.deliveryId == null) return null

  const previewRecord = asPreviewRecord(preview)
  const receiverName = item.recipientName?.trim() || ''
  const receiverEmail = item.recipientContactMasked?.trim() || ''
  const senderDisplay =
    previewString(previewRecord, ['senderDisplay', 'senderProfileDisplayName']) ||
    formatMailPreviewPerson(item.senderDisplayName, item.senderKey)
  const senderName =
    item.senderDisplayName?.trim() ||
    (senderDisplay.includes('<')
      ? senderDisplay.slice(0, senderDisplay.indexOf('<')).trim()
      : senderDisplay) ||
    ''
  const senderEmail =
    item.senderKey?.trim() ||
    (senderDisplay.includes('<')
      ? senderDisplay.slice(senderDisplay.indexOf('<') + 1, senderDisplay.indexOf('>')).trim()
      : '') ||
    ''
  const templateName = item.templateDisplayName?.trim() || ''
  // 목록 SSOT: renderedTitle || titleTemplate (templateDisplayName 위장 금지)
  // 상세: preview 동일 키 우선
  const subjectFromItem =
    item.renderedTitle?.trim() || item.titleTemplate?.trim() || ''
  const subjectFromPreview = previewString(previewRecord, [
    'renderedTitle',
    'titleTemplate',
  ])
  const subject = subjectFromPreview || subjectFromItem || '-'
  // 본문: renderedContent || contentTemplate (failedReason을 본문에 넣지 않음)
  const bodyHtml = previewString(previewRecord, [
    'renderedContent',
    'contentTemplate',
    'bodyHtml',
    'content',
    'body',
  ])

  const sendStatus = mapSendStatus(item.sendStatus)
  const failedReasonRaw = item.failedReason?.trim() || ''
  const failedReason =
    sendStatus === '발송 실패'
      ? formatNotificationFailedReason(failedReasonRaw) || failedReasonRaw
      : ''

  const readStatus: MailSendHistoryRow['readStatus'] = item.openedAt
    ? '읽음'
    : item.deliveredAt || item.sentAt
      ? '안읽음'
      : '-'

  const attachments = previewAttachmentItems(previewRecord)

  return {
    id: String(item.deliveryId),
    requestAt: item.requestedAt ?? '',
    reservedAt: item.scheduledAt ?? '',
    subject,
    senderName,
    senderEmail,
    senderInfo: senderDisplay || formatMailPreviewPerson(senderName, senderEmail) || '-',
    receiverName,
    receiverEmail,
    receiverInfo: formatMailPreviewPerson(receiverName, receiverEmail),
    broadcastTiming: mapBroadcastTiming(item),
    sendStatus,
    receiveStatus: mapReceiveStatus(item.receiptStatus),
    // 발송/수신일시: sentAt / deliveredAt만 (requestedAt·openedAt 대체 금지)
    sentAt: item.sentAt?.trim() || '',
    receivedAt: item.deliveredAt?.trim() || '',
    readStatus,
    templateName,
    bodyHtml,
    failedReason: failedReason || undefined,
    attachmentFileNames: attachments.map(item => item.fileName),
    attachments,
  }
}

export function mapMailDeliveryListResponse(
  items: NotificationDeliveryResponse[] | undefined
): MailSendHistoryRow[] {
  return (items ?? [])
    .map(item => mapMailDeliveryToSendHistoryRow(item))
    .filter((row): row is MailSendHistoryRow => row != null)
}

export function mapMailDeliveryDetailResponse(
  detail: NotificationDeliveryDetailResponse | null | undefined
): MailSendHistoryRow | null {
  const delivery = detail?.delivery
  if (!delivery) return null
  return mapMailDeliveryToSendHistoryRow(delivery, detail?.preview)
}
