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
  AlimtalkSendHistoryRow,
} from '@/features/notifications/model/alimtalk-send-history/types'
import {
  ALIMTALK_ROOT_CATEGORY_ID,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'
import {
  mapNotificationReceiveStatus,
  mapNotificationSendStatus,
} from '@/features/notifications/model/shared/delivery-status'

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
  const broadcastTiming = mapBroadcastTiming(item)
  const sendStatus = mapNotificationSendStatus(item.sendStatus, {
    scheduled: broadcastTiming === '예약',
  })
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
    broadcastTiming,
    sendStatus,
    receiveStatus: mapNotificationReceiveStatus(item.receiptStatus),
    // 발송/수신일시: sentAt / deliveredAt만. requestedAt·openedAt 대체 금지
    sentAt: item.sentAt?.trim() || '',
    receivedAt: item.deliveredAt?.trim() || '',
    sendCount: '1건',
    sendNumber: item.providerMessageId || item.providerRequestId || String(item.deliveryId),
    // 발송 실패 행은 정리된 실패 사유를 발송사 원문 메시지보다 먼저 보여 준다.
    message: failedReason || item.providerResultMessage || failedReasonRaw || '',
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
