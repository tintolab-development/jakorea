import type { Dayjs } from 'dayjs'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'
import {
  NOTIFICATION_RECEIVE_STATUS_OPTIONS,
  NOTIFICATION_SEND_STATUS_OPTIONS,
} from '@/features/notifications/model/shared/delivery-status'

/** 세 채널 공통 정본 — `model/shared/delivery-status.ts` */
export const ALIMTALK_SEND_STATUS_OPTIONS = NOTIFICATION_SEND_STATUS_OPTIONS

/** 세 채널 공통 정본 — `model/shared/delivery-status.ts` */
export const ALIMTALK_RECEIVE_STATUS_OPTIONS = NOTIFICATION_RECEIVE_STATUS_OPTIONS

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
  receiverName: string
  receiverPhone: string
  /** 목록 표시용: 이름 또는 번호 (검색 호환) */
  receiverInfo: string
  broadcastTiming: Exclude<AlimtalkBroadcastTiming, '전체'>
  sendStatus: Exclude<AlimtalkSendStatus, '전체'>
  receiveStatus: Exclude<AlimtalkReceiveStatus, '전체'>
  sentAt: string
  receivedAt: string
  sendCount: string
  sendNumber: string
  message: string
  /** sendStatus=발송 실패일 때 failedReason 보조 문구 */
  failedReason?: string
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
