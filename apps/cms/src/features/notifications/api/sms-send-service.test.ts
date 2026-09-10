import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SmsSendDraft } from '@/features/notifications/model/sms-send/types'

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

vi.mock('@/features/notifications/api/sms-template-service', () => ({
  updateSmsTemplate: vi.fn(async () => ({ templateId: '101' })),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { createSendBatchRemote } from '@/features/notifications/api/notifications-api-client'
import { updateSmsTemplate } from '@/features/notifications/api/sms-template-service'
import { submitSmsSend } from './sms-send-service'

function draft(overrides: Partial<SmsSendDraft> = {}): SmsSendDraft {
  return {
    programId: '77',
    templateId: '101',
    senderPhone: '010-1234-5678',
    messageType: 'LMS',
    subject: '안내',
    bodyText: '등록본문',
    attachmentFileNames: [],
    sendTiming: 'immediate',
    scheduledAt: null,
    recipients: [
      {
        id: 'manual-1',
        participationType: '',
        memberType: '',
        name: '직접',
        phone: '010-3333-4444',
        source: 'manual',
        actorType: 'DIRECT',
      },
    ],
    ...overrides,
  }
}

describe('submitSmsSend', () => {
  beforeEach(() => {
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(true)
    vi.mocked(createSendBatchRemote).mockClear()
    vi.mocked(updateSmsTemplate).mockClear()
  })

  it('sends edited compose as contentTemplate snapshot (no template PATCH)', async () => {
    await submitSmsSend({
      draft: draft({ bodyText: '등록본문#{회원명}' }),
      templateDisplayName: '안내문자',
      templateBaseline: { subject: '안내', bodyText: '등록본문' },
      idempotencyKey: 'idem-sms-1',
      senderProfileId: 9,
    })

    expect(updateSmsTemplate).not.toHaveBeenCalled()
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).toMatchObject({
      templateId: 101,
      contentTemplate: '등록본문#{회원명}',
    })
  })

  it('still sends contentTemplate when compose equals registered template', async () => {
    await submitSmsSend({
      draft: draft(),
      templateBaseline: { subject: '안내', bodyText: '등록본문' },
      idempotencyKey: 'idem-sms-2',
      senderProfileId: 9,
    })
    expect(updateSmsTemplate).not.toHaveBeenCalled()
    const body = vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]
    expect(body).toMatchObject({ contentTemplate: '등록본문', titleTemplate: '안내' })
  })
})
