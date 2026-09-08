import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { DateRangeFilterValue, MailSendHistoryPendingFilters } from './types'

const DATE_PARAM_FORMAT = 'YYYY-MM-DD'

export const MAIL_SEND_HISTORY_FILTER_URL = {
  requestFrom: 'mail_req_from',
  requestTo: 'mail_req_to',
  subject: 'mail_subject',
  senderInfo: 'mail_sender',
  receiverInfo: 'mail_receiver',
  sendStatus: 'mail_send_status',
  broadcastTiming: 'mail_broadcast_timing',
  receiveStatus: 'mail_recv_status',
  sendFrom: 'mail_send_from',
  sendTo: 'mail_send_to',
  receiveFrom: 'mail_recv_from',
  receiveTo: 'mail_recv_to',
  reserveFrom: 'mail_reserve_from',
  reserveTo: 'mail_reserve_to',
} as const

/** 기획: 기본 조회 기간 금일 ~ 일주일 뒤 */
export function defaultMailSendHistoryDateRange(): [Dayjs, Dayjs] {
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
  if (!from && !to) return useDefaultWhenEmpty ? defaultMailSendHistoryDateRange() : null
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

export function readMailSendHistoryFiltersFromParams(
  searchParams: URLSearchParams
): MailSendHistoryPendingFilters {
  const hasAnyDateParam =
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.requestFrom) ||
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.requestTo) ||
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.sendFrom) ||
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.sendTo) ||
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.receiveFrom) ||
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.receiveTo) ||
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.reserveFrom) ||
    searchParams.has(MAIL_SEND_HISTORY_FILTER_URL.reserveTo)

  const useDefault = !hasAnyDateParam

  return {
    requestDateRange: parseRange(
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.requestFrom),
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.requestTo),
      useDefault
    ),
    subject: searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.subject) ?? '',
    senderInfo: searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.senderInfo) ?? '',
    receiverInfo: searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.receiverInfo) ?? '',
    sendStatus: (searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.sendStatus) ??
      '전체') as MailSendHistoryPendingFilters['sendStatus'],
    broadcastTiming: (searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.broadcastTiming) ??
      '전체') as MailSendHistoryPendingFilters['broadcastTiming'],
    receiveStatus: (searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.receiveStatus) ??
      '전체') as MailSendHistoryPendingFilters['receiveStatus'],
    sendDateRange: parseRange(
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.sendFrom),
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.sendTo),
      useDefault
    ),
    receiveDateRange: parseRange(
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.receiveFrom),
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.receiveTo),
      useDefault
    ),
    reserveDateRange: parseRange(
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.reserveFrom),
      searchParams.get(MAIL_SEND_HISTORY_FILTER_URL.reserveTo),
      useDefault
    ),
  }
}

export function applyMailSendHistoryFiltersToSearchParams(
  prev: URLSearchParams,
  filters: MailSendHistoryPendingFilters
): URLSearchParams {
  const next = new URLSearchParams(prev)
  const subject = filters.subject.trim()
  const senderInfo = filters.senderInfo.trim()
  const receiverInfo = filters.receiverInfo.trim()

  if (subject) next.set(MAIL_SEND_HISTORY_FILTER_URL.subject, subject)
  else next.delete(MAIL_SEND_HISTORY_FILTER_URL.subject)

  if (senderInfo) next.set(MAIL_SEND_HISTORY_FILTER_URL.senderInfo, senderInfo)
  else next.delete(MAIL_SEND_HISTORY_FILTER_URL.senderInfo)

  if (receiverInfo) next.set(MAIL_SEND_HISTORY_FILTER_URL.receiverInfo, receiverInfo)
  else next.delete(MAIL_SEND_HISTORY_FILTER_URL.receiverInfo)

  if (filters.sendStatus !== '전체') {
    next.set(MAIL_SEND_HISTORY_FILTER_URL.sendStatus, filters.sendStatus)
  } else {
    next.delete(MAIL_SEND_HISTORY_FILTER_URL.sendStatus)
  }

  if (filters.broadcastTiming !== '전체') {
    next.set(MAIL_SEND_HISTORY_FILTER_URL.broadcastTiming, filters.broadcastTiming)
  } else {
    next.delete(MAIL_SEND_HISTORY_FILTER_URL.broadcastTiming)
  }

  if (filters.receiveStatus !== '전체') {
    next.set(MAIL_SEND_HISTORY_FILTER_URL.receiveStatus, filters.receiveStatus)
  } else {
    next.delete(MAIL_SEND_HISTORY_FILTER_URL.receiveStatus)
  }

  setDateRangeParams(
    next,
    MAIL_SEND_HISTORY_FILTER_URL.requestFrom,
    MAIL_SEND_HISTORY_FILTER_URL.requestTo,
    filters.requestDateRange
  )
  setDateRangeParams(
    next,
    MAIL_SEND_HISTORY_FILTER_URL.sendFrom,
    MAIL_SEND_HISTORY_FILTER_URL.sendTo,
    filters.sendDateRange
  )
  setDateRangeParams(
    next,
    MAIL_SEND_HISTORY_FILTER_URL.receiveFrom,
    MAIL_SEND_HISTORY_FILTER_URL.receiveTo,
    filters.receiveDateRange
  )
  setDateRangeParams(
    next,
    MAIL_SEND_HISTORY_FILTER_URL.reserveFrom,
    MAIL_SEND_HISTORY_FILTER_URL.reserveTo,
    filters.reserveDateRange
  )

  return next
}
