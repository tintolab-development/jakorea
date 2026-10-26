import { describe, expect, it } from 'vitest'
import type { MailSendRecipient } from './types'
import {
  MAIL_SEND_CONFIRM_MESSAGE,
  MAIL_VARIABLE_EXCLUSION_GUIDE,
  listMailSendPlaceholderKeys,
  validateMailSendVariables,
} from './validate-send'

const catalog = [{ key: '방문 안내', enabled: true, requiresProgram: false }]

function recipient(
  id: string,
  email: string,
  variables?: Record<string, string>,
  overrides: Partial<MailSendRecipient> = {}
): MailSendRecipient {
  return {
    id,
    participationType: '',
    memberType: '',
    name: id,
    email,
    source: 'manual',
    actorType: 'DIRECT',
    ...(variables ? { variables } : {}),
    ...overrides,
  }
}

function check(
  recipients: MailSendRecipient[],
  overrides: Partial<Parameters<typeof validateMailSendVariables>[0]> = {}
) {
  return validateMailSendVariables({
    programId: '',
    subject: '안내',
    bodyHtml: '<p>#{방문 안내}</p>',
    recipients,
    catalog,
    catalogState: 'ready',
    ...overrides,
  })
}

describe('validateMailSendVariables', () => {
  it('변수값이 없는 수신자만 제외하고 나머지는 발송 대상에 남긴다', () => {
    const filled = recipient('1', 'a@example.com', { '방문 안내': '오전' })
    const blank = recipient('2', 'b@example.com', { '방문 안내': '' })
    const result = check([filled, blank])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients.map(item => item.id)).toEqual(['1'])
    expect(result.confirmMessage).toContain(MAIL_SEND_CONFIRM_MESSAGE)
    expect(result.confirmMessage).toContain(MAIL_VARIABLE_EXCLUSION_GUIDE)
  })

  it('회원 조회와 직접 입력 모두 프로그램 미선택이면 수기 값이 필요하다', () => {
    const member = recipient('actor-MEMBER-4', 'member@example.com', undefined, {
      source: 'program',
      actorType: 'MEMBER',
      actorId: 4,
    })
    const manual = recipient('manual-direct@example.com', 'direct@example.com', {
      '방문 안내': '직접',
    })
    const result = check([member, manual])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients.map(item => item.id)).toEqual(['manual-direct@example.com'])
  })

  it('프로그램 선택 시 회원 변수는 자동 매칭으로 두고 수기 값으로 덮지 않는다', () => {
    const member = recipient(
      'actor-MEMBER-9',
      'member@example.com',
      { '방문 안내': '수기' },
      {
        source: 'program',
        actorType: 'MEMBER',
        actorId: 9,
      }
    )
    const result = check([member], { programId: '77' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients).toEqual([member])
    expect(result.confirmMessage).toBe(MAIL_SEND_CONFIRM_MESSAGE)
  })

  it('발송 직전에 같은 이메일을 다시 걸러 먼저 추가된 수신자를 남긴다', () => {
    const first = recipient('1', 'User@Example.com', { '방문 안내': '오전' }, { actorId: 1 })
    const duplicate = recipient('2', 'user@example.com', { '방문 안내': '오후' }, { actorId: 2 })
    const result = check([first, duplicate])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients).toEqual([first])
    expect(result.confirmMessage).toContain('같은 이메일 주소는 1건만 발송합니다.')
  })

  it('문맥 변수는 수신자 변수 누락으로 보지 않는다', () => {
    expect(
      listMailSendPlaceholderKeys(
        '#{동의 항목}',
        '<p><span data-mail-variable="만료일시">#{만료일시}</span>#{방문 안내}</p>'
      )
    ).toEqual(['방문 안내'])
    const result = check([recipient('1', 'a@example.com', { '방문 안내': '있음' })], {
      subject: '#{동의 항목}',
      bodyHtml: '<p>#{만료일시}#{방문 안내}</p>',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients).toHaveLength(1)
    expect(result.confirmMessage).toBe(MAIL_SEND_CONFIRM_MESSAGE)
  })
})
