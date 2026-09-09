import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { DateRangeFilterValue, SmsSendHistoryPendingFilters } from './types'

const DATE_PARAM_FORMAT = 'YYYY-MM-DD'

export const SMS_SEND_HISTORY_FILTER_URL = {
  requestFrom: 'sms_req_from',
  requestTo: 'sms_req_to',
  content: 'sms_content',
  senderInfo: 'sms_sender',
  receiverInfo: 'sms_receiver',
  sendStatus: 'sms_send_status',
  broadcastTiming: 'sms_broadcast_timing',
  receiveStatus: 'sms_recv_status',
  sendFrom: 'sms_send_from',
  sendTo: 'sms_send_to',
  receiveFrom: 'sms_recv_from',
  receiveTo: 'sms_recv_to',
  reserveFrom: 'sms_reserve_from',
  reserveTo: 'sms_reserve_to',
} as const

/** 기획: 기본 조회 기간 금일 ~ 일주일 뒤 */
export function defaultSmsSendHistoryDateRange(): [Dayjs, Dayjs] {
  const start = dayjs().startOf('day')
  return [start, start.add(7, 'day')]
}

function parseDate(raw: string | null): Dayjs | null {
  if (!raw) return null
  const parsed = dayjs(raw)
  return parsed.isValid() ? parsed : null
}

function parseRange(
  fromRaw: string | null,
  toRaw: string | null,
  useDefaultWhenEmpty: boolean
): DateRangeFilterValue {
  const from = parseDate(fromRaw)
  const to = parseDate(toRaw)
  if (!from && !to) return useDefaultWhenEmpty ? defaultSmsSendHistoryDateRange() : null
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

export function readSmsSendHistoryFiltersFromParams(
  searchParams: URLSearchParams
): SmsSendHistoryPendingFilters {
  const hasRequestDateParam =
    searchParams.has(SMS_SEND_HISTORY_FILTER_URL.requestFrom) ||
    searchParams.has(SMS_SEND_HISTORY_FILTER_URL.requestTo)

  return {
    requestDateRange: parseRange(
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.requestFrom),
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.requestTo),
      !hasRequestDateParam
    ),
    content: searchParams.get(SMS_SEND_HISTORY_FILTER_URL.content) ?? '',
    senderInfo: searchParams.get(SMS_SEND_HISTORY_FILTER_URL.senderInfo) ?? '',
    receiverInfo: searchParams.get(SMS_SEND_HISTORY_FILTER_URL.receiverInfo) ?? '',
    sendStatus: (searchParams.get(SMS_SEND_HISTORY_FILTER_URL.sendStatus) ??
      '전체') as SmsSendHistoryPendingFilters['sendStatus'],
    broadcastTiming: (searchParams.get(SMS_SEND_HISTORY_FILTER_URL.broadcastTiming) ??
      '전체') as SmsSendHistoryPendingFilters['broadcastTiming'],
    receiveStatus: (searchParams.get(SMS_SEND_HISTORY_FILTER_URL.receiveStatus) ??
      '전체') as SmsSendHistoryPendingFilters['receiveStatus'],
    sendDateRange: parseRange(
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.sendFrom),
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.sendTo),
      false
    ),
    receiveDateRange: parseRange(
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.receiveFrom),
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.receiveTo),
      false
    ),
    reserveDateRange: parseRange(
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.reserveFrom),
      searchParams.get(SMS_SEND_HISTORY_FILTER_URL.reserveTo),
      false
    ),
  }
}

export function applySmsSendHistoryFiltersToSearchParams(
  prev: URLSearchParams,
  filters: SmsSendHistoryPendingFilters
): URLSearchParams {
  const next = new URLSearchParams(prev)
  const content = filters.content.trim()
  const senderInfo = filters.senderInfo.trim()
  const receiverInfo = filters.receiverInfo.trim()

  if (content) next.set(SMS_SEND_HISTORY_FILTER_URL.content, content)
  else next.delete(SMS_SEND_HISTORY_FILTER_URL.content)

  if (senderInfo) next.set(SMS_SEND_HISTORY_FILTER_URL.senderInfo, senderInfo)
  else next.delete(SMS_SEND_HISTORY_FILTER_URL.senderInfo)

  if (receiverInfo) next.set(SMS_SEND_HISTORY_FILTER_URL.receiverInfo, receiverInfo)
  else next.delete(SMS_SEND_HISTORY_FILTER_URL.receiverInfo)

  if (filters.sendStatus !== '전체') {
    next.set(SMS_SEND_HISTORY_FILTER_URL.sendStatus, filters.sendStatus)
  } else {
    next.delete(SMS_SEND_HISTORY_FILTER_URL.sendStatus)
  }

  if (filters.broadcastTiming !== '전체') {
    next.set(SMS_SEND_HISTORY_FILTER_URL.broadcastTiming, filters.broadcastTiming)
  } else {
    next.delete(SMS_SEND_HISTORY_FILTER_URL.broadcastTiming)
  }

  if (filters.receiveStatus !== '전체') {
    next.set(SMS_SEND_HISTORY_FILTER_URL.receiveStatus, filters.receiveStatus)
  } else {
    next.delete(SMS_SEND_HISTORY_FILTER_URL.receiveStatus)
  }

  setDateRangeParams(
    next,
    SMS_SEND_HISTORY_FILTER_URL.requestFrom,
    SMS_SEND_HISTORY_FILTER_URL.requestTo,
    filters.requestDateRange
  )
  setDateRangeParams(
    next,
    SMS_SEND_HISTORY_FILTER_URL.sendFrom,
    SMS_SEND_HISTORY_FILTER_URL.sendTo,
    filters.sendDateRange
  )
  setDateRangeParams(
    next,
    SMS_SEND_HISTORY_FILTER_URL.receiveFrom,
    SMS_SEND_HISTORY_FILTER_URL.receiveTo,
    filters.receiveDateRange
  )
  setDateRangeParams(
    next,
    SMS_SEND_HISTORY_FILTER_URL.reserveFrom,
    SMS_SEND_HISTORY_FILTER_URL.reserveTo,
    filters.reserveDateRange
  )

  return next
}
