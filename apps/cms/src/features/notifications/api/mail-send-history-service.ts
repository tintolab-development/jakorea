import {
  mapMailDeliveryDetailResponse,
  mapMailDeliveryListResponse,
} from '@/features/notifications/api/adapters/mail-delivery-adapters'
import { mailSendHistoryParamsFromSearchParams } from '@/features/notifications/api/mail-send-history-filter-params'
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
import type { MailSendHistoryRow } from '@/features/notifications/model/mail-send-history/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function shouldUseMailSendHistoryRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** 메일 발송 조회 — EMAIL channel */
export async function getMailSendHistoryList(
  searchParams: URLSearchParams,
  page = 0
): Promise<SendHistoryListPage<MailSendHistoryRow>> {
  if (!shouldUseMailSendHistoryRemoteApi()) return emptySendHistoryListPage(page)

  const dto = await fetchNotificationDeliveriesRemote(
    withSendHistoryPaging(mailSendHistoryParamsFromSearchParams(searchParams), page)
  )
  return toSendHistoryListPage(dto, page, mapMailDeliveryListResponse)
}

export async function getMailSendHistoryDetail(
  deliveryId: string
): Promise<MailSendHistoryRow | null> {
  if (!shouldUseMailSendHistoryRemoteApi()) return null

  const id = Number(deliveryId)
  if (!Number.isFinite(id)) return null

  const dto = await fetchNotificationDeliveryRemote(id)
  return mapMailDeliveryDetailResponse(dto)
}
