import {
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
} from '@/features/notifications/api/notifications-api-client'
import type { SmsSendHistoryRow } from '@/features/notifications/model/sms-send-history/types'
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
  return mapSmsDeliveryDetailResponse(dto)
}
