import type { Dayjs } from 'dayjs'
import type {
  SmsMessageType,
  SmsSenderNumberType,
} from '@/features/notifications/api/adapters/sms-channel'

/** 기획 4-1 발송 상태 */
export const SMS_SEND_STATUS_OPTIONS = [
  '전체',
  '발송 요청',
  '발송 취소',
  '발송 예약',
  '발송 대기',
  '발송 중',
  '발송 실패',
  '발송 성공',
] as const

/** 기획 4-1 수신 상태 */
export const SMS_RECEIVE_STATUS_OPTIONS = [
  '전체',
  '요청됨',
  '확인 대기중',
  '대기중',
  '예약됨',
  '수신 성공',
  '수신 실패',
  '취소됨',
] as const

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
