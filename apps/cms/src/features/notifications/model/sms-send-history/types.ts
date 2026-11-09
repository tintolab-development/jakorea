import type { Dayjs } from 'dayjs'
import type {
  SmsMessageType,
  SmsSenderNumberType,
} from '@/features/notifications/api/adapters/sms-channel'
import {
  NOTIFICATION_RECEIVE_STATUS_OPTIONS,
  NOTIFICATION_SEND_STATUS_OPTIONS,
} from '@/features/notifications/model/shared/delivery-status'

/** 세 채널 공통 정본 — `model/shared/delivery-status.ts` */
export const SMS_SEND_STATUS_OPTIONS = NOTIFICATION_SEND_STATUS_OPTIONS

/** 세 채널 공통 정본 — `model/shared/delivery-status.ts` */
export const SMS_RECEIVE_STATUS_OPTIONS = NOTIFICATION_RECEIVE_STATUS_OPTIONS

export const SMS_BROADCAST_TIMING_OPTIONS = ['전체', '즉시', '예약'] as const

export type SmsSendStatus = (typeof SMS_SEND_STATUS_OPTIONS)[number]
export type SmsReceiveStatus = (typeof SMS_RECEIVE_STATUS_OPTIONS)[number]
export type SmsBroadcastTiming = (typeof SMS_BROADCAST_TIMING_OPTIONS)[number]

export type SmsSendHistoryAttachment = {
  fileName: string
  fileObjectId?: number
  downloadHint?: string
  byteSize?: number
}

export type SmsSendHistoryRow = {
  id: string
  requestAt: string
  reservedAt: string
  /** 목록용 문자 내용 요약 */
  content: string
  subject: string
  senderNumberType: SmsSenderNumberType | ''
  senderPhone: string
  /** 목록·필터용 발신자 표시 */
  senderInfo: string
  receiverPhone: string
  receiverInfo: string
  broadcastTiming: Exclude<SmsBroadcastTiming, '전체'>
  sendStatus: Exclude<SmsSendStatus, '전체'>
  receiveStatus: Exclude<SmsReceiveStatus, '전체'>
  sentAt: string
  receivedAt: string
  templateName: string
  messageType: SmsMessageType
  bodyText: string
  failedReason?: string
  attachmentFileNames: string[]
  attachments?: SmsSendHistoryAttachment[]
  /** CMS 실발송 배치 id (자동 알림 등 배치 없으면 null) */
  batchId?: number | null
}

export type DateRangeFilterValue = [Dayjs | null, Dayjs | null] | null

export type SmsSendHistoryPendingFilters = {
  requestDateRange: DateRangeFilterValue
  content: string
  senderInfo: string
  receiverInfo: string
  sendStatus: SmsSendStatus
  broadcastTiming: SmsBroadcastTiming
  receiveStatus: SmsReceiveStatus
  sendDateRange: DateRangeFilterValue
  receiveDateRange: DateRangeFilterValue
  reserveDateRange: DateRangeFilterValue
}

export type SmsTabKey = 'template' | 'send-history'
