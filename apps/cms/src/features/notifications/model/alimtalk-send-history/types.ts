import type { Dayjs } from 'dayjs'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'

export const ALIMTALK_SEND_STATUS_OPTIONS = [
  '전체',
  '발송 요청',
  '발송 취소',
  '발송 예약',
  '발송 대기',
  '발송 중',
  '발송 실패',
  '발송 성공',
] as const

export const ALIMTALK_RECEIVE_STATUS_OPTIONS = [
  '전체',
  '요청됨',
  '확인 대기중',
  '대기중',
  '예약됨',
  '발송 중',
  '발송 성공',
  '발송 실패',
  '수신 성공',
  '수신 실패',
  '취소됨',
] as const

export const ALIMTALK_BROADCAST_TIMING_OPTIONS = ['전체', '즉시', '예약'] as const

export type AlimtalkSendStatus = (typeof ALIMTALK_SEND_STATUS_OPTIONS)[number]
export type AlimtalkReceiveStatus = (typeof ALIMTALK_RECEIVE_STATUS_OPTIONS)[number]
export type AlimtalkBroadcastTiming = (typeof ALIMTALK_BROADCAST_TIMING_OPTIONS)[number]

export type AlimtalkSendHistoryRow = {
  id: string
  requestAt: string
  sendRequestedAt: string
  receiveRequestedAt: string
  reservedAt: string
  templateName: string
  senderInfo: string
  receiverInfo: string
  broadcastTiming: Exclude<AlimtalkBroadcastTiming, '전체'>
  sendStatus: Exclude<AlimtalkSendStatus, '전체'>
  receiveStatus: Exclude<AlimtalkReceiveStatus, '전체'>
  sentAt: string
  receivedAt: string
  sendCount: string
  sendNumber: string
  message: string
  phoneTemplate: AlimtalkTemplateItem
}

export type DateRangeFilterValue = [Dayjs | null, Dayjs | null] | null

export type AlimtalkSendHistoryPendingFilters = {
  requestDateRange: DateRangeFilterValue
  templateName: string
  senderInfo: string
  receiverInfo: string
  sendStatus: AlimtalkSendStatus
  broadcastTiming: AlimtalkBroadcastTiming
  receiveStatus: AlimtalkReceiveStatus
  sendDateRange: DateRangeFilterValue
  receiveDateRange: DateRangeFilterValue
  reserveDateRange: DateRangeFilterValue
}
