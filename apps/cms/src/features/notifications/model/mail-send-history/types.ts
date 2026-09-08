import type { Dayjs } from 'dayjs'

export const MAIL_SEND_STATUS_OPTIONS = [
  '전체',
  '발송 요청',
  '발송 취소',
  '발송 예약',
  '발송 대기',
  '발송 중',
  '발송 실패',
  '발송 성공',
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
] as const

export const MAIL_BROADCAST_TIMING_OPTIONS = ['전체', '즉시', '예약'] as const

export type MailSendStatus = (typeof MAIL_SEND_STATUS_OPTIONS)[number]
export type MailReceiveStatus = (typeof MAIL_RECEIVE_STATUS_OPTIONS)[number]
export type MailBroadcastTiming = (typeof MAIL_BROADCAST_TIMING_OPTIONS)[number]

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
  attachmentFileNames: string[]
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
