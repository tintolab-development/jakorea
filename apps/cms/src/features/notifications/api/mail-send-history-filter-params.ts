import dayjs from 'dayjs'
import { MAIL_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/mail-channel'
import { readMailSendHistoryFiltersFromParams } from '@/features/notifications/model/mail-send-history/filter-url'
import type {
  DateRangeFilterValue,
  MailSendHistoryPendingFilters,
} from '@/features/notifications/model/mail-send-history/types'

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

const SEND_STATUS_TO_API: Record<string, string> = {
  '발송 요청': 'REQUESTED',
  예약: 'SCHEDULED',
  대기: 'WAITED',
  발송중: 'IN_PROGRESS',
  '발송 실패': 'SEND_FAILED',
  '발송 성공': 'SENT',
  취소: 'CANCELED',
  확인불가: 'UNKNOWN',
}

const RECEIVE_STATUS_TO_API: Record<string, string> = {
  요청됨: 'REQUESTED',
  '확인 대기중': 'CONFIRM_WAITED',
  대기중: 'WAITED',
  예약됨: 'SCHEDULED',
  '수신 성공': 'DELIVERED',
  '수신 실패': 'DELIVERY_FAILED',
  취소됨: 'CANCELED',
  확인불가: 'UNKNOWN',
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
    // BE: template_code_snapshot 기준 검색 (메일 제목 ILIKE 아님)
    params.templateName = filters.subject.trim()
    params.templateCode = filters.subject.trim()
  }
  if (filters.senderInfo.trim()) {
    params.sender = filters.senderInfo.trim()
    params.senderInfo = filters.senderInfo.trim()
  }
  if (filters.receiverInfo.trim()) {
    params.recipient = filters.receiverInfo.trim()
    params.recipientInfo = filters.receiverInfo.trim()
  }
  if (filters.sendStatus !== '전체') {
    params.sendStatus = SEND_STATUS_TO_API[filters.sendStatus] ?? filters.sendStatus
  }
  if (filters.receiveStatus !== '전체') {
    params.receiptStatus =
      RECEIVE_STATUS_TO_API[filters.receiveStatus] ?? filters.receiveStatus
  }
  if (filters.broadcastTiming === '즉시') params.sendTiming = 'IMMEDIATE'
  if (filters.broadcastTiming === '예약') params.sendTiming = 'SCHEDULED'

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
