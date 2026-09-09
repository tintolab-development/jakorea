import { SMS_SEND_HISTORY_MOCK } from '@/features/notifications/model/sms-send-history/mock'
import type { SmsSendHistoryRow } from '@/features/notifications/model/sms-send-history/types'
import type { SmsSendDraft } from '@/features/notifications/model/sms-send/types'

let sessionSmsSendHistory: SmsSendHistoryRow[] = [...SMS_SEND_HISTORY_MOCK]

export function getSmsSendHistoryMockRows(): SmsSendHistoryRow[] {
  return sessionSmsSendHistory
}

export function resetSmsSendHistoryMockRows(): void {
  sessionSmsSendHistory = [...SMS_SEND_HISTORY_MOCK]
}

export function prependSmsSendHistoryMockRows(rows: SmsSendHistoryRow[]): void {
  if (rows.length === 0) return
  const ids = new Set(rows.map(row => row.id))
  sessionSmsSendHistory = [...rows, ...sessionSmsSendHistory.filter(row => !ids.has(row.id))]
}

export function createSmsSendHistoryRowsFromDraft(
  draft: SmsSendDraft,
  templateDisplayName?: string
): SmsSendHistoryRow[] {
  const now = new Date().toISOString()
  const isScheduled = draft.sendTiming === 'scheduled'
  const reservedAt = isScheduled ? draft.scheduledAt ?? now : ''
  const templateName = draft.templateId ? templateDisplayName?.trim() || draft.templateId : ''

  return draft.recipients.map((recipient, index) => ({
    id: `sms-send-local-${Date.now()}-${index}`,
    requestAt: now,
    reservedAt,
    content: draft.bodyText.slice(0, 80),
    subject: draft.subject,
    senderNumberType: '',
    senderPhone: draft.senderPhone,
    senderInfo: draft.senderPhone,
    receiverPhone: recipient.phone,
    receiverInfo: recipient.phone,
    broadcastTiming: isScheduled ? '예약' : '즉시',
    sendStatus: isScheduled ? '발송 예약' : '발송 성공',
    receiveStatus: isScheduled ? '예약됨' : '수신 성공',
    sentAt: isScheduled ? '' : now,
    receivedAt: isScheduled ? '' : now,
    templateName,
    messageType: draft.messageType,
    bodyText: draft.bodyText,
    attachmentFileNames: [...draft.attachmentFileNames],
    attachments: draft.attachmentFileNames.map(fileName => ({ fileName })),
  }))
}
