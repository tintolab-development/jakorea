import {
  mapBatchBodySnapshotAttachments,
  mapSmsDeliveryDetailResponse,
  mapSmsDeliveryListResponse,
} from '@/features/notifications/api/adapters/sms-delivery-adapters'
import { smsSendHistoryParamsFromSearchParams } from '@/features/notifications/api/sms-send-history-filter-params'
import {
  emptySendHistoryListPage,
  toSendHistoryListPage,
  withSendHistoryPaging,
  type SendHistoryListPage,
} from '@/features/notifications/api/delivery-list-page'
import {
  fetchNotificationDeliveriesRemote,
  fetchNotificationDeliveryRemote,
  fetchSendBatchDetailRemote,
} from '@/features/notifications/api/notifications-api-client'
import type {
  SmsSendHistoryAttachment,
  SmsSendHistoryRow,
} from '@/features/notifications/model/sms-send-history/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function shouldUseSmsSendHistoryRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** 문자 발송 조회 — SMS channel */
export async function getSmsSendHistoryList(
  searchParams: URLSearchParams,
  page = 0
): Promise<SendHistoryListPage<SmsSendHistoryRow>> {
  if (!shouldUseSmsSendHistoryRemoteApi()) return emptySendHistoryListPage(page)

  const dto = await fetchNotificationDeliveriesRemote(
    withSendHistoryPaging(smsSendHistoryParamsFromSearchParams(searchParams), page)
  )
  return toSendHistoryListPage(dto, page, mapSmsDeliveryListResponse)
}

export async function getSmsSendHistoryDetail(
  deliveryId: string
): Promise<SmsSendHistoryRow | null> {
  if (!shouldUseSmsSendHistoryRemoteApi()) return null

  const id = Number(deliveryId)
  if (!Number.isFinite(id)) return null

  const dto = await fetchNotificationDeliveryRemote(id)
  const row = mapSmsDeliveryDetailResponse(dto)
  // batchId가 있으면 배치 bodySnapshot 첨부(fileObjectId 확정본)를 사용. null이면 호출하지 않음.
  if (row?.batchId == null) return row
  let snapshots: SmsSendHistoryAttachment[]
  try {
    snapshots = await getSmsSendBatchAttachmentSnapshots(row.batchId)
  } catch {
    // 배치 조회 실패 시 상세는 deliveries preview 첨부로 표시
    return row
  }
  if (snapshots.length === 0) return row
  return {
    ...row,
    attachments: snapshots,
    attachmentFileNames: snapshots.map(item => item.fileName),
  }
}

/**
 * 발송 배치(즉시·예약)의 MMS 첨부 스냅샷 — `GET /api/admin/notification-send-batches/{batchId}`.
 */
export async function getSmsSendBatchAttachmentSnapshots(
  batchId: number
): Promise<SmsSendHistoryAttachment[]> {
  if (!shouldUseSmsSendHistoryRemoteApi() || !Number.isFinite(batchId)) return []
  return mapBatchBodySnapshotAttachments(await fetchSendBatchDetailRemote(batchId))
}
