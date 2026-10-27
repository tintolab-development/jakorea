import { describe, expect, it } from 'vitest'
import {
  classifyAlimtalkPlaceholderKey,
  collectAlimtalkRecipientVariableGaps,
  isAlimtalkSystemVariableKey,
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

  it('FE-VAR-14 프로그램 미선택의 requiresProgram 변수는 needs-program이다', () => {
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
    ).toBe('needs-program')
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

  it('AT-04 프로그램 미선택의 서버 예약·SYSTEM 변수는 수기 전송 대상이 아니다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '프로그램명',
        catalog: [{ key: '프로그램명', enabled: true, requiresProgram: true }],
        recipient: member,
        programSelected: false,
      })
    ).toBe('needs-program')
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

  it('카탈로그에 없는 키는 프로그램 미선택에서 직접 입력이다', () => {
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

  it('FE-VAR-13 카탈로그 미로드는 pending이다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: null,
        recipient: member,
        programSelected: true,
      })
    ).toBe('pending')
  })

  it('FE-VAR-09 enabled=false 프로그램 문맥 변수는 우회하지 않는다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '프로그램명',
        catalog: [{ key: '프로그램명', enabled: false, requiresProgram: true }],
        recipient: member,
        programSelected: true,
      })
    ).toBe('blocked')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '담당교사명',
        catalog: [{ key: '담당교사명', enabled: false, requiresProgram: true }],
        recipient: member,
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('FE-VAR-04 개인 참여자에서 교사 전용 변수는 차단한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '담당교사명',
        catalog: [{ key: '담당교사명', enabled: false, requiresProgram: true }],
        recipient: { ...member, participationType: 'participant', memberType: 'general' },
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('FE-VAR-05 교사 회원에서 허용된 담당교사 변수는 서버 치환이다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '담당교사명',
        catalog: [{ key: '담당교사명', enabled: true, requiresProgram: true }],
        recipient: { ...member, memberType: 'school_teacher' },
        programSelected: true,
      })
    ).toBe('server')
  })

  it('FE-VAR-06 UJAT 상반기·하반기는 catalog.enabled만 따른다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: 'UJAT 상반기 봉사자 모집 기간',
        catalog: [
          { key: 'UJAT 상반기 봉사자 모집 기간', enabled: true, requiresProgram: true },
          { key: 'UJAT 하반기 봉사자 모집 기간', enabled: false, requiresProgram: true },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('server')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: 'UJAT 하반기 봉사자 모집 기간',
        catalog: [
          { key: 'UJAT 상반기 봉사자 모집 기간', enabled: true, requiresProgram: true },
          { key: 'UJAT 하반기 봉사자 모집 기간', enabled: false, requiresProgram: true },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('FE-VAR-07 SYSTEM 변수는 차단한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '휴면 전환일시',
        catalog: [{ key: '휴면 전환일시', categoryCode: 'SYSTEM', enabled: false }],
        recipient: member,
        programSelected: true,
      })
    ).toBe('blocked')
    expect(
      isAlimtalkSystemVariableKey('휴면 전환일시', [
        { key: '휴면 전환일시', categoryCode: 'SYSTEM' },
      ])
    ).toBe(true)
  })

  it('FE-VAR-08 프로그램 수료 현황 STATUS는 사용 가능하다', () => {
    expect(
      isAlimtalkSystemVariableKey('프로그램 수료 현황', [
        { key: '프로그램 수료 현황', categoryCode: 'STATUS', enabled: true },
      ])
    ).toBe(false)
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '프로그램 수료 현황',
        catalog: [
          {
            key: '프로그램 수료 현황',
            categoryCode: 'STATUS',
            enabled: true,
            requiresProgram: true,
          },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('server')
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
