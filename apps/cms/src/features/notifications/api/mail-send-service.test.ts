import { beforeEach, describe, expect, it } from 'vitest'
import { submitMailSend } from './mail-send-service'
import {
  getMailSendHistoryMockRows,
  resetMailSendHistoryMockRows,
} from '@/features/notifications/model/mail-send-history/session-store'
import { MAIL_SEND_PURPOSE, type MailSendDraft } from '@/features/notifications/model/mail-send/types'

function draft(overrides: Partial<MailSendDraft> = {}): MailSendDraft {
  return {
    programId: 'prog-1',
    purpose: MAIL_SEND_PURPOSE,
    useTemplate: false,
    senderName: '홍길동',
    senderEmail: 'gildong@jakorea.org',
    sendTiming: 'immediate',
    scheduledAt: null,
    subject: '테스트 메일',
    bodyHtml: '<p>본문</p>',
    attachmentFileNames: ['a.pdf'],
    recipients: [
      {
        id: 'manual-a@jakorea.org',
        participationType: '',
        name: '수신자',
        email: 'a@example.com',
        source: 'manual',
      },
    ],
    ...overrides,
  }
}

describe('submitMailSend', () => {
  beforeEach(() => {
    resetMailSendHistoryMockRows()
  })

  it('records mock history when remote template id is absent', async () => {
    const before = getMailSendHistoryMockRows().length
    const result = await submitMailSend({
      draft: draft(),
      idempotencyKey: 'idem-1',
    })
    expect(result.mode).toBe('mock')
    expect(getMailSendHistoryMockRows().length).toBe(before + 1)
    expect(getMailSendHistoryMockRows()[0]?.subject).toBe('테스트 메일')
  })
})
