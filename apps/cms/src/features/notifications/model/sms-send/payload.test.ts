import { describe, expect, it } from 'vitest'
import {
  buildSmsSendCreateRequest,
  buildSmsSendPayload,
  estimateSmsSendBodyBytes,
  resolveSmsSendMessageTypeForBody,
  validateSmsSendDraft,
} from './payload'
import { SMS_SEND_ALL_PROGRAM_ID, type SmsSendDraft } from './types'

function draft(overrides: Partial<SmsSendDraft> = {}): SmsSendDraft {
  return {
    programId: '77',
    templateId: '101',
    senderPhone: '010-1234-5678',
    messageType: 'LMS',
    subject: '안내',
    bodyText: '본문',
    attachmentFileNames: [],
    sendTiming: 'immediate',
    scheduledAt: null,
    recipients: [
      {
        id: 'actor-MEMBER-1',
        participationType: 'participant',
        memberType: 'general',
        name: '홍길동',
        phone: '010-1111-2222',
        source: 'program',
        actorType: 'MEMBER',
        actorId: 1,
      },
    ],
    ...overrides,
  }
}

describe('estimateSmsSendBodyBytes', () => {
  it('counts ascii as 1 byte and hangul as 2 bytes', () => {
    expect(estimateSmsSendBodyBytes('abc')).toBe(3)
    expect(estimateSmsSendBodyBytes('가나')).toBe(4)
  })
})

describe('resolveSmsSendMessageTypeForBody', () => {
  it('upgrades SMS to LMS when over SMS byte limit', () => {
    expect(
      resolveSmsSendMessageTypeForBody({
        current: 'SMS',
        bodyBytes: 91,
        hasAttachments: false,
      })
    ).toBe('LMS')
  })

  it('keeps LMS when over limit without attachments', () => {
    expect(
      resolveSmsSendMessageTypeForBody({
        current: 'LMS',
        bodyBytes: 200,
        hasAttachments: false,
      })
    ).toBe('LMS')
  })

  it('forces MMS when attachments exist', () => {
    expect(
      resolveSmsSendMessageTypeForBody({
        current: 'SMS',
        bodyBytes: 10,
        hasAttachments: true,
      })
    ).toBe('MMS')
  })
})

describe('buildSmsSendPayload', () => {
  it('trims sender phone and clears subject for SMS type', () => {
    expect(
      buildSmsSendPayload(
        draft({
          senderPhone: ' 010-1234-5678 ',
          messageType: 'SMS',
          subject: ' 유지되면 안 됨 ',
        })
      )
    ).toMatchObject({
      senderPhone: '010-1234-5678',
      subject: '',
    })
  })
})

describe('buildSmsSendCreateRequest', () => {
  it('maps program/member recipient fields without content override fields', () => {
    const request = buildSmsSendCreateRequest({
      draft: draft({ programId: '77' }),
      templateId: 101,
      senderKey: '01012345678',
      senderProfileId: 9,
    })

    expect(request).toMatchObject({
      templateId: 101,
      programId: 77,
      senderKey: '01012345678',
      senderProfileId: 9,
    })
    expect(request).not.toHaveProperty('channelType')
    expect(request).not.toHaveProperty('smsMessageType')
    expect(request).not.toHaveProperty('titleTemplate')
    expect(request).not.toHaveProperty('contentTemplate')
    expect(request.recipients[0]).toMatchObject({
      actorType: 'MEMBER',
      actorId: 1,
      recipientContact: '01011112222',
      variables: {
        회원명: '홍길동',
        수신자명: '홍길동',
        '휴대폰 번호': '01011112222',
        전화번호: '01011112222',
        phone: '01011112222',
      },
    })
  })

  it('omits programId for all-program send', () => {
    const request = buildSmsSendCreateRequest({
      draft: draft({
        programId: SMS_SEND_ALL_PROGRAM_ID,
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
      }),
      templateId: 101,
    })
    expect(request).not.toHaveProperty('programId')
    expect(request.templateId).toBe(101)
  })

  it('rejects non-numeric program id', () => {
    expect(() =>
      buildSmsSendCreateRequest({
        draft: draft({ programId: 'prog-coy-2026' }),
        templateId: 101,
      })
    ).toThrow('대상 프로그램을 선택하세요.')
  })

  it('maps DIRECT recipients with contact and without actorId', () => {
    const request = buildSmsSendCreateRequest({
      draft: draft({
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
      }),
      templateId: 101,
    })
    expect(request.recipients[0]).toEqual({
      actorType: 'DIRECT',
      recipientContact: '01033334444',
      recipientName: '직접',
      variables: {
        회원명: '직접',
        수신자명: '직접',
        '휴대폰 번호': '01033334444',
        전화번호: '01033334444',
        phone: '01033334444',
      },
    })
    expect(request.recipients[0]).not.toHaveProperty('actorId')
  })
})

describe('validateSmsSendDraft', () => {
  it('requires program, template, sender phone, schedule, recipients, subject, and body', () => {
    expect(validateSmsSendDraft(draft({ programId: '' }))).toBe('대상 프로그램을 선택하세요.')
    expect(validateSmsSendDraft(draft({ programId: 'prog-coy-2026' }))).toBe(
      '대상 프로그램을 선택하세요.'
    )
    expect(
      validateSmsSendDraft(
        draft({
          programId: SMS_SEND_ALL_PROGRAM_ID,
        })
      )
    ).toBe('대상 프로그램이 미선택일 때는 직접 입력 수신자만 사용할 수 있습니다.')
    expect(
      validateSmsSendDraft(
        draft({
          programId: SMS_SEND_ALL_PROGRAM_ID,
          recipients: [
            {
              id: 'manual-1',
              participationType: '',
              memberType: '',
              name: '',
              phone: '01012345678',
              source: 'manual',
              actorType: 'DIRECT',
            },
          ],
        })
      )
    ).toBeNull()
    expect(validateSmsSendDraft(draft({ templateId: '' }))).toBe('템플릿을 선택하세요.')
    expect(validateSmsSendDraft(draft({ senderPhone: '  ' }))).toBe('발신 번호를 입력하세요.')
    expect(validateSmsSendDraft(draft({ senderPhone: '1234' }))).toBe(
      '발신 번호 형식이 올바르지 않습니다.'
    )
    expect(validateSmsSendDraft(draft({ sendTiming: 'scheduled', scheduledAt: null }))).toBe(
      '예약 일시를 선택하세요.'
    )
    expect(
      validateSmsSendDraft(
        draft({
          sendTiming: 'scheduled',
          scheduledAt: '2020-01-01T00:00:00.000Z',
        })
      )
    ).toBe('예약 시간은 현재 이후여야 합니다.')
    expect(validateSmsSendDraft(draft({ recipients: [] }))).toBe('수신자를 설정하세요.')
    expect(validateSmsSendDraft(draft({ subject: '' }))).toBe('제목을 작성하세요.')
    expect(validateSmsSendDraft(draft({ bodyText: '' }))).toBe('내용을 작성하세요.')
  })

  it('does not require a subject for SMS type', () => {
    expect(validateSmsSendDraft(draft({ messageType: 'SMS', subject: '' }))).toBeNull()
  })

  it('requires DIRECT recipient contact', () => {
    expect(
      validateSmsSendDraft(
        draft({
          recipients: [
            {
              id: 'manual-empty',
              participationType: '',
              memberType: '',
              name: '',
              phone: '',
              source: 'manual',
              actorType: 'DIRECT',
            },
          ],
        })
      )
    ).toBe('직접 입력 수신자의 연락처를 입력하세요.')
  })
})
