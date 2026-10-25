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

const enabledVisit = [
  { key: '방문 안내', enabled: true, requiresProgram: false },
]

describe('classifyAlimtalkPlaceholderKey', () => {
  it('AT-01 프로그램 미선택 회원은 일반 활성 변수를 수기 입력한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: enabledVisit,
        recipient: member,
        programSelected: false,
      })
    ).toBe('manual')
  })

  it('AT-02 프로그램 미선택 직접 입력도 일반 변수를 수기 입력한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: enabledVisit,
        recipient: direct,
        programSelected: false,
      })
    ).toBe('manual')
  })

  it('AT-03 프로그램 미선택의 requiresProgram 일반 변수는 수기 입력이다', () => {
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
        recipient: member,
        programSelected: false,
      })
    ).toBe('manual')
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
    ).toBe('manual')
  })

  it('AT-04 프로그램 미선택의 서버 예약 변수는 수기 전송 대상이 아니다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '프로그램명',
        catalog: [{ key: '프로그램명', enabled: true, requiresProgram: true }],
        recipient: member,
        programSelected: false,
      })
    ).toBe('blocked')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '휴면 전환일시',
        catalog: [],
        recipient: member,
        programSelected: false,
      })
    ).toBe('blocked')
    expect(
      pickAlimtalkRecipientSendVariables({
        recipient: {
          ...member,
          variables: { 프로그램명: '임의', '휴면 전환일시': '2026-01-01' },
        },
        keys: ['프로그램명', '휴면 전환일시'],
        catalog: [{ key: '프로그램명', enabled: true, requiresProgram: true }],
        programSelected: false,
      })
    ).toBeUndefined()
  })

  it('AT-05 프로그램 선택의 허용 변수는 회원 자동 매칭을 유지한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: enabledVisit,
        recipient: member,
        programSelected: true,
      })
    ).toBe('server')
    expect(
      pickAlimtalkRecipientSendVariables({
        recipient: { ...member, variables: { '방문 안내': '덮어쓰면 안 됨' } },
        keys: ['방문 안내'],
        catalog: enabledVisit,
        programSelected: true,
      })
    ).toBeUndefined()
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

  it('회원 신원 키는 프로그램 없이도 서버 치환이고 payload에 넣지 않는다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '회원명',
        catalog: [{ key: '회원명', enabled: true }],
        recipient: member,
        programSelected: false,
      })
    ).toBe('server')
    expect(
      pickAlimtalkRecipientSendVariables({
        recipient: { ...member, variables: { 회원명: '홍길동' } },
        keys: ['회원명'],
        catalog: [{ key: '회원명', enabled: true }],
        programSelected: false,
      })
    ).toBeUndefined()
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

  it('AT-15 현재 템플릿에 없는 이전 변수값은 payload에 실리지 않는다', () => {
    const sent = pickAlimtalkRecipientSendVariables({
      recipient: { ...direct, variables: { 안내문: '오전', '다른 안내': '유지' } },
      keys: ['다른 안내'],
      catalog: [],
      programSelected: false,
    })
    expect(sent).toEqual({ '다른 안내': '유지' })
    expect(direct.variables).toBeUndefined()
  })
})
