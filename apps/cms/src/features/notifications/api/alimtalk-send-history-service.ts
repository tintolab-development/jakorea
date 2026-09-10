import { mapDeliveryDetailResponse, mapDeliveryListResponse } from '@/features/notifications/api/adapters/alimtalk-delivery-adapters'
import { alimtalkSendHistoryParamsFromSearchParams } from '@/features/notifications/api/alimtalk-send-history-filter-params'
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
  searchParams: URLSearchParams
): Promise<AlimtalkSendHistoryRow[]> {
  if (!shouldUseAlimtalkSendHistoryRemoteApi()) return []

  const dto = await fetchNotificationDeliveriesRemote(
    alimtalkSendHistoryParamsFromSearchParams(searchParams)
  )
  return mapDeliveryListResponse(dto.items)
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
