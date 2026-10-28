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

  it('does not call send API while MMS attachment is uploading/scanning', async () => {
    await expect(
      submitSmsSend({
        draft: draft({
          messageType: 'MMS',
          attachmentFileNames: ['a.jpg'],
          attachmentUploadPending: true,
        }),
        idempotencyKey: 'idem-mms-pending',
        senderProfileId: 9,
      })
    ).rejects.toThrow()
    expect(createSendBatchRemote).not.toHaveBeenCalled()
  })

  it('sends template-less MMS with request attachmentFileIds', async () => {
    await submitSmsSend({
      draft: draft({
        templateId: undefined,
        messageType: 'MMS',
        subject: '교육 안내',
        bodyText: '교육 안내입니다.',
        attachmentFileNames: ['notice.jpg'],
        attachmentFileIds: [30001],
      }),
      idempotencyKey: 'idem-mms-1',
      senderProfileId: 12,
    })
    const body = vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]
    expect(body).toMatchObject({
      messageType: 'MMS',
      senderProfileId: 12,
      contentTemplate: '교육 안내입니다.',
      attachmentFileIds: [30001],
    })
    expect(body).not.toHaveProperty('templateId')
  })

  it('LMS 발송은 attachmentFileIds를 보내지 않는다(회귀)', async () => {
    await submitSmsSend({
      draft: draft({ attachmentFileIds: [30001] }),
      templateBaseline: { subject: '안내', bodyText: '등록본문' },
      idempotencyKey: 'idem-lms-1',
      senderProfileId: 9,
    })
    expect(vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]).not.toHaveProperty(
      'attachmentFileIds'
    )
  })

  it('does not call send API when compose is invalid', async () => {
    await expect(
      submitSmsSend({
        draft: draft({ messageType: 'SMS', subject: '제목', bodyText: '본문' }),
        idempotencyKey: 'idem-sms-block',
        senderProfileId: 9,
      })
    ).rejects.toThrow('SMS에서는 제목을 사용할 수 없습니다.')
    expect(createSendBatchRemote).not.toHaveBeenCalled()
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

  it('sends without template: omits templateId, includes messageType and compose snapshot', async () => {
    await submitSmsSend({
      draft: draft({ templateId: undefined, subject: '직접 제목', bodyText: '직접 본문' }),
      idempotencyKey: 'idem-sms-no-template',
      senderProfileId: 9,
    })
    const body = vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]
    expect(body).not.toHaveProperty('templateId')
    expect(body).toMatchObject({
      messageType: 'LMS',
      titleTemplate: '직접 제목',
      contentTemplate: '직접 본문',
      senderProfileId: 9,
    })
    expect(body?.senderKey).toBeUndefined()
  })

  it('sends without template as SMS type: no titleTemplate', async () => {
    await submitSmsSend({
      draft: draft({ templateId: undefined, messageType: 'SMS', subject: '', bodyText: '짧은 본문' }),
      idempotencyKey: 'idem-sms-no-template-sms',
      senderProfileId: 9,
    })
    const body = vi.mocked(createSendBatchRemote).mock.calls[0]?.[0]
    expect(body).not.toHaveProperty('templateId')
    expect(body).toMatchObject({ messageType: 'SMS', contentTemplate: '짧은 본문' })
    expect(body?.titleTemplate).toBeUndefined()
  })

  it('rejects a non-numeric template id instead of silently sending without template', async () => {
    await expect(
      submitSmsSend({
        draft: draft({ templateId: 'local-tpl-1' }),
        idempotencyKey: 'idem-sms-bad-template',
        senderProfileId: 9,
      })
    ).rejects.toThrow('문자 발송에는 서버에 등록된 템플릿이 필요합니다.')
    expect(createSendBatchRemote).not.toHaveBeenCalled()
  })
})
