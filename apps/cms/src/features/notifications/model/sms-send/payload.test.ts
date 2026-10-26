import { describe, expect, it } from 'vitest'
import {
  buildSmsSendCreateRequest,
  buildSmsSendPayload,
  estimateSmsSendBodyBytes,
  validateSmsSendDraft,
} from './payload'
import {
  collectSmsComposeFieldIssues,
  LMS_MMS_BODY_BYTE_LIMIT,
  SMS_BODY_BYTE_LIMIT,
  SMS_COMPOSE_ERROR,
  SMS_SUBJECT_BYTE_LIMIT,
  smsComposeInlineMessage,
} from './text-bytes'
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

describe('collectSmsComposeFieldIssues', () => {
  it('SMS-01: allows SMS body of exactly 90 bytes', () => {
    const body = 'a'.repeat(SMS_BODY_BYTE_LIMIT)
    expect(estimateSmsSendBodyBytes(body)).toBe(90)
    expect(
      collectSmsComposeFieldIssues({
        messageType: 'SMS',
        subject: '',
        bodyText: body,
        attachmentCount: 0,
      }).bodyError
    ).toBeNull()
  })

  it('SMS-02: keeps SMS type and flags over-limit body', () => {
    const issues = collectSmsComposeFieldIssues({
      messageType: 'SMS',
      subject: '',
      bodyText: 'a'.repeat(91),
      attachmentCount: 0,
    })
    expect(issues.bodyError).toBe(SMS_COMPOSE_ERROR.smsBodyOver)
  })

  it('shows inline field error only when byte limit is exceeded', () => {
    expect(smsComposeInlineMessage(SMS_COMPOSE_ERROR.subjectRequired)).toBeUndefined()
    expect(smsComposeInlineMessage(SMS_COMPOSE_ERROR.bodyRequired)).toBeUndefined()
    expect(smsComposeInlineMessage(SMS_COMPOSE_ERROR.smsSubjectUnsupported)).toBeUndefined()
    expect(smsComposeInlineMessage(SMS_COMPOSE_ERROR.subjectOver)).toBe(
      SMS_COMPOSE_ERROR.subjectOver
    )
    expect(smsComposeInlineMessage(SMS_COMPOSE_ERROR.smsBodyOver)).toBe(
      SMS_COMPOSE_ERROR.smsBodyOver
    )
  })

  it('TYPE-01: preserves LMS title as SMS error', () => {
    const issues = collectSmsComposeFieldIssues({
      messageType: 'SMS',
      subject: '보존된 제목',
      bodyText: '본문',
      attachmentCount: 0,
    })
    expect(issues.subjectError).toBe(SMS_COMPOSE_ERROR.smsSubjectUnsupported)
  })

  it('TYPE-02: preserves MMS images as LMS error', () => {
    const issues = collectSmsComposeFieldIssues({
      messageType: 'LMS',
      subject: '제목',
      bodyText: '본문',
      attachmentCount: 1,
    })
    expect(issues.attachmentError).toBe(SMS_COMPOSE_ERROR.lmsImageUnsupported)
  })

  it('LMS-01: allows LMS body of exactly 2,000 bytes', () => {
    const body = 'a'.repeat(LMS_MMS_BODY_BYTE_LIMIT)
    expect(estimateSmsSendBodyBytes(body)).toBe(2000)
    expect(
      collectSmsComposeFieldIssues({
        messageType: 'LMS',
        subject: '제목',
        bodyText: body,
        attachmentCount: 0,
      }).bodyError
    ).toBeNull()
  })

  it('LMS-04: keeps over-limit title and flags error', () => {
    const subject = '가'.repeat(SMS_SUBJECT_BYTE_LIMIT / 2 + 1)
    expect(estimateSmsSendBodyBytes(subject)).toBeGreaterThan(SMS_SUBJECT_BYTE_LIMIT)
    expect(
      collectSmsComposeFieldIssues({
        messageType: 'LMS',
        subject,
        bodyText: '본문',
        attachmentCount: 0,
      }).subjectError
    ).toBe(SMS_COMPOSE_ERROR.subjectOver)
  })
})

describe('buildSmsSendPayload', () => {
  it('trims sender phone and preserves SMS leftover subject', () => {
    expect(
      buildSmsSendPayload(
        draft({
          senderPhone: ' 010-1234-5678 ',
          messageType: 'SMS',
          subject: ' 보존 ',
        })
      )
    ).toMatchObject({
      senderPhone: '010-1234-5678',
      subject: ' 보존 ',
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
    expect(request.recipients[0]).toEqual({
      actorType: 'MEMBER',
      actorId: 1,
    })
    expect(request.recipients[0]).not.toHaveProperty('recipientContact')
    expect(request.recipients[0]).not.toHaveProperty('recipientName')
    expect(request.recipients[0]).not.toHaveProperty('variables')
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

  it('omits templateId and sends messageType when no template is selected', () => {
    const request = buildSmsSendCreateRequest({
      draft: draft({ templateId: undefined, messageType: 'LMS' }),
      templateId: null,
    })
    expect(request).not.toHaveProperty('templateId')
    expect(request.messageType).toBe('LMS')
  })

  it('keeps templateId and omits messageType when a template is selected', () => {
    const request = buildSmsSendCreateRequest({ draft: draft(), templateId: 101 })
    expect(request.templateId).toBe(101)
    expect(request).not.toHaveProperty('messageType')
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
    })
    expect(request.recipients[0]).not.toHaveProperty('actorId')
    expect(request.recipients[0]).not.toHaveProperty('variables')
  })

  it('프로그램 미선택 수신자의 수기 변수만 recipients[].variables로 싣고 빈 값·예약 키는 뺀다', () => {
    const request = buildSmsSendCreateRequest({
      draft: draft({
        programId: '',
        bodyText: '#{방문 안내}#{프로그램명}',
        recipients: [
          {
            id: 'actor-MEMBER-1',
            participationType: '',
            memberType: 'general',
            name: '회원',
            phone: '010-1111-2222',
            source: 'program',
            actorType: 'MEMBER',
            actorId: 1,
            variables: {
              '방문 안내': '  오전  ',
              프로그램명: '임의',
              '다른 안내': '제외',
            },
          },
          {
            id: 'manual-1',
            participationType: '',
            memberType: '',
            name: '직접',
            phone: '010-3333-4444',
            source: 'manual',
            actorType: 'DIRECT',
            variables: { '방문 안내': '' },
          },
        ],
      }),
      templateId: 101,
      placeholderKeys: ['방문 안내', '프로그램명'],
      variableCatalog: [
        { key: '방문 안내', enabled: true },
        { key: '프로그램명', enabled: true, requiresProgram: true },
      ],
    })
    expect(request.recipients[0]).toEqual({
      actorType: 'MEMBER',
      actorId: 1,
      variables: { '방문 안내': '오전' },
    })
    expect(request.recipients[1]).toEqual({
      actorType: 'DIRECT',
      recipientContact: '01033334444',
      recipientName: '직접',
    })
    expect(request.recipients[1]).not.toHaveProperty('variables')
  })

  it('프로그램 선택 시 회원 자동 매칭 변수는 payload에 넣지 않는다', () => {
    const request = buildSmsSendCreateRequest({
      draft: draft({
        programId: '77',
        recipients: [
          {
            id: 'actor-MEMBER-1',
            participationType: 'participant',
            memberType: 'general',
            name: '회원',
            phone: '010-1111-2222',
            source: 'program',
            actorType: 'MEMBER',
            actorId: 1,
            variables: { '방문 안내': '덮어쓰면 안 됨' },
          },
        ],
      }),
      templateId: 101,
      placeholderKeys: ['방문 안내'],
      variableCatalog: [{ key: '방문 안내', enabled: true }],
    })
    expect(request.recipients[0]).toEqual({ actorType: 'MEMBER', actorId: 1 })
    expect(request.recipients[0]).not.toHaveProperty('variables')
  })

  it('payload를 만들기 직전에 같은 휴대폰 번호를 한 건으로 줄인다', () => {
    const request = buildSmsSendCreateRequest({
      draft: draft({
        recipients: [
          {
            id: 'actor-MEMBER-1',
            participationType: 'participant',
            memberType: 'general',
            name: '먼저',
            phone: '010-1111-2222',
            source: 'program',
            actorType: 'MEMBER',
            actorId: 1,
          },
          {
            id: 'actor-MEMBER-2',
            participationType: 'participant',
            memberType: 'general',
            name: '나중',
            phone: '01011112222',
            source: 'program',
            actorType: 'MEMBER',
            actorId: 2,
          },
        ],
      }),
      templateId: 101,
    })
    expect(request.recipients).toEqual([{ actorType: 'MEMBER', actorId: 1 }])
  })
})

describe('validateSmsSendDraft', () => {
  it('requires template, sender phone, schedule, recipients, subject, and body', () => {
    expect(validateSmsSendDraft(draft({ programId: 'prog-coy-2026' }))).toBe(
      '대상 프로그램을 선택하세요.'
    )
    expect(
      validateSmsSendDraft(
        draft({
          programId: '',
        })
      )
    ).toBeNull()
    expect(
      validateSmsSendDraft(
        draft({
          programId: SMS_SEND_ALL_PROGRAM_ID,
        })
      )
    ).toBeNull()
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
    // 템플릿 미선택 = 템플릿 사용 안 함 → 템플릿 없이도 발송 가능
    expect(validateSmsSendDraft(draft({ templateId: undefined }))).toBeNull()
    expect(validateSmsSendDraft(draft({ templateId: '' }))).toBeNull()
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

  it('blocks SMS send while leftover title remains', () => {
    expect(validateSmsSendDraft(draft({ messageType: 'SMS', subject: '제목' }))).toBe(
      SMS_COMPOSE_ERROR.smsSubjectUnsupported
    )
  })

  it('blocks SMS send when body exceeds 90 bytes without changing type', () => {
    expect(
      validateSmsSendDraft(
        draft({
          messageType: 'SMS',
          subject: '',
          bodyText: 'a'.repeat(91),
        })
      )
    ).toBe(SMS_COMPOSE_ERROR.smsBodyOver)
  })

  it('blocks LMS send when title is missing', () => {
    expect(validateSmsSendDraft(draft({ messageType: 'LMS', subject: '' }))).toBe(
      SMS_COMPOSE_ERROR.subjectRequired
    )
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
