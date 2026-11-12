import type {
  NotificationDeliveryDetailResponse,
  NotificationDeliveryResponse,
} from '@/shared/api/generated/notifications/schemas'
import {
  formatMailPreviewPerson,
  splitMailSenderNameEmail,
} from '@/features/notifications/model/mail-template/preview'
import { parseMailSenderDisplay } from '@/features/notifications/api/adapters/mail-template-adapters'
import { mailBodyToDisplayHtml } from '@/features/notifications/model/shared/mail-body-display-html'
import { resolveNotificationFailedReason } from '@/features/notifications/model/shared/format-notification-failed-reason'
import type {
  MailBroadcastTiming,
  MailSendHistoryAttachment,
  MailSendHistoryRow,
} from '@/features/notifications/model/mail-send-history/types'
import {
  mapNotificationReceiveStatus,
  mapNotificationSendStatus,
} from '@/features/notifications/model/shared/delivery-status'

function mapBroadcastTiming(
  item: NotificationDeliveryResponse
): Exclude<MailBroadcastTiming, '전체'> {
  const timing = (item.sendTiming ?? '').trim().toUpperCase()
  if (timing === 'SCHEDULED' || timing === '예약' || item.scheduledAt) return '예약'
  return '즉시'
}

/**
 * 발송자 이름·메일 분리 (BE 2026-11-10).
 * `senderDisplayName`·preview `senderDisplay`는 「이름 <메일>」, 이름이 없으면 「메일」만 온다.
 * `/^(.*?)\s*<([^>]+)>$/`에 맞지 않으면 값 전체를 메일로 보고, 이름 자리에 메일이 와도 「메일 | 메일」로 겹치지 않게 한다.
 */
export function resolveMailDeliverySender(
  previewDisplay: string,
  itemDisplayName: string | null | undefined,
  senderKey: string | null | undefined
): { senderName: string; senderEmail: string } {
  const fromPreview = parseMailSenderDisplay(previewDisplay)
  const fromItem = parseMailSenderDisplay(itemDisplayName)
  const key = senderKey?.trim() ?? ''
  const email = fromPreview.senderEmail || fromItem.senderEmail || (key.includes('@') ? key : '')
  const name = fromPreview.senderName || fromItem.senderName
  const parts = splitMailSenderNameEmail(name, email)
  return { senderName: parts.name, senderEmail: parts.email }
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
        const fileName = typeof record.fileName === 'string' ? record.fileName.trim() : ''
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
  const { senderName, senderEmail } = resolveMailDeliverySender(
    previewString(previewRecord, ['senderDisplay', 'senderProfileDisplayName']),
    item.senderDisplayName,
    item.senderKey
  )
  const templateName = item.templateDisplayName?.trim() || ''
  // 목록 SSOT: renderedTitle || titleTemplate (templateDisplayName 위장 금지)
  // 상세: preview 동일 키 우선
  const subjectFromItem = item.renderedTitle?.trim() || item.titleTemplate?.trim() || ''
  const subjectFromPreview = previewString(previewRecord, ['renderedTitle', 'titleTemplate'])
  const subject = subjectFromPreview || subjectFromItem || '-'
  // 본문: renderedContent(BE가 이미 HTML 변환·이스케이프한 발송 스냅샷, 그대로 사용) → contentTemplate.
  // contentTemplate(등록 원문)이 평문이면 줄바꿈이 보이도록 이스케이프 + <br> (failedReason 금지)
  const renderedContent = previewString(previewRecord, ['renderedContent'])
  const bodyHtml =
    renderedContent ||
    mailBodyToDisplayHtml(
      previewString(previewRecord, ['contentTemplate', 'bodyHtml', 'content', 'body'])
    )

  const broadcastTiming = mapBroadcastTiming(item)
  const sendStatus = mapNotificationSendStatus(item.sendStatus, {
    scheduled: broadcastTiming === '예약',
  })
  const failedReasonRaw = item.failedReason?.trim() || ''
  // QA-0178: 서버 displayReason 우선, 없으면 failedReason 정리값
  const failedReason =
    sendStatus === '발송 실패'
      ? resolveNotificationFailedReason(item.displayReason, failedReasonRaw)
      : ''
  const receiveStatus = mapNotificationReceiveStatus(item.receiptStatus)
  // 발송 성공·수신 실패: 발송 실패 사유와 별도로 응답에 있는 사유만 보여 준다 (QA-0176)
  const receiveFailedReason =
    sendStatus !== '발송 실패' && receiveStatus === '수신 실패'
      ? resolveNotificationFailedReason(
          item.displayReason,
          failedReasonRaw || item.providerResultMessage?.trim() || ''
        )
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
    senderInfo: formatMailPreviewPerson(senderName, senderEmail),
    receiverName,
    receiverEmail,
    receiverInfo: formatMailPreviewPerson(receiverName, receiverEmail),
    broadcastTiming,
    sendStatus,
    receiveStatus,
    // 발송/수신일시: sentAt / deliveredAt만 (requestedAt·openedAt 대체 금지)
    sentAt: item.sentAt?.trim() || '',
    receivedAt: item.deliveredAt?.trim() || '',
    readStatus,
    templateName,
    bodyHtml,
    failedReason: failedReason || undefined,
    receiveFailedReason: receiveFailedReason || undefined,
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
