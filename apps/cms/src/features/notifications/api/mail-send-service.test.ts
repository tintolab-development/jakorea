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

vi.mock('@/features/notifications/api/mail-template-service', () => ({
  updateMailTemplate: vi.fn(async () => ({ templateId: '33' })),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { createSendBatchRemote } from '@/features/notifications/api/notifications-api-client'
import { updateMailTemplate } from '@/features/notifications/api/mail-template-service'
import {
  buildMailRecipientVariables,
  buildMailSendRecipients,
  submitMailSend,
} from './mail-send-service'

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
    vi.mocked(updateMailTemplate).mockClear()
  })

  it('sends a remote batch and does not fall back to mock history', async () => {
    await submitMailSend({
      draft: draft(),
      templateBaseline: { subject: '테스트 메일', bodyHtml: '<p>본문</p>' },
      idempotencyKey: 'idem-1',
      senderProfileId: 7,
    })
    expect(createSendBatchRemote).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).toMatchObject({
      templateId: 33,
      programId: 12,
      senderProfileId: 7,
    })
    // 등록본과 동일하면 스냅샷 omit + 마스터 PATCH 금지
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).not.toHaveProperty(
      'contentTemplate'
    )
    expect(updateMailTemplate).not.toHaveBeenCalled()
  })

  it('sends compose snapshot as contentTemplate when body is edited on send screen', async () => {
    await submitMailSend({
      draft: draft({
        bodyHtml: '<p>#{회원명}</p>',
      }),
      templateDisplayName: '가나다',
      templateBaseline: { subject: '테스트 메일', bodyHtml: '<p>본문</p>' },
      idempotencyKey: 'idem-sync',
      senderProfileId: 7,
    })
    expect(updateMailTemplate).not.toHaveBeenCalled()
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).toMatchObject({
      contentTemplate: '<p>#{회원명}</p>',
    })
  })

  it('normalizes HTML-entity placeholders in the snapshot', async () => {
    await submitMailSend({
      draft: draft({
        bodyHtml: '<p>#{회원명}</p>'.replace(/[{}]/g, ch =>
          ch === '{' ? '&#123;' : '&#125;'
        ),
      }),
      templateBaseline: { subject: '테스트 메일', bodyHtml: '<p>본문</p>' },
      idempotencyKey: 'idem-entity',
      senderProfileId: 7,
    })
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).toMatchObject({
      contentTemplate: '<p>#{회원명}</p>',
    })
  })

  it('maps DIRECT recipients with contact and without reserved variables', async () => {
    await submitMailSend({
      draft: draft({
        bodyHtml: '<p>#{회원명}#{사용자 아이디(이메일)}</p>',
      }),
      templateBaseline: {
        subject: '테스트 메일',
        bodyHtml: '<p>#{회원명}#{사용자 아이디(이메일)}</p>',
      },
      idempotencyKey: 'idem-vars',
      senderProfileId: 7,
    })
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).toMatchObject({
      recipients: [
        {
          actorType: 'DIRECT',
          recipientContact: 'a@example.com',
          recipientName: '수신자',
        },
      ],
    })
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0].recipients[0]).not.toHaveProperty(
      'variables'
    )
  })

  it('substitutes context keys into contentTemplate (not create.variables)', async () => {
    await submitMailSend({
      draft: draft({
        bodyHtml: '<p>#{동의 항목}#{만료일시}</p>',
      }),
      templateBaseline: {
        subject: '테스트 메일',
        bodyHtml: '<p>#{동의 항목}#{만료일시}</p>',
      },
      variables: {
        '동의 항목': '개인정보 수집·이용 동의',
        만료일시: '2026-09-30',
      },
      idempotencyKey: 'idem-context',
      senderProfileId: 7,
    })
    const body = vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]
    expect(body).not.toHaveProperty('variables')
    expect(body).toMatchObject({
      contentTemplate: '<p>개인정보 수집·이용 동의2026-09-30</p>',
    })
  })

  it('does not pad empty create.variables', async () => {
    await submitMailSend({
      draft: draft(),
      templateBaseline: { subject: '테스트 메일', bodyHtml: '<p>본문</p>' },
      variables: { '동의 항목': '  ', 만료일시: '' },
      idempotencyKey: 'idem-empty-vars',
      senderProfileId: 7,
    })
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).not.toHaveProperty('variables')
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
      },
    ])
  })

  it('skips masked PII in recipient variables', () => {
    expect(
      buildMailRecipientVariables({
        id: 'actor-MEMBER-1',
        participationType: 'participant',
        name: '이*희',
        email: '2***@tinto.co.kr',
        source: 'program',
        actorType: 'MEMBER',
        actorId: 1,
      })
    ).toBeUndefined()
  })
})
