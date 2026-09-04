import dayjs from 'dayjs'
import { ALIMTALK_TEMPLATE_ITEM_MOCK } from '@/features/notifications/model/alimtalk-template/mock'
import type { AlimtalkSendHistoryRow } from './types'

function templateById(id: string) {
  return ALIMTALK_TEMPLATE_ITEM_MOCK.find(template => template.id === id) ?? ALIMTALK_TEMPLATE_ITEM_MOCK[0]
}

const base = dayjs().hour(18).minute(10).second(38).millisecond(0)
const defaultMessage =
  '알림톡 문의 접수 안내 샘플 텍스트입니다. 발송 및 수신 상태를 상세 화면에서 확인할 수 있습니다.'

function isoByIndex(index: number): string {
  return base.subtract(index, 'minute').toISOString()
}

function numberByIndex(index: number): string {
  return `AT-${base.format('YYYYMMDD')}-${base.format('HHmmss')}-${String(9 - index).padStart(2, '0')}`
}

const seedRows = [
  { id: 'send-log-9', templateId: 'tpl-channel-add', broadcastTiming: '예약', sendCount: '2건', unusedTemplate: false },
  { id: 'send-log-8', templateId: 'tpl-password', broadcastTiming: '예약', sendCount: '2건', unusedTemplate: false },
  { id: 'send-log-7', templateId: 'tpl-emphasis-image', broadcastTiming: '예약', sendCount: '2건', unusedTemplate: false },
  { id: 'send-log-6', templateId: 'tpl-emphasis-text', broadcastTiming: '즉시', sendCount: '1건', unusedTemplate: false },
  { id: 'send-log-5', templateId: 'tpl-signup', broadcastTiming: '즉시', sendCount: '1건', unusedTemplate: false },
  { id: 'send-log-4', templateId: 'tpl-apply', broadcastTiming: '즉시', sendCount: '1건', unusedTemplate: false },
  {
    id: 'send-log-3',
    templateId: 'tpl-emphasis-item-list',
    broadcastTiming: '즉시',
    sendCount: '1건',
    unusedTemplate: false,
  },
  { id: 'send-log-2', templateId: 'tpl-channel-add', broadcastTiming: '즉시', sendCount: '1건', unusedTemplate: true },
  { id: 'send-log-1', templateId: 'tpl-password', broadcastTiming: '즉시', sendCount: '1건', unusedTemplate: false },
] as const

export const ALIMTALK_SEND_HISTORY_MOCK: AlimtalkSendHistoryRow[] = seedRows.map((seed, index) => {
  const iso = isoByIndex(index)
  const templateName = seed.unusedTemplate ? '미사용' : 'Gemini Academy 6월 웨비나 참여 안내'
  const isReserved = seed.broadcastTiming === '예약'
  const receiverName = '홍길동'
  const receiverPhone = '010-1234-5678'

  return {
    id: seed.id,
    requestAt: iso,
    sendRequestedAt: iso,
    receiveRequestedAt: iso,
    reservedAt: isReserved ? iso : '',
    templateName,
    senderInfo: '@jakorea',
    receiverName,
    receiverPhone,
    receiverInfo: `${receiverName} ${receiverPhone}`,
    broadcastTiming: seed.broadcastTiming,
    sendStatus: '발송 성공',
    receiveStatus: '수신 성공',
    sentAt: iso,
    receivedAt: iso,
    sendCount: seed.sendCount,
    sendNumber: numberByIndex(index),
    message: defaultMessage,
    phoneTemplate: templateById(seed.templateId),
  }
})
