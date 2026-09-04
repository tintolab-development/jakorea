import type {
  NotificationDeliveryDetailResponse,
  NotificationDeliveryResponse,
  NotificationTemplatePreviewResponse,
} from '@/shared/api/generated/notifications/schemas'
import {
  mapNotificationTemplatePreviewToItem,
} from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import type {
  AlimtalkBroadcastTiming,
  AlimtalkReceiveStatus,
  AlimtalkSendHistoryRow,
  AlimtalkSendStatus,
} from '@/features/notifications/model/alimtalk-send-history/types'
import {
  ALIMTALK_ROOT_CATEGORY_ID,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'

const SEND_STATUS_MAP: Record<string, Exclude<AlimtalkSendStatus, '전체'>> = {
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

const RECEIVE_STATUS_MAP: Record<string, Exclude<AlimtalkReceiveStatus, '전체'>> = {
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

function mapSendStatus(raw?: string | null): Exclude<AlimtalkSendStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (SEND_STATUS_MAP[key]) return SEND_STATUS_MAP[key]
  // already Korean label from mock-compatible BE?
  if ((Object.values(SEND_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<AlimtalkSendStatus, '전체'>
  }
  return '발송 요청'
}

function mapReceiveStatus(raw?: string | null): Exclude<AlimtalkReceiveStatus, '전체'> {
  const key = (raw ?? '').trim().toUpperCase()
  if (RECEIVE_STATUS_MAP[key]) return RECEIVE_STATUS_MAP[key]
  if ((Object.values(RECEIVE_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<AlimtalkReceiveStatus, '전체'>
  }
  return '요청됨'
}

function mapBroadcastTiming(
  item: NotificationDeliveryResponse
): Exclude<AlimtalkBroadcastTiming, '전체'> {
  const timing = (item.sendTiming ?? '').trim().toUpperCase()
  if (timing === 'SCHEDULED' || timing === '예약' || item.scheduledAt) return '예약'
  return '즉시'
}

function emptyPhoneTemplate(): AlimtalkTemplateItem {
  return {
    id: 'unused',
    name: '미사용',
    templateName: '미사용',
    categoryId: ALIMTALK_ROOT_CATEGORY_ID,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    senderProfile: '-',
    messageType: 'BASIC',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: '',
    extraInfo: '',
    ctaLabel: '',
    buttons: [],
    quickLinks: [],
  }
}

function mapPreviewToPhoneTemplate(
  preview: NotificationDeliveryDetailResponse['preview'],
  delivery: NotificationDeliveryResponse
): AlimtalkTemplateItem {
  if (preview && typeof preview === 'object') {
    const asTemplatePreview = preview as NotificationTemplatePreviewResponse
    const mapped = mapNotificationTemplatePreviewToItem({
      ...asTemplatePreview,
      templateId: asTemplatePreview.templateId ?? delivery.templateId,
      displayName:
        asTemplatePreview.displayName ??
        delivery.templateDisplayName ??
        delivery.templateCodeSnapshot,
      contentTemplate: asTemplatePreview.contentTemplate,
    })
    if (mapped) {
      return {
        ...mapped,
        senderProfile:
          delivery.senderDisplayName?.trim() ||
          delivery.senderKey?.trim() ||
          mapped.senderProfile,
      }
    }
  }

  const templateName = delivery.templateDisplayName?.trim() || ''
  return {
    ...emptyPhoneTemplate(),
    id: delivery.templateId != null ? String(delivery.templateId) : 'unused',
    name: templateName || '미사용',
    templateName: templateName || '미사용',
    senderProfile: delivery.senderDisplayName?.trim() || delivery.senderKey?.trim() || '-',
    content: '',
  }
}

export function mapDeliveryToSendHistoryRow(
  item: NotificationDeliveryResponse,
  phoneTemplate?: AlimtalkTemplateItem
): AlimtalkSendHistoryRow | null {
  if (item.deliveryId == null) return null

  const receiverName = item.recipientName?.trim() || '-'
  const receiverPhone = item.recipientContactMasked?.trim() || '-'
  const templateName = item.templateDisplayName?.trim() || ''
  const senderInfo =
    item.senderDisplayName?.trim() || item.senderKey?.trim() || '-'

  return {
    id: String(item.deliveryId),
    requestAt: item.requestedAt ?? '',
    sendRequestedAt: item.requestedAt ?? item.sentAt ?? '',
    receiveRequestedAt: item.requestedAt ?? '',
    reservedAt: item.scheduledAt ?? '',
    templateName: templateName || '미사용',
    senderInfo,
    receiverName,
    receiverPhone,
    receiverInfo: `${receiverName} ${receiverPhone}`.trim(),
    broadcastTiming: mapBroadcastTiming(item),
    sendStatus: mapSendStatus(item.sendStatus || item.deliveryStatus),
    receiveStatus: mapReceiveStatus(item.receiptStatus || item.deliveryStatus),
    sentAt: item.sentAt ?? item.deliveredAt ?? '',
    receivedAt: item.deliveredAt ?? item.openedAt ?? '',
    sendCount: '1건',
    sendNumber: item.providerMessageId || item.providerRequestId || String(item.deliveryId),
    message: item.providerResultMessage || item.failedReason || '',
    phoneTemplate: phoneTemplate ?? emptyPhoneTemplate(),
  }
}

export function mapDeliveryListResponse(
  items: NotificationDeliveryResponse[] | undefined
): AlimtalkSendHistoryRow[] {
  return (items ?? [])
    .map(item => mapDeliveryToSendHistoryRow(item))
    .filter((row): row is AlimtalkSendHistoryRow => row != null)
}

export function mapDeliveryDetailResponse(
  detail: NotificationDeliveryDetailResponse | null | undefined
): AlimtalkSendHistoryRow | null {
  const delivery = detail?.delivery
  if (!delivery) return null
  const phoneTemplate = mapPreviewToPhoneTemplate(detail?.preview, delivery)
  return mapDeliveryToSendHistoryRow(delivery, phoneTemplate)
}
