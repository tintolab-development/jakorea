import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAIL_SEND_PURPOSE, type MailSendDraft } from '@/features/notifications/model/mail-send/types'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => true),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn(() => true),
}))

vi.mock('@/features/notifications/api/notifications-api-client', () => ({
  createSendBatchRemote: vi.fn(async () => ({})),
  fetchRecipientCandidatesRemote: vi.fn(),
  fetchSenderProfilesRemote: vi.fn(),
  fetchTemplateVariablesRemote: vi.fn(),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { createSendBatchRemote } from '@/features/notifications/api/notifications-api-client'
import { buildMailSendRecipients, submitMailSend } from './mail-send-service'

function draft(overrides: Partial<MailSendDraft> = {}): MailSendDraft {
  return {
    programId: '12',
    purpose: MAIL_SEND_PURPOSE,
    useTemplate: true,
    senderName: '홍길동',
    senderEmail: 'gildong@jakorea.org',
    sendTiming: 'immediate',
    scheduledAt: null,
    subject: '테스트 메일',
    bodyHtml: '<p>본문</p>',
    attachmentFileNames: ['a.pdf'],
    templateId: '33',
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
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(true)
    vi.mocked(createSendBatchRemote).mockClear()
  })

  it('sends a remote batch and does not fall back to mock history', async () => {
    await submitMailSend({
      draft: draft(),
      idempotencyKey: 'idem-1',
      senderProfileId: 7,
    })
    expect(createSendBatchRemote).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).toMatchObject({
      templateId: 33,
      programId: 12,
      senderProfileId: 7,
    })
  })

  it('throws when the template is not a server id', async () => {
    await expect(
      submitMailSend({
        draft: draft({ templateId: 'mail-tpl-password' }),
        idempotencyKey: 'idem-1',
      })
    ).rejects.toThrow('메일 발송에는 서버에 등록된 템플릿이 필요합니다.')
    expect(createSendBatchRemote).not.toHaveBeenCalled()
  })

  it('throws when remote API is unavailable instead of recording mock history', async () => {
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(false)
    await expect(
      submitMailSend({
        draft: draft(),
        idempotencyKey: 'idem-1',
      })
    ).rejects.toThrow('메일 발송은 관리자 로그인 후 이용할 수 있습니다.')
    expect(createSendBatchRemote).not.toHaveBeenCalled()
  })
})

describe('buildMailSendRecipients', () => {
  it('maps DIRECT contact without actorId and MEMBER with actorId', () => {
    expect(
      buildMailSendRecipients([
        {
          id: 'manual-a@jakorea.org',
          participationType: '',
          name: '직접',
          email: 'direct@example.com',
          source: 'manual',
          actorType: 'DIRECT',
        },
        {
          id: 'actor-MEMBER-12',
          participationType: 'participant',
          name: '회원',
          email: 'member@example.com',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 12,
        },
      ])
    ).toEqual([
      {
        actorType: 'DIRECT',
        recipientContact: 'direct@example.com',
        recipientName: '직접',
      },
      {
        actorType: 'MEMBER',
        actorId: 12,
        recipientName: '회원',
        recipientContact: 'member@example.com',
      },
    ])
  })
})
