import type {
  NotificationDeliveryDetailResponse,
  NotificationDeliveryResponse,
  NotificationTemplatePreviewResponse,
} from '@/shared/api/generated/notifications/schemas'
import {
  mapAlimtalkEmphasisType,
  mapAlimtalkMessageType,
  mapAlimtalkMetadataFields,
  mapNotificationTemplatePreviewToItem,
} from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { formatNotificationFailedReason } from '@/features/notifications/model/shared/format-notification-failed-reason'
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

/** BE sendStatus → UI 라벨 (deliveryStatus 원시값 직접 노출 금지) */
const SEND_STATUS_MAP: Record<string, Exclude<AlimtalkSendStatus, '전체'>> = {
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
  if ((Object.values(SEND_STATUS_MAP) as string[]).includes(raw ?? '')) {
    return raw as Exclude<AlimtalkSendStatus, '전체'>
  }
  // 미지 코드는 REQUESTED로 떨어뜨리지 않음 (FAILED→REQUESTED 오표시 방지)
  return '확인불가'
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
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function emptyPhoneTemplate(): AlimtalkTemplateItem {
  return {
    id: 'unused',
    name: '-',
    templateName: '-',
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

/**
 * 우측 목업 — 템플릿 2-2와 동일 렌더러 입력.
 * 우선순위: renderedContent || contentTemplate / alimtalkMetadata / message·emphasis type / senderDisplay
 * 기본은 detail.preview만 사용 (템플릿 preview API 폴백 없음).
 */
export function mapPreviewToPhoneTemplate(
  preview: NotificationDeliveryDetailResponse['preview'],
  delivery: NotificationDeliveryResponse
): AlimtalkTemplateItem {
  const previewRecord = asPreviewRecord(preview)
  const content =
    previewString(previewRecord, ['renderedContent', 'contentTemplate']) || ''
  const templateName =
    previewString(previewRecord, ['templateDisplayName', 'displayName', 'renderedTitle']) ||
    delivery.templateDisplayName?.trim() ||
    '-'
  const senderFromPreview = previewString(previewRecord, [
    'senderDisplay',
    'senderProfileDisplayName',
  ])
  const senderProfile =
    senderFromPreview ||
    delivery.senderDisplayName?.trim() ||
    delivery.senderKey?.trim() ||
    '-'

  const templateId =
    (typeof previewRecord?.templateId === 'number' ? previewRecord.templateId : null) ??
    delivery.templateId ??
    null

  if (previewRecord) {
    const asTemplatePreview = {
      ...(preview as NotificationTemplatePreviewResponse),
      templateId: templateId ?? undefined,
      displayName: templateName === '-' ? undefined : templateName,
      // 렌더러 content 소스: 치환본문 우선
      contentTemplate: content || undefined,
      senderProfileDisplayName: senderProfile === '-' ? undefined : senderProfile,
      alimtalkMessageType:
        previewString(previewRecord, ['alimtalkMessageType']) || undefined,
      alimtalkEmphasisType:
        previewString(previewRecord, ['alimtalkEmphasisType']) || undefined,
      alimtalkMetadata: previewRecord.alimtalkMetadata as
        | NotificationTemplatePreviewResponse['alimtalkMetadata']
        | undefined,
    } satisfies NotificationTemplatePreviewResponse

    const mapped = mapNotificationTemplatePreviewToItem(
      asTemplatePreview,
      emptyPhoneTemplate()
    )
    if (mapped) {
      const meta = mapAlimtalkMetadataFields(previewRecord.alimtalkMetadata)
      return {
        ...mapped,
        id: templateId != null ? String(templateId) : mapped.id,
        name: templateName,
        templateName,
        senderProfile,
        content: content || mapped.content,
        messageType: previewString(previewRecord, ['alimtalkMessageType'])
          ? mapAlimtalkMessageType(previewString(previewRecord, ['alimtalkMessageType']))
          : mapped.messageType,
        emphasisType: previewString(previewRecord, ['alimtalkEmphasisType'])
          ? mapAlimtalkEmphasisType(previewString(previewRecord, ['alimtalkEmphasisType']))
          : mapped.emphasisType,
        buttons: meta.buttons?.length ? meta.buttons : mapped.buttons,
        quickLinks: meta.quickLinks?.length ? meta.quickLinks : mapped.quickLinks,
        extraInfo: meta.extraInfo || mapped.extraInfo,
        emphasisTitle: meta.emphasisTitle ?? mapped.emphasisTitle,
        emphasisSubtitle: meta.emphasisSubtitle ?? mapped.emphasisSubtitle,
        imageUrl: meta.imageUrl ?? mapped.imageUrl,
        templateHeader: meta.templateHeader ?? mapped.templateHeader,
        itemTitle: meta.itemTitle ?? mapped.itemTitle,
        itemDescription: meta.itemDescription ?? mapped.itemDescription,
        itemImageUrl: meta.itemImageUrl ?? mapped.itemImageUrl,
        itemList: meta.itemList ?? mapped.itemList,
        itemSummary: meta.itemSummary ?? mapped.itemSummary,
      }
    }
  }

  return {
    ...emptyPhoneTemplate(),
    id: templateId != null ? String(templateId) : 'unused',
    name: templateName,
    templateName,
    senderProfile,
    content,
  }
}

export function mapDeliveryToSendHistoryRow(
  item: NotificationDeliveryResponse,
  phoneTemplate?: AlimtalkTemplateItem
): AlimtalkSendHistoryRow | null {
  if (item.deliveryId == null) return null

  const receiverName = item.recipientName?.trim() || '-'
  const receiverPhone = item.recipientContactMasked?.trim() || '-'
  const templateName = item.templateDisplayName?.trim() || '-'
  const senderInfo =
    item.senderDisplayName?.trim() || item.senderKey?.trim() || '-'
  const sendStatus = mapSendStatus(item.sendStatus)
  const failedReasonRaw = item.failedReason?.trim() || ''
  const failedReason =
    sendStatus === '발송 실패' ? formatNotificationFailedReason(failedReasonRaw) || failedReasonRaw : ''

  return {
    id: String(item.deliveryId),
    requestAt: item.requestedAt ?? '',
    sendRequestedAt: item.requestedAt ?? '',
    receiveRequestedAt: item.requestedAt ?? '',
    reservedAt: item.scheduledAt ?? '',
    templateName,
    senderInfo,
    receiverName,
    receiverPhone,
    receiverInfo: `${receiverName} | ${receiverPhone}`,
    broadcastTiming: mapBroadcastTiming(item),
    sendStatus,
    receiveStatus: mapReceiveStatus(item.receiptStatus),
    // 발송/수신일시: sentAt / deliveredAt만. requestedAt·openedAt 대체 금지
    sentAt: item.sentAt?.trim() || '',
    receivedAt: item.deliveredAt?.trim() || '',
    sendCount: '1건',
    sendNumber: item.providerMessageId || item.providerRequestId || String(item.deliveryId),
    message: item.providerResultMessage || failedReason || failedReasonRaw || '',
    failedReason: failedReason || undefined,
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
