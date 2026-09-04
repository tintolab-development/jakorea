import dayjs from 'dayjs'
import { mapDeliveryDetailResponse, mapDeliveryListResponse } from '@/features/notifications/api/adapters/alimtalk-delivery-adapters'
import { alimtalkSendHistoryParamsFromSearchParams } from '@/features/notifications/api/alimtalk-send-history-filter-params'
import {
  fetchNotificationDeliveriesRemote,
  fetchNotificationDeliveryRemote,
} from '@/features/notifications/api/notifications-api-client'
import { ALIMTALK_SEND_HISTORY_MOCK } from '@/features/notifications/model/alimtalk-send-history/mock'
import { readSendHistoryFiltersFromParams } from '@/features/notifications/model/alimtalk-send-history/filter-url'
import type {
  AlimtalkSendHistoryPendingFilters,
  AlimtalkSendHistoryRow,
  DateRangeFilterValue,
} from '@/features/notifications/model/alimtalk-send-history/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function includesText(target: string, query: string): boolean {
  return target.toLowerCase().includes(query.trim().toLowerCase())
}

function isWithinRange(value: string, range: DateRangeFilterValue): boolean {
  if (!range || !range[0] || !range[1]) return true
  if (!value) return true
  const date = dayjs(value)
  if (!date.isValid()) return false
  const start = range[0].startOf('day')
  const end = range[1].endOf('day')
  return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end))
}

function filterRows(rows: AlimtalkSendHistoryRow[], filters: AlimtalkSendHistoryPendingFilters) {
  return rows.filter(row => {
    if (!isWithinRange(row.requestAt, filters.requestDateRange)) return false
    if (!isWithinRange(row.sendRequestedAt, filters.sendDateRange)) return false
    if (!isWithinRange(row.receiveRequestedAt, filters.receiveDateRange)) return false
    if (!isWithinRange(row.reservedAt, filters.reserveDateRange)) return false
    if (filters.sendStatus !== '전체' && row.sendStatus !== filters.sendStatus) return false
    if (filters.receiveStatus !== '전체' && row.receiveStatus !== filters.receiveStatus) return false
    if (filters.broadcastTiming !== '전체' && row.broadcastTiming !== filters.broadcastTiming) {
      return false
    }
    if (filters.templateName.trim() && !includesText(row.templateName, filters.templateName)) {
      return false
    }
    if (filters.senderInfo.trim() && !includesText(row.senderInfo, filters.senderInfo)) return false
    if (filters.receiverInfo.trim() && !includesText(row.receiverInfo, filters.receiverInfo)) {
      return false
    }
    return true
  })
}

export function shouldUseAlimtalkSendHistoryRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** 알림톡 발송 조회 */
export async function getAlimtalkSendHistoryList(
  searchParams: URLSearchParams
): Promise<AlimtalkSendHistoryRow[]> {
  const filters = readSendHistoryFiltersFromParams(searchParams)

  if (!shouldUseAlimtalkSendHistoryRemoteApi()) {
    await new Promise(resolve => setTimeout(resolve, 120))
    return filterRows(ALIMTALK_SEND_HISTORY_MOCK, filters)
  }

  const dto = await fetchNotificationDeliveriesRemote(
    alimtalkSendHistoryParamsFromSearchParams(searchParams)
  )
  return mapDeliveryListResponse(dto.items)
}

export async function getAlimtalkSendHistoryDetail(
  deliveryId: string
): Promise<AlimtalkSendHistoryRow | null> {
  if (!shouldUseAlimtalkSendHistoryRemoteApi()) {
    return ALIMTALK_SEND_HISTORY_MOCK.find(row => row.id === deliveryId) ?? null
  }
  const id = Number(deliveryId)
  if (!Number.isFinite(id)) return null
  const dto = await fetchNotificationDeliveryRemote(id)
  return mapDeliveryDetailResponse(dto)
}
