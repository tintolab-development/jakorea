import { describe, expect, it } from 'vitest'
import { collectTemplatePlaceholderKeys } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
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
    catalog: [{ key: '방문 안내', enabled: true, sourceMode: 'MANUAL_ALLOWED' }],
    catalogState: 'ready',
    ...overrides,
  }
}

describe('validateAlimtalkSendRequest', () => {
  it('AT-06 값이 있는 수신자만 발송 후보가 되고 누락 수신자는 목록에 남는다', () => {
    const recipients = [
      ...Array.from({ length: 8 }, (_, index) =>
        recipient(String(index + 1), { '방문 안내': `값${index + 1}` })
      ),
      recipient('9'),
      recipient('10', { '방문 안내': '  ' }),
    ]
    const result = validateAlimtalkSendRequest(input({ recipients }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.validRecipients).toHaveLength(8)
    expect(result.validRecipients.map(item => item.id)).toEqual(
      Array.from({ length: 8 }, (_, index) => String(index + 1))
    )
    expect(result.confirmMessage).toContain('변수 조건이 맞지 않는 수신자 2명은 이번 발송에서 제외됩니다.')
    expect(result.confirmMessage).toContain('조건을 충족한 수신자 8명만 발송합니다.')
    expect(result.confirmMessage).toContain('방문 안내')
    expect(result.confirmMessage).toContain('제외하고 발송할까요?')
    expect(JSON.parse(result.fingerprint).excludedIds).toEqual(['9', '10'])
    expect(recipients).toHaveLength(10)
    expect(recipients[8]?.variables).toBeUndefined()
    expect(recipients[9]?.variables).toEqual({ '방문 안내': '  ' })
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
    const profileChanged = validateAlimtalkSendRequest(input({ senderProfileId: 99 }))
    const excludedRemoved = validateAlimtalkSendRequest(
      input({
        recipients: [
          recipient('1', { '방문 안내': '오전' }),
          recipient('2'),
        ],
      })
    )
    const excludedKept = validateAlimtalkSendRequest(
      input({
        recipients: [
          recipient('1', { '방문 안내': '오전' }),
          recipient('2'),
        ],
      })
    )
    expect(first.ok && changed.ok && profileChanged.ok && excludedRemoved.ok && excludedKept.ok).toBe(
      true
    )
    if (
      !first.ok ||
      !changed.ok ||
      !profileChanged.ok ||
      !excludedRemoved.ok ||
      !excludedKept.ok
    ) {
      return
    }
    expect(first.fingerprint).not.toBe(changed.fingerprint)
    expect(first.fingerprint).not.toBe(profileChanged.fingerprint)
    expect(JSON.parse(excludedRemoved.fingerprint).excludedIds).toEqual(['2'])
    expect(excludedRemoved.fingerprint).toBe(excludedKept.fingerprint)
    expect(first.fingerprint).not.toBe(excludedRemoved.fingerprint)
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

  it('FE-VAR-15 예약 발송은 미래 시각이 있으면 통과한다', () => {
    const result = validateAlimtalkSendRequest(
      input({
        sendTiming: 'scheduled',
        scheduledAt: '2099-01-01T00:00:00.000Z',
        nowMs: Date.parse('2026-09-09T00:00:00.000Z'),
      })
    )
    expect(result.ok).toBe(true)
  })

  it('R7-FE-11 알림 링크 경로 값이 없으면 발송하지 않는다', () => {
    const result = validateAlimtalkSendRequest(
      input({
        placeholderKeys: ['알림 링크 경로'],
        catalog: [
          {
            key: '알림 링크 경로',
            enabled: true,
            requiresProgram: false,
            sourceMode: 'MANUAL_ALLOWED',
          },
        ],
        recipients: [recipient('1')],
      })
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alert).toContain('알림 링크 경로')
  })

  it('R7-FE-11 허용되지 않는 링크는 발송하지 않는다', () => {
    const result = validateAlimtalkSendRequest(
      input({
        placeholderKeys: ['알림 링크 경로'],
        catalog: [
          {
            key: '알림 링크 경로',
            enabled: true,
            requiresProgram: false,
            sourceMode: 'MANUAL_ALLOWED',
          },
        ],
        recipients: [recipient('1', { '알림 링크 경로': 'javascript:alert(1)' })],
      })
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alert).toContain('허용되지 않는 링크')
  })

  it('R8 퀵리플라이에서 추출한 링크 변수를 발송 검증에 연결한다', () => {
    const catalog = [
      {
        key: '알림 링크 경로',
        enabled: true,
        requiresProgram: false,
        sourceMode: 'MANUAL_ALLOWED' as const,
      },
    ]
    const placeholderKeys = collectTemplatePlaceholderKeys({
      content: '본문에는 변수 없음',
      quickLinks: [{ name: '바로가기', destinations: { pc: '/#{알림 링크 경로}', mobile: '/#{알림 링크 경로}' } }],
    })
    expect([...placeholderKeys]).toEqual(['알림 링크 경로'])
    const ok = validateAlimtalkSendRequest(
      input({
        placeholderKeys,
        catalog,
        recipients: [recipient('1', { '알림 링크 경로': '/mypage/lectures' })],
      })
    )
    expect(ok.ok).toBe(true)
    const blocked = validateAlimtalkSendRequest(
      input({
        placeholderKeys,
        catalog,
        recipients: [recipient('1', { '알림 링크 경로': '/a/../../etc' })],
      })
    )
    expect(blocked.ok).toBe(false)
  })

  it('FE-VAR-13 카탈로그 pending이면 발송하지 않는다', () => {
    const result = validateAlimtalkSendRequest(input({ catalogState: 'pending', catalog: null }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alert).toContain('변수 목록을 확인한 뒤 발송할 수 있습니다.')
  })

  it('제외 대상의 입력값이 바뀌면 이전 확인 지문으로 발송할 수 없다', () => {
    const withGap = [
      recipient('1', { '방문 안내': '오전' }),
      recipient('2', { '방문 안내': '' }),
    ]
    const first = validateAlimtalkSendRequest(input({ recipients: withGap }))
    const filled = validateAlimtalkSendRequest(
      input({
        recipients: [
          recipient('1', { '방문 안내': '오전' }),
          recipient('2', { '방문 안내': '오후' }),
        ],
      })
    )
    expect(first.ok && filled.ok).toBe(true)
    if (!first.ok || !filled.ok) return
    expect(first.validRecipients).toHaveLength(1)
    expect(filled.validRecipients).toHaveLength(2)
    expect(first.fingerprint).not.toBe(filled.fingerprint)
  })
})
