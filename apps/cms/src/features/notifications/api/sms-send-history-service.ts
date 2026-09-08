import {
  mapSmsDeliveryDetailResponse,
  mapSmsDeliveryListResponse,
} from '@/features/notifications/api/adapters/sms-delivery-adapters'
import { smsSendHistoryParamsFromSearchParams } from '@/features/notifications/api/sms-send-history-filter-params'
import {
  fetchNotificationDeliveriesRemote,
  fetchNotificationDeliveryRemote,
} from '@/features/notifications/api/notifications-api-client'
import { filterSmsSendHistoryRows } from '@/features/notifications/model/sms-send-history/mock'
import { readSmsSendHistoryFiltersFromParams } from '@/features/notifications/model/sms-send-history/filter-url'
import { getSmsSendHistoryMockRows } from '@/features/notifications/model/sms-send-history/session-store'
import type { SmsSendHistoryRow } from '@/features/notifications/model/sms-send-history/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function shouldUseSmsSendHistoryRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** 문자 발송 조회 — SMS channel. 미지원/실패 시 mock 폴백 */
export async function getSmsSendHistoryList(
  searchParams: URLSearchParams
): Promise<SmsSendHistoryRow[]> {
  const filters = readSmsSendHistoryFiltersFromParams(searchParams)

  if (!shouldUseSmsSendHistoryRemoteApi()) {
    return filterSmsSendHistoryRows(getSmsSendHistoryMockRows(), filters)
  }

  try {
    const dto = await fetchNotificationDeliveriesRemote(
      smsSendHistoryParamsFromSearchParams(searchParams)
    )
    return mapSmsDeliveryListResponse(dto.items)
  } catch {
    return filterSmsSendHistoryRows(getSmsSendHistoryMockRows(), filters)
  }
}

export async function getSmsSendHistoryDetail(
  deliveryId: string
): Promise<SmsSendHistoryRow | null> {
  if (!shouldUseSmsSendHistoryRemoteApi()) {
    return getSmsSendHistoryMockRows().find(row => row.id === deliveryId) ?? null
  }

  const id = Number(deliveryId)
  if (!Number.isFinite(id)) {
    return getSmsSendHistoryMockRows().find(row => row.id === deliveryId) ?? null
  }

  try {
    const dto = await fetchNotificationDeliveryRemote(id)
    return mapSmsDeliveryDetailResponse(dto)
  } catch {
    return getSmsSendHistoryMockRows().find(row => row.id === deliveryId) ?? null
  }
}
