import { describe, expect, it } from 'vitest'
import {
  classifyAlimtalkPlaceholderKey,
  collectAlimtalkRecipientVariableGaps,
  pickAlimtalkRecipientSendVariables,
} from './recipient-variables'
import type { AlimtalkSendRecipient } from './types'

const direct: AlimtalkSendRecipient = {
  id: 'manual-1',
  participationType: '',
  name: '직접',
  phone: '010-0000-0000',
  source: 'manual',
  actorType: 'DIRECT',
}

const member: AlimtalkSendRecipient = {
  id: 'actor-MEMBER-9',
  participationType: 'participant',
  name: '회원',
  phone: '010-1111-2222',
  source: 'program',
  actorType: 'MEMBER',
  actorId: 9,
}

describe('classifyAlimtalkPlaceholderKey', () => {
  it('SYSTEM 키는 회원은 서버, 직접 입력은 발송 불가다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '휴면 전환일시',
        catalog: [],
        recipient: member,
        programSelected: false,
      })
    ).toBe('server')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '휴면 전환일시',
        catalog: [],
        recipient: direct,
        programSelected: false,
      })
    ).toBe('blocked')
  })

  it('카탈로그에 없는 키는 직접 입력이다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '안내문',
        catalog: [],
        recipient: direct,
        programSelected: false,
      })
    ).toBe('manual')
  })

  it('requiresProgram 키는 프로그램이 없으면 프로그램 선택이 필요하다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '교육 진행 수업 시간',
        catalog: [
          {
            key: '교육 진행 수업 시간',
            requiresProgram: true,
            enabled: false,
          },
        ],
        recipient: direct,
        programSelected: false,
      })
    ).toBe('needs-program')
  })
})

describe('collectAlimtalkRecipientVariableGaps', () => {
  it('값이 비어 있는 직접 입력 변수만 누락으로 본다', () => {
    const gaps = collectAlimtalkRecipientVariableGaps({
      keys: ['안내문'],
      catalog: [],
      programSelected: false,
      recipients: [
        { ...direct, variables: { 안내문: '   ' } },
        { ...member, id: 'actor-MEMBER-8', actorId: 8 },
      ],
    })
    expect(gaps.map(gap => gap.id)).toEqual(['manual-1', 'actor-MEMBER-8'])
    expect(gaps.every(gap => gap.manualMissing.includes('안내문'))).toBe(true)
  })

  it('채워진 값은 누락이 아니고 빈 문자열로 대체하지 않는다', () => {
    const sent = pickAlimtalkRecipientSendVariables({
      recipient: { ...direct, variables: { 안내문: '  오후  ', '휴면 전환일시': '2026-01-01' } },
      keys: ['안내문', '휴면 전환일시'],
      catalog: [],
      programSelected: false,
    })
    expect(sent).toEqual({ 안내문: '오후' })
  })
})
