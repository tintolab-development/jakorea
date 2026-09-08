import { describe, expect, it } from 'vitest'
import { buildMailSendPayload, containsMailVariableTokens, validateMailSendDraft } from './payload'
import { MAIL_SEND_ALL_PROGRAM_ID, MAIL_SEND_PURPOSE, type MailSendDraft } from './types'

function draft(overrides: Partial<MailSendDraft> = {}): MailSendDraft {
  return {
    programId: '101',
    templateId: 'mail-tpl-workshop',
    purpose: MAIL_SEND_PURPOSE,
    useTemplate: false,
    senderName: '홍길동',
    senderEmail: 'gildong@jakorea.org',
    sendTiming: 'immediate',
    scheduledAt: null,
    subject: '안내',
    bodyHtml: '<p>본문</p>',
    attachmentFileNames: [],
    recipients: [
      {
        id: 'recv-001',
        participationType: 'participant',
        name: '홍길동',
        email: 'rkdtk@naver.com',
        source: 'program',
      },
    ],
    ...overrides,
  }
}

describe('containsMailVariableTokens', () => {
  it('detects hash tokens and editor chips', () => {
    expect(containsMailVariableTokens('안녕 #{회원명}')).toBe(true)
    expect(containsMailVariableTokens('<span data-mail-variable="회원명">#{회원명}</span>')).toBe(
      true
    )
    expect(containsMailVariableTokens('변수 없는 본문')).toBe(false)
  })
})

describe('buildMailSendPayload', () => {
  it('forces general purpose and derives useTemplate from templateId', () => {
    const withoutTemplate = buildMailSendPayload(draft({ templateId: undefined, useTemplate: true }))
    expect(withoutTemplate.purpose).toBe('general')
    expect(withoutTemplate.useTemplate).toBe(false)

    const withTemplate = buildMailSendPayload(draft({ templateId: 'mail-tpl-workshop' }))
    expect(withTemplate.useTemplate).toBe(true)
  })
})

describe('validateMailSendDraft', () => {
  it('requires program, template, sender email, recipients, subject, and body', () => {
    expect(validateMailSendDraft(draft({ programId: '' }))).toBe('대상 프로그램을 선택하세요.')
    expect(validateMailSendDraft(draft({ templateId: '' }))).toBe('템플릿을 선택하세요.')
    expect(validateMailSendDraft(draft({ templateId: undefined }))).toBe('템플릿을 선택하세요.')
    expect(validateMailSendDraft(draft({ senderEmail: '  ' }))).toBe(
      '발신 메일을 선택/입력해 주세요.'
    )
    expect(validateMailSendDraft(draft({ senderEmail: 'user@gmail.com' }))).toBe(
      'NHN에 등록된 발신 메일만 사용할 수 있습니다. 발신 프로필을 확인해 주세요.'
    )
    expect(validateMailSendDraft(draft({ recipients: [] }))).toBe('수신자를 설정하세요.')
    expect(validateMailSendDraft(draft({ subject: '' }))).toBe('제목을 작성하세요.')
    expect(validateMailSendDraft(draft({ bodyHtml: '' }))).toBe('내용을 작성하세요.')
  })

  it('requires a schedule datetime when scheduled', () => {
    expect(validateMailSendDraft(draft({ sendTiming: 'scheduled', scheduledAt: null }))).toBe(
      '예약 일시를 선택하세요.'
    )
  })

  it('blocks send when all programs are selected', () => {
    expect(
      validateMailSendDraft(
        draft({
          programId: MAIL_SEND_ALL_PROGRAM_ID,
          subject: '[JA Korea] #{프로그램명}',
        })
      )
    ).toBe('대상 프로그램을 선택하세요.')
  })

  it('blocks send when program id is not numeric', () => {
    expect(validateMailSendDraft(draft({ programId: 'prog-coy-2026' }))).toBe(
      '대상 프로그램을 선택하세요.'
    )
  })

  it('requires DIRECT recipient contact', () => {
    expect(
      validateMailSendDraft(
        draft({
          recipients: [
            {
              id: 'manual-empty',
              participationType: '',
              name: '',
              email: '   ',
              source: 'manual',
              actorType: 'DIRECT',
            },
          ],
        })
      )
    ).toBe('직접 입력 수신자의 연락처를 입력하세요.')
  })

  it('accepts a complete immediate send', () => {
    expect(validateMailSendDraft(draft())).toBeNull()
  })
})
