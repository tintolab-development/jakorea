import { mapDeliveryDetailResponse, mapDeliveryListResponse } from '@/features/notifications/api/adapters/alimtalk-delivery-adapters'
import { alimtalkSendHistoryParamsFromSearchParams } from '@/features/notifications/api/alimtalk-send-history-filter-params'
import {
  emptySendHistoryListPage,
  toSendHistoryListPage,
  withSendHistoryPaging,
  type SendHistoryListPage,
} from '@/features/notifications/api/delivery-list-page'
import {
  fetchNotificationDeliveriesRemote,
  fetchNotificationDeliveryRemote,
} from '@/features/notifications/api/notifications-api-client'
import type { AlimtalkSendHistoryRow } from '@/features/notifications/model/alimtalk-send-history/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function shouldUseAlimtalkSendHistoryRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** 알림톡 발송 조회 */
export async function getAlimtalkSendHistoryList(
  searchParams: URLSearchParams,
  page = 0
): Promise<SendHistoryListPage<AlimtalkSendHistoryRow>> {
  if (!shouldUseAlimtalkSendHistoryRemoteApi()) return emptySendHistoryListPage(page)

  const dto = await fetchNotificationDeliveriesRemote(
    withSendHistoryPaging(alimtalkSendHistoryParamsFromSearchParams(searchParams), page)
  )
  return toSendHistoryListPage(dto, page, mapDeliveryListResponse)
}

export async function getAlimtalkSendHistoryDetail(
  deliveryId: string
): Promise<AlimtalkSendHistoryRow | null> {
  if (!shouldUseAlimtalkSendHistoryRemoteApi()) return null
  const id = Number(deliveryId)
  if (!Number.isFinite(id)) return null
  const dto = await fetchNotificationDeliveryRemote(id)
  return mapDeliveryDetailResponse(dto)
}
