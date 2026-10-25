import { describe, expect, it } from 'vitest'
import type { AlimtalkSendRecipient } from './types'
import { validateAlimtalkSendRequest, type AlimtalkSendValidationInput } from './validate-send'

function recipient(
  id: string,
  variables?: Record<string, string>
): AlimtalkSendRecipient {
  return {
    id,
    participationType: '',
    name: id,
    phone: `010-0000-${id.padStart(4, '0').slice(-4)}`,
    source: 'manual',
    actorType: 'DIRECT',
    ...(variables ? { variables } : {}),
  }
}

function input(overrides: Partial<AlimtalkSendValidationInput> = {}): AlimtalkSendValidationInput {
  return {
    senderSelected: true,
    senderKey: 'sender',
    templateId: '10',
    templateName: '템플릿',
    approvalStatus: 'APPROVED',
    sendTiming: 'immediate',
    scheduledAt: null,
    recipients: [recipient('1', { '방문 안내': '오전' })],
    placeholderKeys: ['방문 안내'],
    catalog: [{ key: '방문 안내', enabled: true }],
    catalogState: 'ready',
    ...overrides,
  }
}

describe('validateAlimtalkSendRequest', () => {
  it('AT-06 값이 있는 수신자만 발송 후보가 되고 누락 수신자는 목록에 남는다', () => {
    const recipients = [recipient('1', { '방문 안내': '오전' }), recipient('2')]
    const result = validateAlimtalkSendRequest(input({ recipients }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients.map(item => item.id)).toEqual(['1'])
    expect(result.confirmMessage).toContain('2')
    expect(result.confirmMessage).toContain('방문 안내')
    expect(result.confirmMessage).toContain('제외하고 발송할까요?')
    expect(recipients).toHaveLength(2)
    expect(recipients[1]?.variables).toBeUndefined()
  })

  it('AT-07 유효 수신자가 없으면 발송 확인으로 넘어가지 않는다', () => {
    const result = validateAlimtalkSendRequest(
      input({ recipients: [recipient('1'), recipient('2', { '방문 안내': '   ' })] })
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alert).toContain('발송할 수 있는 수신자가 없습니다.')
  })

  it('AT-11 승인 상태가 없으면 발송할 수 없다', () => {
    for (const approvalStatus of [null, undefined, 'PENDING', 'UNKNOWN'] as const) {
      const result = validateAlimtalkSendRequest(input({ approvalStatus }))
      expect(result.ok).toBe(false)
    }
  })

  it('AT-12 확인 이후 값이 바뀌면 지문이 달라져 이전 확인으로 보낼 수 없다', () => {
    const first = validateAlimtalkSendRequest(input())
    const changed = validateAlimtalkSendRequest(
      input({ recipients: [recipient('1', { '방문 안내': '오후' })] })
    )
    const emptied = validateAlimtalkSendRequest(input({ recipients: [recipient('1')] }))
    expect(first.ok && changed.ok).toBe(true)
    if (!first.ok || !changed.ok) return
    expect(first.fingerprint).not.toBe(changed.fingerprint)
    expect(emptied.ok).toBe(false)
  })

  it('AT-13 빈 값은 발송 후보에 포함되지 않는다', () => {
    const result = validateAlimtalkSendRequest(
      input({
        recipients: [recipient('1', { '방문 안내': '' }), recipient('2', { '방문 안내': '있음' })],
      })
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients.map(item => item.variables)).toEqual([{ '방문 안내': '있음' }])
  })

  it('AT-16 변수 카탈로그 조회 실패는 발송을 막는다', () => {
    const result = validateAlimtalkSendRequest(input({ catalogState: 'error', catalog: null }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alert).toContain('변수 목록을 불러오지 못했습니다. 다시 시도해 주세요.')
  })

  it('수신자가 없으면 발송하지 않는다', () => {
    const result = validateAlimtalkSendRequest(input({ recipients: [], placeholderKeys: [] }))
    expect(result.ok).toBe(false)
  })
})
