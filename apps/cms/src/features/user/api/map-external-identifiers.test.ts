import { describe, expect, it } from 'vitest'
import {
  assignUser1365IdFromDetailAndIdentifiers,
  detail1365Display,
  extract1365IdFromMemberPrivacyPayload,
  preferUnmasked1365Id,
  resolve1365IdFromExternalIdentifiers,
} from './map-external-identifiers'

describe('preferUnmasked1365Id', () => {
  it('마스킹되지 않은 원문을 우선한다', () => {
    expect(preferUnmasked1365Id('0915***', '0915123456', '0915***')).toBe('0915123456')
  })

  it('원문이 없으면 첫 non-empty(마스킹 포함)를 반환한다', () => {
    expect(preferUnmasked1365Id(undefined, '0915***')).toBe('0915***')
  })
})

describe('detail1365Display', () => {
  it('미해제일 때 원문을 FE 마스킹한다', () => {
    expect(detail1365Display('0915123456', false)).toBe('0915***')
  })

  it('해제 후에는 원문을 그대로 보여준다', () => {
    expect(detail1365Display('0915123456', true)).toBe('0915123456')
  })

  it('이미 BE 마스킹이면 미해제 시 그대로 둔다', () => {
    expect(detail1365Display('0915***', false)).toBe('0915***')
  })
})

describe('assignUser1365IdFromDetailAndIdentifiers', () => {
  it('상세 external1365Id가 있으면 identifiers 마스킹으로 덮지 않는다', () => {
    const user: { id1365?: string } = {}
    assignUser1365IdFromDetailAndIdentifiers(user, '0915123456', [
      { provider: 'VOLUNTEER_1365', externalIdMasked: '0915***' },
    ])
    expect(user.id1365).toBe('0915123456')
  })

  it('상세에 없을 때만 identifiers 값을 쓴다', () => {
    const user: { id1365?: string } = {}
    assignUser1365IdFromDetailAndIdentifiers(user, undefined, [
      { provider: 'VOLUNTEER_1365', externalIdMasked: '0915***' },
    ])
    expect(user.id1365).toBe('0915***')
  })
})

describe('resolve1365IdFromExternalIdentifiers', () => {
  it('상세 원문이 있으면 externalIdMasked보다 우선한다', () => {
    const resolved = resolve1365IdFromExternalIdentifiers(
      [{ provider: 'VOLUNTEER_1365', externalIdMasked: '0915***' }],
      '0915123456'
    )
    expect(resolved).toBe('0915123456')
  })

  it('런타임 externalId 원문을 우선한다', () => {
    const resolved = resolve1365IdFromExternalIdentifiers(
      [
        {
          provider: 'VOLUNTEER_1365',
          externalIdMasked: '0915***',
          externalId: '0915123456',
        } as { provider: string; externalIdMasked: string; externalId: string },
      ],
      undefined
    )
    expect(resolved).toBe('0915123456')
  })
})

describe('extract1365IdFromMemberPrivacyPayload', () => {
  it('individual unmask member.external1365Id 원문을 꺼낸다', () => {
    expect(
      extract1365IdFromMemberPrivacyPayload({
        member: { external1365Id: '0915123456' },
      })
    ).toBe('0915123456')
  })
})
