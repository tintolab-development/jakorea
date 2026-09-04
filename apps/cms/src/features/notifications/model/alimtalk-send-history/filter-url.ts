import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { AlimtalkSendHistoryPendingFilters, DateRangeFilterValue } from './types'

const DATE_PARAM_FORMAT = 'YYYY-MM-DD'

export const SEND_HISTORY_FILTER_URL = {
  requestFrom: 'req_from',
  requestTo: 'req_to',
  templateName: 'template_name',
  senderInfo: 'sender',
  receiverInfo: 'receiver',
  sendStatus: 'send_status',
  broadcastTiming: 'broadcast_timing',
  receiveStatus: 'recv_status',
  sendFrom: 'send_from',
  sendTo: 'send_to',
  receiveFrom: 'recv_from',
  receiveTo: 'recv_to',
  reserveFrom: 'reserve_from',
  reserveTo: 'reserve_to',
} as const

/** 기획: 기본 조회 기간 금일 ~ 일주일 뒤 */
export function defaultSendHistoryDateRange(): [Dayjs, Dayjs] {
  const start = dayjs().startOf('day')
  return [start, start.add(7, 'day')]
}

function parseDate(raw: string | null): Dayjs | null {
  if (!raw) return null
  const parsed = dayjs(raw)
  return parsed.isValid() ? parsed : null
}

/** URL에 날짜가 없으면 기본 기간(금일~+7일). 한쪽만 있으면 해당 값만 유지. */
function parseRange(
  fromRaw: string | null,
  toRaw: string | null,
  useDefaultWhenEmpty: boolean
): DateRangeFilterValue {
  const from = parseDate(fromRaw)
  const to = parseDate(toRaw)
  if (!from && !to) return useDefaultWhenEmpty ? defaultSendHistoryDateRange() : null
  return [from, to]
}

function setDateRangeParams(
  next: URLSearchParams,
  fromKey: string,
  toKey: string,
  range: DateRangeFilterValue
) {
  if (!range || (!range[0] && !range[1])) {
    next.delete(fromKey)
    next.delete(toKey)
    return
  }
  if (range[0]) next.set(fromKey, range[0].format(DATE_PARAM_FORMAT))
  else next.delete(fromKey)
  if (range[1]) next.set(toKey, range[1].format(DATE_PARAM_FORMAT))
  else next.delete(toKey)
}

export function readSendHistoryFiltersFromParams(
  searchParams: URLSearchParams
): AlimtalkSendHistoryPendingFilters {
  const hasAnyDateParam =
    searchParams.has(SEND_HISTORY_FILTER_URL.requestFrom) ||
    searchParams.has(SEND_HISTORY_FILTER_URL.requestTo) ||
    searchParams.has(SEND_HISTORY_FILTER_URL.sendFrom) ||
    searchParams.has(SEND_HISTORY_FILTER_URL.sendTo) ||
    searchParams.has(SEND_HISTORY_FILTER_URL.receiveFrom) ||
    searchParams.has(SEND_HISTORY_FILTER_URL.receiveTo) ||
    searchParams.has(SEND_HISTORY_FILTER_URL.reserveFrom) ||
    searchParams.has(SEND_HISTORY_FILTER_URL.reserveTo)

  const useDefault = !hasAnyDateParam

  return {
    requestDateRange: parseRange(
      searchParams.get(SEND_HISTORY_FILTER_URL.requestFrom),
      searchParams.get(SEND_HISTORY_FILTER_URL.requestTo),
      useDefault
    ),
    templateName: searchParams.get(SEND_HISTORY_FILTER_URL.templateName) ?? '',
    senderInfo: searchParams.get(SEND_HISTORY_FILTER_URL.senderInfo) ?? '',
    receiverInfo: searchParams.get(SEND_HISTORY_FILTER_URL.receiverInfo) ?? '',
    sendStatus: (searchParams.get(SEND_HISTORY_FILTER_URL.sendStatus) ?? '전체') as
      AlimtalkSendHistoryPendingFilters['sendStatus'],
    broadcastTiming: (searchParams.get(SEND_HISTORY_FILTER_URL.broadcastTiming) ?? '전체') as
      AlimtalkSendHistoryPendingFilters['broadcastTiming'],
    receiveStatus: (searchParams.get(SEND_HISTORY_FILTER_URL.receiveStatus) ?? '전체') as
      AlimtalkSendHistoryPendingFilters['receiveStatus'],
    sendDateRange: parseRange(
      searchParams.get(SEND_HISTORY_FILTER_URL.sendFrom),
      searchParams.get(SEND_HISTORY_FILTER_URL.sendTo),
      useDefault
    ),
    receiveDateRange: parseRange(
      searchParams.get(SEND_HISTORY_FILTER_URL.receiveFrom),
      searchParams.get(SEND_HISTORY_FILTER_URL.receiveTo),
      useDefault
    ),
    reserveDateRange: parseRange(
      searchParams.get(SEND_HISTORY_FILTER_URL.reserveFrom),
      searchParams.get(SEND_HISTORY_FILTER_URL.reserveTo),
      useDefault
    ),
  }
}

export function applySendHistoryFiltersToSearchParams(
  prev: URLSearchParams,
  filters: AlimtalkSendHistoryPendingFilters
): URLSearchParams {
  const next = new URLSearchParams(prev)
  const templateName = filters.templateName.trim()
  const senderInfo = filters.senderInfo.trim()
  const receiverInfo = filters.receiverInfo.trim()

  if (templateName) next.set(SEND_HISTORY_FILTER_URL.templateName, templateName)
  else next.delete(SEND_HISTORY_FILTER_URL.templateName)

  if (senderInfo) next.set(SEND_HISTORY_FILTER_URL.senderInfo, senderInfo)
  else next.delete(SEND_HISTORY_FILTER_URL.senderInfo)

  if (receiverInfo) next.set(SEND_HISTORY_FILTER_URL.receiverInfo, receiverInfo)
  else next.delete(SEND_HISTORY_FILTER_URL.receiverInfo)

  if (filters.sendStatus !== '전체') next.set(SEND_HISTORY_FILTER_URL.sendStatus, filters.sendStatus)
  else next.delete(SEND_HISTORY_FILTER_URL.sendStatus)

  if (filters.broadcastTiming !== '전체') {
    next.set(SEND_HISTORY_FILTER_URL.broadcastTiming, filters.broadcastTiming)
  } else {
    next.delete(SEND_HISTORY_FILTER_URL.broadcastTiming)
  }

  if (filters.receiveStatus !== '전체') {
    next.set(SEND_HISTORY_FILTER_URL.receiveStatus, filters.receiveStatus)
  } else {
    next.delete(SEND_HISTORY_FILTER_URL.receiveStatus)
  }

  setDateRangeParams(
    next,
    SEND_HISTORY_FILTER_URL.requestFrom,
    SEND_HISTORY_FILTER_URL.requestTo,
    filters.requestDateRange
  )
  setDateRangeParams(
    next,
    SEND_HISTORY_FILTER_URL.sendFrom,
    SEND_HISTORY_FILTER_URL.sendTo,
    filters.sendDateRange
  )
  setDateRangeParams(
    next,
    SEND_HISTORY_FILTER_URL.receiveFrom,
    SEND_HISTORY_FILTER_URL.receiveTo,
    filters.receiveDateRange
  )
  setDateRangeParams(
    next,
    SEND_HISTORY_FILTER_URL.reserveFrom,
    SEND_HISTORY_FILTER_URL.reserveTo,
    filters.reserveDateRange
  )

  return next
}
