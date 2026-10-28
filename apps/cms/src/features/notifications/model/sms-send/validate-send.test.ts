import { describe, expect, it } from 'vitest'
import type { SmsSendRecipient } from './types'
import {
  SMS_SEND_CONFIRM_MESSAGE,
  SMS_VARIABLE_EXCLUSION_GUIDE,
  listSmsSendPlaceholderKeys,
  validateSmsSendVariables,
} from './validate-send'

const catalog = [
  {
    key: '방문 안내',
    enabled: true,
    requiresProgram: false,
    sourceMode: 'MANUAL_ALLOWED' as const,
  },
]

function recipient(
  id: string,
  phone: string,
  variables?: Record<string, string>,
  overrides: Partial<SmsSendRecipient> = {}
): SmsSendRecipient {
  return {
    id,
    participationType: '',
    memberType: '',
    name: id,
    phone,
    source: 'manual',
    actorType: 'DIRECT',
    ...(variables ? { variables } : {}),
    ...overrides,
  }
}

function check(
  recipients: SmsSendRecipient[],
  overrides: Partial<Parameters<typeof validateSmsSendVariables>[0]> = {}
) {
  return validateSmsSendVariables({
    programId: '',
    messageType: 'LMS',
    subject: '',
    bodyText: '#{방문 안내}',
    recipients,
    catalog,
    catalogState: 'ready',
    ...overrides,
  })
}

describe('validateSmsSendVariables', () => {
  it('변수값이 없는 수신자만 제외하고 나머지는 발송 대상에 남긴다', () => {
    const filled = recipient('1', '010-1111-2222', { '방문 안내': '오전' })
    const empty = recipient('2', '010-3333-4444', { '방문 안내': '  ' })
    const missing = recipient('3', '010-5555-6666')
    const result = check([filled, empty, missing])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients.map(item => item.id)).toEqual(['1'])
    expect(result.confirmMessage).toContain(SMS_SEND_CONFIRM_MESSAGE)
    expect(result.confirmMessage).toContain(SMS_VARIABLE_EXCLUSION_GUIDE)
    expect(empty.variables).toEqual({ '방문 안내': '  ' })
    expect(missing.variables).toBeUndefined()
  })

  it('전원 변수값이 없으면 발송 확인으로 넘어가지 않는다', () => {
    const result = check([recipient('1', '010-1111-2222')])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alert).toContain('발송할 수 있는 수신자가 없습니다.')
    expect(result.alert).toContain(SMS_VARIABLE_EXCLUSION_GUIDE)
  })

  it('프로그램 선택 시 회원 변수는 자동 매칭으로 보고 수기 값 누락으로 제외하지 않는다', () => {
    const member = recipient('actor-MEMBER-9', '010-1111-2222', undefined, {
      source: 'program',
      actorType: 'MEMBER',
      actorId: 9,
    })
    const result = check([member], {
      programId: '77',
      catalog: [{ key: '방문 안내', enabled: true, sourceMode: 'SERVER_RESOLVED' }],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients).toEqual([member])
    expect(result.confirmMessage).toBe(SMS_SEND_CONFIRM_MESSAGE)
  })

  it('발송 직전에 같은 번호를 다시 걸러 먼저 추가된 수신자를 남긴다', () => {
    const first = recipient('1', '010-1234-5678', { '방문 안내': '오전' }, { actorId: 1 })
    const duplicate = recipient('2', '01012345678', { '방문 안내': '오후' }, { actorId: 2 })
    const result = check([first, duplicate])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients).toEqual([first])
    expect(result.confirmMessage).toContain('같은 휴대폰 번호는 1건만 발송합니다.')
  })

  it('서버 예약 변수는 수기 값이 있어도 충족으로 보지 않는다', () => {
    const result = check([recipient('1', '010-1111-2222', { 프로그램명: '임의' })], {
      bodyText: '#{프로그램명}',
      catalog: [
        {
          key: '프로그램명',
          enabled: true,
          requiresProgram: true,
          sourceMode: 'EVENT_ONLY',
        },
      ],
    })
    expect(result.ok).toBe(false)
  })

  it('SMS 제목의 토큰은 사용 변수로 세지 않고 LMS 제목은 센다', () => {
    expect(
      listSmsSendPlaceholderKeys({
        messageType: 'SMS',
        subject: '#{방문 안내}',
        bodyText: '본문',
      })
    ).toEqual([])
    expect(
      listSmsSendPlaceholderKeys({
        messageType: 'LMS',
        subject: '#{방문 안내}',
        bodyText: '',
      })
    ).toEqual(['방문 안내'])
  })
})
