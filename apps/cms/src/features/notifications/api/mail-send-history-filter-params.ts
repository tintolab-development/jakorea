import dayjs from 'dayjs'
import { MAIL_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/mail-channel'
import { readMailSendHistoryFiltersFromParams } from '@/features/notifications/model/mail-send-history/filter-url'
import type {
  DateRangeFilterValue,
  MailSendHistoryPendingFilters,
} from '@/features/notifications/model/mail-send-history/types'
import { applyNotificationStatusFilterParams } from '@/features/notifications/model/shared/delivery-status'

const DATE_PARAM_FORMAT = 'YYYY-MM-DD'

function rangeToParams(
  params: Record<string, string>,
  fromKey: string,
  toKey: string,
  range: DateRangeFilterValue
) {
  if (!range) return
  if (range[0]?.isValid()) params[fromKey] = range[0].format(DATE_PARAM_FORMAT)
  if (range[1]?.isValid()) params[toKey] = range[1].format(DATE_PARAM_FORMAT)
}


export function mailSendHistoryParamsFromFilters(
  filters: MailSendHistoryPendingFilters
): Record<string, string> {
  const params: Record<string, string> = {
    channelType: MAIL_API_CHANNEL_TYPE,
  }

  rangeToParams(params, 'requestedFrom', 'requestedTo', filters.requestDateRange)
  rangeToParams(params, 'sentFrom', 'sentTo', filters.sendDateRange)
  rangeToParams(params, 'deliveredFrom', 'deliveredTo', filters.receiveDateRange)
  rangeToParams(params, 'scheduledFrom', 'scheduledTo', filters.reserveDateRange)

  if (filters.subject.trim()) {
    // BE 2026-09-10: title|subject|renderedTitle (메일 제목 ILIKE). templateName 위장 금지.
    const q = filters.subject.trim()
    params.title = q
    params.subject = q
    params.renderedTitle = q
  }
  if (filters.senderInfo.trim()) {
    params.sender = filters.senderInfo.trim()
    params.senderInfo = filters.senderInfo.trim()
  }
  if (filters.receiverInfo.trim()) {
    params.recipient = filters.receiverInfo.trim()
    params.recipientInfo = filters.receiverInfo.trim()
  }
  applyNotificationStatusFilterParams(params, filters)

  if (!params.requestedFrom || !params.requestedTo) {
    const start = dayjs().startOf('day')
    params.requestedFrom = params.requestedFrom ?? start.format(DATE_PARAM_FORMAT)
    params.requestedTo =
      params.requestedTo ?? start.add(7, 'day').format(DATE_PARAM_FORMAT)
  }

  return params
}

export function mailSendHistoryParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  return mailSendHistoryParamsFromFilters(readMailSendHistoryFiltersFromParams(searchParams))
}
