import type { Dayjs } from 'dayjs'
import {
  NOTIFICATION_RECEIVE_STATUS_OPTIONS,
  NOTIFICATION_SEND_STATUS_OPTIONS,
} from '@/features/notifications/model/shared/delivery-status'

/** 세 채널 공통 정본 — `model/shared/delivery-status.ts` */
export const MAIL_SEND_STATUS_OPTIONS = NOTIFICATION_SEND_STATUS_OPTIONS

/** 세 채널 공통 정본 — `model/shared/delivery-status.ts` */
export const MAIL_RECEIVE_STATUS_OPTIONS = NOTIFICATION_RECEIVE_STATUS_OPTIONS

export const MAIL_BROADCAST_TIMING_OPTIONS = ['전체', '즉시', '예약'] as const

export type MailSendStatus = (typeof MAIL_SEND_STATUS_OPTIONS)[number]
export type MailReceiveStatus = (typeof MAIL_RECEIVE_STATUS_OPTIONS)[number]
export type MailBroadcastTiming = (typeof MAIL_BROADCAST_TIMING_OPTIONS)[number]

export type MailSendHistoryAttachment = {
  fileName: string
  fileObjectId?: number
  downloadHint?: string
  byteSize?: number
}

export type MailSendHistoryRow = {
  id: string
  requestAt: string
  reservedAt: string
  subject: string
  senderName: string
  senderEmail: string
  /** 목록·필터용: 이름<이메일> 또는 이메일 */
  senderInfo: string
  receiverName: string
  receiverEmail: string
  receiverInfo: string
  broadcastTiming: Exclude<MailBroadcastTiming, '전체'>
  sendStatus: Exclude<MailSendStatus, '전체'>
  receiveStatus: Exclude<MailReceiveStatus, '전체'>
  sentAt: string
  receivedAt: string
  /** 읽음 여부 표시 */
  readStatus: '읽음' | '안읽음' | '-'
  templateName: string
  bodyHtml: string
  /** sendStatus=발송 실패일 때 failedReason 보조 문구 */
  failedReason?: string
  /**
   * 발송은 됐지만 수신 실패(receiptStatus=DELIVERY_FAILED 등)일 때 사유 (QA-0176).
   * 응답 failedReason → providerResultMessage 순. 둘 다 없으면 비움(임의 문구 생성 금지).
   */
  receiveFailedReason?: string
  attachmentFileNames: string[]
  attachments?: MailSendHistoryAttachment[]
}

export type DateRangeFilterValue = [Dayjs | null, Dayjs | null] | null

export type MailSendHistoryPendingFilters = {
  requestDateRange: DateRangeFilterValue
  subject: string
  senderInfo: string
  receiverInfo: string
  sendStatus: MailSendStatus
  broadcastTiming: MailBroadcastTiming
  receiveStatus: MailReceiveStatus
  sendDateRange: DateRangeFilterValue
  receiveDateRange: DateRangeFilterValue
  reserveDateRange: DateRangeFilterValue
}
