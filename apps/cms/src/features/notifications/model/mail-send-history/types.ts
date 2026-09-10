import type { Dayjs } from 'dayjs'

/** 알림톡 sendStatus와 동일 SSOT 라벨 */
export const MAIL_SEND_STATUS_OPTIONS = [
  '전체',
  '발송 요청',
  '예약',
  '대기',
  '발송중',
  '발송 성공',
  '발송 실패',
  '취소',
  '확인불가',
] as const

export const MAIL_RECEIVE_STATUS_OPTIONS = [
  '전체',
  '요청됨',
  '확인 대기중',
  '대기중',
  '예약됨',
  '수신 성공',
  '수신 실패',
  '취소됨',
  '확인불가',
] as const

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
