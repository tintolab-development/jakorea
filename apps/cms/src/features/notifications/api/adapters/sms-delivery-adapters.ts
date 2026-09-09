import type {
  NotificationDeliveryDetailResponse,
  NotificationDeliveryResponse,
} from '@/shared/api/generated/notifications/schemas'
import {
  SMS_SENDER_NUMBER_TYPE_OPTIONS,
  type SmsMessageType,
  type SmsSenderNumberType,
} from '@/features/notifications/api/adapters/sms-channel'
import { formatNotificationFailedReason } from '@/features/notifications/model/shared/format-notification-failed-reason'
import type {
  SmsBroadcastTiming,
  SmsReceiveStatus,
  SmsSendHistoryAttachment,
  SmsSendHistoryRow,
  SmsSendStatus,
} from '@/features/notifications/model/sms-send-history/types'

/** BE sendStatus → 기획 4-1 UI 라벨 */
const SEND_STATUS_MAP: Record<string, Exclude<SmsSendStatus, '전체'>> = {
  REQUESTED: '발송 요청',
  SCHEDULED: '발송 예약',
  WAITED: '발송 대기',
  QUEUED: '발송 대기',
  PENDING: '발송 대기',
  IN_PROGRESS: '발송 중',
  SENDING: '발송 중',
  SENT: '발송 성공',
  SUCCESS: '발송 성공',
  DELIVERED: '발송 성공',
  SEND_FAILED: '발송 실패',
  FAILED: '발송 실패',
  FAILURE: '발송 실패',
  CANCELED: '발송 취소',
  CANCELLED: '발송 취소',
}

const RECEIVE_STATUS_MAP: Record<string, Exclude<SmsReceiveStatus, '전체'>> = {
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
}

function mapSendStatus(raw?: string | null): Exclude<SmsSendStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (SEND_STATUS_MAP[key]) return SEND_STATUS_MAP[key]
  if ((Object.values(SEND_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<SmsSendStatus, '전체'>
  }
  return '발송 요청'
}

function mapReceiveStatus(raw?: string | null): Exclude<SmsReceiveStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (RECEIVE_STATUS_MAP[key]) return RECEIVE_STATUS_MAP[key]
  if ((Object.values(RECEIVE_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<SmsReceiveStatus, '전체'>
  }
  return '요청됨'
}

function mapBroadcastTiming(
  item: NotificationDeliveryResponse
): Exclude<SmsBroadcastTiming, '전체'> {
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

function mapMessageType(
  item: NotificationDeliveryResponse,
  preview: Record<string, unknown> | null
): SmsMessageType {
  const raw = (
    previewString(preview, ['messageType', 'smsMessageType', 'providerChannelType']) ||
    item.providerChannelType ||
    ''
  )
    .trim()
    .toUpperCase()
  if (raw === 'MMS') return 'MMS'
  if (raw === 'LMS' || raw === 'LMS/MMS') return 'LMS'
  if (raw === 'SMS') return 'SMS'
  // 제목·본문 길이로 추정
  const subject = previewString(preview, ['renderedTitle', 'titleTemplate', 'subject'])
  const body = previewString(preview, ['renderedContent', 'contentTemplate', 'content', 'body'])
  if (previewAttachmentItems(preview).length > 0) return 'MMS'
  if (subject || body.length > 90) return 'LMS'
  return 'SMS'
}

function mapSenderNumberType(preview: Record<string, unknown> | null): SmsSenderNumberType | '' {
  const raw = previewString(preview, [
    'senderNumberType',
    'senderPhoneType',
    'senderProfileType',
  ]).trim()
  if (!raw) return ''
  const matched = SMS_SENDER_NUMBER_TYPE_OPTIONS.find(
    option => option === raw || option.includes(raw) || raw.includes(option)
  )
  return matched ?? ''
}

function previewAttachmentItems(
  preview: Record<string, unknown> | null
): SmsSendHistoryAttachment[] {
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
        const mapped: SmsSendHistoryAttachment = { fileName }
        if (fileObjectId != null) mapped.fileObjectId = fileObjectId
        if (downloadHint) mapped.downloadHint = downloadHint
        if (byteSize != null) mapped.byteSize = byteSize
        return mapped
      })
      .filter((row): row is SmsSendHistoryAttachment => row != null)
  }
  const names = preview.attachmentFileNames
  if (!Array.isArray(names)) return []
  return names
    .map(name => String(name).trim())
    .filter(Boolean)
    .map(fileName => ({ fileName }))
}

function truncateContent(text: string, max = 80): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max)}…`
}

function formatSenderInfo(type: SmsSenderNumberType | '', phone: string): string {
  if (type && phone) return `${type} | ${phone}`
  return phone || type || '-'
}

export function mapSmsDeliveryToSendHistoryRow(
  item: NotificationDeliveryResponse,
  preview?: NotificationDeliveryDetailResponse['preview']
): SmsSendHistoryRow | null {
  if (item.deliveryId == null) return null

  const previewRecord = asPreviewRecord(preview)
  const senderPhone =
    item.senderKey?.trim() ||
    previewString(previewRecord, ['senderPhone', 'senderNumber']) ||
    ''
  const senderNumberType = mapSenderNumberType(previewRecord)
  const senderDisplay =
    previewString(previewRecord, ['senderDisplay']) ||
    formatSenderInfo(senderNumberType, senderPhone)
  const receiverPhone = item.recipientContactMasked?.trim() || ''
  const templateName = item.templateDisplayName?.trim() || ''
  const subject = previewString(previewRecord, ['renderedTitle', 'titleTemplate', 'subject'])
  const bodyText = previewString(previewRecord, [
    'renderedContent',
    'contentTemplate',
    'content',
    'body',
    'bodyText',
  ])
  const messageType = mapMessageType(item, previewRecord)
  const sendStatus = mapSendStatus(item.sendStatus)
  const failedReasonRaw = item.failedReason?.trim() || ''
  const failedReason =
    sendStatus === '발송 실패'
      ? formatNotificationFailedReason(failedReasonRaw) || failedReasonRaw
      : ''
  const attachments = previewAttachmentItems(previewRecord)
  const contentSource = bodyText || subject || templateName

  return {
    id: String(item.deliveryId),
    requestAt: item.requestedAt ?? '',
    reservedAt: item.scheduledAt ?? '',
    content: truncateContent(contentSource),
    subject,
    senderNumberType,
    senderPhone,
    senderInfo: senderDisplay || senderPhone || '-',
    receiverPhone,
    receiverInfo: receiverPhone || '-',
    broadcastTiming: mapBroadcastTiming(item),
    sendStatus,
    receiveStatus: mapReceiveStatus(item.receiptStatus),
    sentAt: item.sentAt?.trim() || '',
    receivedAt: item.deliveredAt?.trim() || '',
    templateName,
    messageType,
    bodyText,
    failedReason: failedReason || undefined,
    attachmentFileNames: attachments.map(item => item.fileName),
    attachments,
  }
}

export function mapSmsDeliveryListResponse(
  items: NotificationDeliveryResponse[] | undefined
): SmsSendHistoryRow[] {
  return (items ?? [])
    .map(item => mapSmsDeliveryToSendHistoryRow(item))
    .filter((row): row is SmsSendHistoryRow => row != null)
}

export function mapSmsDeliveryDetailResponse(
  detail: NotificationDeliveryDetailResponse | null | undefined
): SmsSendHistoryRow | null {
  const delivery = detail?.delivery
  if (!delivery) return null
  return mapSmsDeliveryToSendHistoryRow(delivery, detail?.preview)
}
