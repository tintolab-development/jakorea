import dayjs from 'dayjs'
import { ALIMTALK_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { readSendHistoryFiltersFromParams } from '@/features/notifications/model/alimtalk-send-history/filter-url'
import type { AlimtalkSendHistoryPendingFilters } from '@/features/notifications/model/alimtalk-send-history/types'
import type { DateRangeFilterValue } from '@/features/notifications/model/alimtalk-send-history/types'

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
  '발송 취소': 'CANCELLED',
  '발송 예약': 'SCHEDULED',
  '발송 대기': 'PENDING',
  '발송 중': 'SENDING',
  '발송 실패': 'FAILED',
  '발송 성공': 'SUCCESS',
}

const RECEIVE_STATUS_TO_API: Record<string, string> = {
  요청됨: 'REQUESTED',
  '확인 대기중': 'WAITING_CONFIRM',
  대기중: 'PENDING',
  예약됨: 'SCHEDULED',
  '수신 성공': 'SUCCESS',
  '수신 실패': 'FAILED',
  취소됨: 'CANCELLED',
}

export function alimtalkSendHistoryParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const filters = readSendHistoryFiltersFromParams(searchParams)
  return alimtalkSendHistoryParamsFromFilters(filters)
}

export function alimtalkSendHistoryParamsFromFilters(
  filters: AlimtalkSendHistoryPendingFilters
): Record<string, string> {
  const params: Record<string, string> = {
    channelType: ALIMTALK_API_CHANNEL_TYPE,
  }

  rangeToParams(params, 'requestedFrom', 'requestedTo', filters.requestDateRange)
  rangeToParams(params, 'sentFrom', 'sentTo', filters.sendDateRange)
  rangeToParams(params, 'deliveredFrom', 'deliveredTo', filters.receiveDateRange)
  rangeToParams(params, 'scheduledFrom', 'scheduledTo', filters.reserveDateRange)

  if (filters.templateName.trim()) params.templateName = filters.templateName.trim()
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

  // Ensure default request window always present when empty (defensive)
  if (!params.requestedFrom || !params.requestedTo) {
    const start = dayjs().startOf('day')
    params.requestedFrom = params.requestedFrom ?? start.format(DATE_PARAM_FORMAT)
    params.requestedTo =
      params.requestedTo ?? start.add(7, 'day').format(DATE_PARAM_FORMAT)
  }

  return params
}
