import type {
  NotificationDeliveryDetailResponse,
  NotificationDeliveryResponse,
} from '@/shared/api/generated/notifications/schemas'
import { formatMailPreviewPerson } from '@/features/notifications/model/mail-template/preview'
import type {
  MailBroadcastTiming,
  MailReceiveStatus,
  MailSendHistoryRow,
  MailSendStatus,
} from '@/features/notifications/model/mail-send-history/types'

const SEND_STATUS_MAP: Record<string, Exclude<MailSendStatus, '전체'>> = {
  REQUESTED: '발송 요청',
  CANCELLED: '발송 취소',
  CANCELED: '발송 취소',
  SCHEDULED: '발송 예약',
  QUEUED: '발송 대기',
  PENDING: '발송 대기',
  SENDING: '발송 중',
  IN_PROGRESS: '발송 중',
  FAILED: '발송 실패',
  FAILURE: '발송 실패',
  SUCCESS: '발송 성공',
  SENT: '발송 성공',
  DELIVERED: '발송 성공',
}

const RECEIVE_STATUS_MAP: Record<string, Exclude<MailReceiveStatus, '전체'>> = {
  REQUESTED: '요청됨',
  WAITING_CONFIRM: '확인 대기중',
  PENDING: '대기중',
  SCHEDULED: '예약됨',
  SUCCESS: '수신 성공',
  DELIVERED: '수신 성공',
  OPENED: '수신 성공',
  FAILED: '수신 실패',
  FAILURE: '수신 실패',
  CANCELLED: '취소됨',
  CANCELED: '취소됨',
}

function mapSendStatus(raw?: string | null): Exclude<MailSendStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (SEND_STATUS_MAP[key]) return SEND_STATUS_MAP[key]
  if ((Object.values(SEND_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<MailSendStatus, '전체'>
  }
  return '발송 요청'
}

function mapReceiveStatus(raw?: string | null): Exclude<MailReceiveStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (RECEIVE_STATUS_MAP[key]) return RECEIVE_STATUS_MAP[key]
  if ((Object.values(RECEIVE_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<MailReceiveStatus, '전체'>
  }
  return '요청됨'
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

function previewAttachments(preview: Record<string, unknown> | null): string[] {
  if (!preview) return []
  const raw = preview.attachments
  if (!Array.isArray(raw)) {
    const names = preview.attachmentFileNames
    if (Array.isArray(names)) {
      return names.map(name => String(name).trim()).filter(Boolean)
    }
    return []
  }
  return raw
    .map(item => {
      if (!item || typeof item !== 'object') return ''
      const record = item as Record<string, unknown>
      const fileName = record.fileName
      return typeof fileName === 'string' ? fileName.trim() : ''
    })
    .filter(Boolean)
}

export function mapMailDeliveryToSendHistoryRow(
  item: NotificationDeliveryResponse,
  preview?: NotificationDeliveryDetailResponse['preview']
): MailSendHistoryRow | null {
  if (item.deliveryId == null) return null

  const previewRecord = asPreviewRecord(preview)
  const receiverName = item.recipientName?.trim() || ''
  const receiverEmail = item.recipientContactMasked?.trim() || ''
  const senderDisplay = previewString(previewRecord, ['senderDisplay'])
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
  const subject =
    previewString(previewRecord, ['titleTemplate', 'subject', 'title', 'displayName']) ||
    templateName ||
    '(제목 없음)'
  const bodyHtml =
    previewString(previewRecord, ['contentTemplate', 'bodyHtml', 'content', 'body']) ||
    item.providerResultMessage ||
    item.failedReason ||
    ''

  const readStatus: MailSendHistoryRow['readStatus'] = item.openedAt
    ? '읽음'
    : item.deliveredAt || item.sentAt
      ? '안읽음'
      : '-'

  return {
    id: String(item.deliveryId),
    requestAt: item.requestedAt ?? '',
    reservedAt: item.scheduledAt ?? '',
    subject,
    senderName,
    senderEmail,
    senderInfo: formatMailPreviewPerson(senderName, senderEmail) || senderDisplay || '-',
    receiverName,
    receiverEmail,
    receiverInfo: formatMailPreviewPerson(receiverName, receiverEmail),
    broadcastTiming: mapBroadcastTiming(item),
    sendStatus: mapSendStatus(item.sendStatus || item.deliveryStatus),
    receiveStatus: mapReceiveStatus(item.receiptStatus || item.deliveryStatus),
    sentAt: item.sentAt ?? item.deliveredAt ?? '',
    receivedAt: item.deliveredAt ?? item.openedAt ?? '',
    readStatus,
    templateName,
    bodyHtml,
    attachmentFileNames: previewAttachments(previewRecord),
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
