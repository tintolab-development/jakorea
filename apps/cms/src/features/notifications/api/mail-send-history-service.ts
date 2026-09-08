import {
  mapMailDeliveryDetailResponse,
  mapMailDeliveryListResponse,
} from '@/features/notifications/api/adapters/mail-delivery-adapters'
import { mailSendHistoryParamsFromSearchParams } from '@/features/notifications/api/mail-send-history-filter-params'
import {
  fetchNotificationDeliveriesRemote,
  fetchNotificationDeliveryRemote,
} from '@/features/notifications/api/notifications-api-client'
import { filterMailSendHistoryRows } from '@/features/notifications/model/mail-send-history/mock'
import { readMailSendHistoryFiltersFromParams } from '@/features/notifications/model/mail-send-history/filter-url'
import {
  getMailSendHistoryMockRows,
} from '@/features/notifications/model/mail-send-history/session-store'
import type { MailSendHistoryRow } from '@/features/notifications/model/mail-send-history/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function shouldUseMailSendHistoryRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** 메일 발송 조회 — EMAIL channel. 미지원/실패 시 mock 폴백 */
export async function getMailSendHistoryList(
  searchParams: URLSearchParams
): Promise<MailSendHistoryRow[]> {
  const filters = readMailSendHistoryFiltersFromParams(searchParams)

  if (!shouldUseMailSendHistoryRemoteApi()) {
    return filterMailSendHistoryRows(getMailSendHistoryMockRows(), filters)
  }

  try {
    const dto = await fetchNotificationDeliveriesRemote(
      mailSendHistoryParamsFromSearchParams(searchParams)
    )
    return mapMailDeliveryListResponse(dto.items)
  } catch {
    return filterMailSendHistoryRows(getMailSendHistoryMockRows(), filters)
  }
}

export async function getMailSendHistoryDetail(
  deliveryId: string
): Promise<MailSendHistoryRow | null> {
  if (!shouldUseMailSendHistoryRemoteApi()) {
    return getMailSendHistoryMockRows().find(row => row.id === deliveryId) ?? null
  }

  const id = Number(deliveryId)
  if (!Number.isFinite(id)) {
    return getMailSendHistoryMockRows().find(row => row.id === deliveryId) ?? null
  }

  try {
    const dto = await fetchNotificationDeliveryRemote(id)
    return mapMailDeliveryDetailResponse(dto)
  } catch {
    return getMailSendHistoryMockRows().find(row => row.id === deliveryId) ?? null
  }
}
