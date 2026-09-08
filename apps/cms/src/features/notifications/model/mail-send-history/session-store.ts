import { formatMailPreviewPerson } from '@/features/notifications/model/mail-template/preview'
import { MAIL_SEND_HISTORY_MOCK } from '@/features/notifications/model/mail-send-history/mock'
import type { MailSendHistoryRow } from '@/features/notifications/model/mail-send-history/types'
import type { MailSendDraft } from '@/features/notifications/model/mail-send/types'

/** 세션 내 mock 발송 이력 (실 API 없을 때 발송→조회 연결) */
let sessionMailSendHistory: MailSendHistoryRow[] = [...MAIL_SEND_HISTORY_MOCK]

export function getMailSendHistoryMockRows(): MailSendHistoryRow[] {
  return sessionMailSendHistory
}

export function resetMailSendHistoryMockRows(): void {
  sessionMailSendHistory = [...MAIL_SEND_HISTORY_MOCK]
}

export function prependMailSendHistoryMockRows(rows: MailSendHistoryRow[]): void {
  if (rows.length === 0) return
  const ids = new Set(rows.map(row => row.id))
  sessionMailSendHistory = [...rows, ...sessionMailSendHistory.filter(row => !ids.has(row.id))]
}

export function createMailSendHistoryRowsFromDraft(
  draft: MailSendDraft,
  templateDisplayName?: string
): MailSendHistoryRow[] {
  const now = new Date().toISOString()
  const isScheduled = draft.sendTiming === 'scheduled'
  const reservedAt = isScheduled ? draft.scheduledAt ?? now : ''
  const templateName =
    draft.useTemplate && draft.templateId
      ? templateDisplayName?.trim() || draft.templateId
      : ''

  return draft.recipients.map((recipient, index) => {
    const id = `mail-send-local-${Date.now()}-${index}`
    return {
      id,
      requestAt: now,
      reservedAt,
      subject: draft.subject,
      senderName: draft.senderName,
      senderEmail: draft.senderEmail,
      senderInfo: formatMailPreviewPerson(draft.senderName, draft.senderEmail),
      receiverName: recipient.name,
      receiverEmail: recipient.email,
      receiverInfo: formatMailPreviewPerson(recipient.name, recipient.email),
      broadcastTiming: isScheduled ? '예약' : '즉시',
      sendStatus: isScheduled ? '예약' : '발송 성공',
      receiveStatus: isScheduled ? '예약됨' : '수신 성공',
      sentAt: isScheduled ? '' : now,
      receivedAt: isScheduled ? '' : now,
      readStatus: isScheduled ? '-' : '안읽음',
      templateName,
      bodyHtml: draft.bodyHtml,
      attachmentFileNames: [...draft.attachmentFileNames],
    }
  })
}
