import dayjs from 'dayjs'
import { formatMailPreviewPerson } from '@/features/notifications/model/mail-template/preview'
import type { MailSendHistoryPendingFilters, MailSendHistoryRow } from './types'

const base = dayjs().hour(14).minute(20).second(0).millisecond(0)

function isoByIndex(index: number): string {
  return base.subtract(index, 'hour').toISOString()
}

const bodySample =
  '<p>안녕하세요, <strong>홍길동</strong>님.</p><p>메일 발송 조회 상세 샘플 본문입니다.</p>'

const seedRows = [
  {
    id: 'mail-send-9',
    subject: '[JA Korea] 워크숍 수강 안내',
    timing: '예약' as const,
    templateName: '워크숍 수강 안내',
    attachments: ['워크숍 안내.pdf'],
    readStatus: '읽음' as const,
  },
  {
    id: 'mail-send-8',
    subject: '[JA Korea] 비밀번호 변경 안내',
    timing: '즉시' as const,
    templateName: '비밀번호 변경 안내',
    attachments: [] as string[],
    readStatus: '안읽음' as const,
  },
  {
    id: 'mail-send-7',
    subject: '[JA Korea] 회원가입 안내',
    timing: '즉시' as const,
    templateName: '회원가입 안내',
    attachments: [] as string[],
    readStatus: '읽음' as const,
  },
  {
    id: 'mail-send-6',
    subject: '직접 작성 메일 (템플릿 미사용)',
    timing: '예약' as const,
    templateName: '',
    attachments: ['첨부파일.pdf'],
    readStatus: '-' as const,
  },
  {
    id: 'mail-send-5',
    subject: '[JA Korea] 프로그램 모집 안내',
    timing: '즉시' as const,
    templateName: '프로그램 모집 안내',
    attachments: [] as string[],
    readStatus: '안읽음' as const,
  },
] as const

export const MAIL_SEND_HISTORY_MOCK: MailSendHistoryRow[] = seedRows.map((seed, index) => {
  const iso = isoByIndex(index)
  const isReserved = seed.timing === '예약'
  const senderName = '홍길동'
  const senderEmail = 'gildong@jakorea.org'
  const receiverName = '이가원'
  const receiverEmail = 'iga@example.com'

  return {
    id: seed.id,
    requestAt: iso,
    reservedAt: isReserved ? iso : '',
    subject: seed.subject,
    senderName,
    senderEmail,
    senderInfo: formatMailPreviewPerson(senderName, senderEmail),
    receiverName,
    receiverEmail,
    receiverInfo: formatMailPreviewPerson(receiverName, receiverEmail),
    broadcastTiming: seed.timing,
    sendStatus: '발송 성공',
    receiveStatus: '수신 성공',
    sentAt: iso,
    receivedAt: iso,
    readStatus: seed.readStatus,
    templateName: seed.templateName,
    bodyHtml: bodySample,
    attachmentFileNames: [...seed.attachments],
  }
})

function inDateRange(
  value: string,
  range: MailSendHistoryPendingFilters['requestDateRange']
): boolean {
  if (!range || (!range[0] && !range[1])) return true
  if (!value) return false
  const parsed = dayjs(value)
  if (!parsed.isValid()) return false
  if (range[0] && parsed.isBefore(range[0].startOf('day'))) return false
  if (range[1] && parsed.isAfter(range[1].endOf('day'))) return false
  return true
}

export function filterMailSendHistoryRows(
  rows: MailSendHistoryRow[],
  filters: MailSendHistoryPendingFilters
): MailSendHistoryRow[] {
  const subject = filters.subject.trim().toLowerCase()
  const sender = filters.senderInfo.trim().toLowerCase()
  const receiver = filters.receiverInfo.trim().toLowerCase()

  return rows.filter(row => {
    if (subject && !row.subject.toLowerCase().includes(subject)) return false
    if (sender && !row.senderInfo.toLowerCase().includes(sender)) return false
    if (receiver && !row.receiverInfo.toLowerCase().includes(receiver)) return false
    if (filters.broadcastTiming !== '전체' && row.broadcastTiming !== filters.broadcastTiming) {
      return false
    }
    if (filters.sendStatus !== '전체' && row.sendStatus !== filters.sendStatus) return false
    if (filters.receiveStatus !== '전체' && row.receiveStatus !== filters.receiveStatus) {
      return false
    }
    if (!inDateRange(row.requestAt, filters.requestDateRange)) return false
    if (!inDateRange(row.sentAt, filters.sendDateRange)) return false
    if (!inDateRange(row.receivedAt, filters.receiveDateRange)) return false
    if (filters.reserveDateRange?.[0] || filters.reserveDateRange?.[1]) {
      if (!inDateRange(row.reservedAt, filters.reserveDateRange)) return false
    }
    return true
  })
}
