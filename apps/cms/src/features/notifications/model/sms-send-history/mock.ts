import dayjs from 'dayjs'
import type { SmsSendHistoryPendingFilters, SmsSendHistoryRow } from './types'

const base = dayjs().hour(16).minute(12).second(32).millisecond(0)

function isoByIndex(index: number): string {
  return base.subtract(index, 'day').toISOString()
}

const bodySample = `안녕하세요, 이기원님 JA KOREA입니다.

5월 23일 COY 2차 연수 워크숍 영상을 공유드립니다.
https://youtu.be/zJFb0JnTsFM

설문도 함께 부탁드립니다.
https://youtu.be/zJFb0JnTsFM`

const seedRows = [
  {
    id: 'sms-send-9',
    content: '안녕하세요, #{회원명}님. JA Korea입니다. 프로그램 안내드립니다.',
    subject: '회원가입 완료 안내',
    timing: '예약' as const,
    templateName: '',
    messageType: 'LMS' as const,
    senderType: '대표자 번호, 사업자 자체 번호' as const,
    attachments: [] as string[],
  },
  {
    id: 'sms-send-8',
    content: '[JA] 인증번호는 123456입니다. 5분 내 입력해 주세요.',
    subject: '',
    timing: '즉시' as const,
    templateName: '인증번호 발송',
    messageType: 'SMS' as const,
    senderType: '임직원 번호' as const,
    attachments: [] as string[],
  },
  {
    id: 'sms-send-7',
    content: '안녕하세요, #{회원명}님. 워크숍 참석 안내드립니다.',
    subject: '워크숍 참석 안내',
    timing: '즉시' as const,
    templateName: '워크숍 참석 안내',
    messageType: 'LMS' as const,
    senderType: '대표자 번호, 사업자 자체 번호' as const,
    attachments: [] as string[],
  },
  {
    id: 'sms-send-6',
    content: 'MMS 이미지와 함께 안내드립니다.',
    subject: 'MMS 안내',
    timing: '예약' as const,
    templateName: 'MMS 안내',
    messageType: 'MMS' as const,
    senderType: '타사 번호' as const,
    attachments: ['안내이미지.jpg'],
  },
  {
    id: 'sms-send-5',
    content: '비밀번호 변경이 완료되었습니다.',
    subject: '',
    timing: '즉시' as const,
    templateName: '비밀번호 변경 안내',
    messageType: 'SMS' as const,
    senderType: '타인 번호' as const,
    attachments: [] as string[],
  },
  {
    id: 'sms-send-4',
    content: '프로그램 모집이 시작되었습니다. 자세한 내용은 홈페이지를 확인해 주세요.',
    subject: '프로그램 모집 안내',
    timing: '즉시' as const,
    templateName: '',
    messageType: 'LMS' as const,
    senderType: '대표자 번호, 사업자 자체 번호' as const,
    attachments: [] as string[],
  },
  {
    id: 'sms-send-3',
    content: '예약 발송 테스트 메시지입니다.',
    subject: '예약 발송 테스트',
    timing: '예약' as const,
    templateName: '예약 발송 테스트',
    messageType: 'LMS' as const,
    senderType: '임직원 번호' as const,
    attachments: [] as string[],
  },
  {
    id: 'sms-send-2',
    content: '수신 확인용 단문입니다.',
    subject: '',
    timing: '즉시' as const,
    templateName: '',
    messageType: 'SMS' as const,
    senderType: '대표자 번호, 사업자 자체 번호' as const,
    attachments: [] as string[],
  },
  {
    id: 'sms-send-1',
    content: bodySample.replace(/\n/g, ' ').slice(0, 80),
    subject: '회원가입 완료 안내',
    timing: '즉시' as const,
    templateName: '',
    messageType: 'LMS' as const,
    senderType: '대표자 번호, 사업자 자체 번호' as const,
    attachments: [] as string[],
  },
] as const

export const SMS_SEND_HISTORY_MOCK: SmsSendHistoryRow[] = seedRows.map((seed, index) => {
  const iso = isoByIndex(index)
  const isReserved = seed.timing === '예약'
  const senderPhone = '02-783-2367'
  const receiverPhone = '010-1234-5678'

  return {
    id: seed.id,
    requestAt: iso,
    reservedAt: isReserved ? iso : '',
    content: seed.content,
    subject: seed.subject,
    senderNumberType: seed.senderType,
    senderPhone,
    senderInfo: senderPhone,
    receiverPhone,
    receiverInfo: receiverPhone,
    broadcastTiming: seed.timing,
    sendStatus: '발송 성공',
    receiveStatus: '수신 성공',
    sentAt: iso,
    receivedAt: iso,
    templateName: seed.templateName,
    messageType: seed.messageType,
    bodyText: seed.messageType === 'SMS' ? seed.content : bodySample,
    attachmentFileNames: [...seed.attachments],
    attachments: seed.attachments.map(fileName => ({ fileName })),
  }
})

function inDateRange(
  value: string,
  range: SmsSendHistoryPendingFilters['requestDateRange']
): boolean {
  if (!range || (!range[0] && !range[1])) return true
  if (!value) return false
  const parsed = dayjs(value)
  if (!parsed.isValid()) return false
  if (range[0] && parsed.isBefore(range[0].startOf('day'))) return false
  if (range[1] && parsed.isAfter(range[1].endOf('day'))) return false
  return true
}

export function filterSmsSendHistoryRows(
  rows: SmsSendHistoryRow[],
  filters: SmsSendHistoryPendingFilters
): SmsSendHistoryRow[] {
  const content = filters.content.trim().toLowerCase()
  const sender = filters.senderInfo.trim().toLowerCase()
  const receiver = filters.receiverInfo.trim().toLowerCase()

  return rows.filter(row => {
    if (content && !row.content.toLowerCase().includes(content) && !row.bodyText.toLowerCase().includes(content)) {
      return false
    }
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
    if (!inDateRange(row.reservedAt, filters.reserveDateRange)) return false
    return true
  })
}
