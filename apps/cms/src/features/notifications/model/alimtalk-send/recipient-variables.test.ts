import { describe, expect, it } from 'vitest'
import {
  classifyAlimtalkPlaceholderKey,
  collectAlimtalkRecipientVariableGaps,
  isAlimtalkSystemVariableKey,
  isUnsafeAlimtalkManualLinkValue,
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

const manualVisit = [
  {
    key: '방문 안내',
    enabled: true,
    requiresProgram: false,
    sourceMode: 'MANUAL_ALLOWED' as const,
  },
]

const serverVisit = [
  {
    key: '방문 안내',
    enabled: true,
    requiresProgram: false,
    sourceMode: 'SERVER_RESOLVED' as const,
  },
]

describe('classifyAlimtalkPlaceholderKey', () => {
  it('AT-01 프로그램 미선택 회원은 일반 활성 변수를 수기 입력한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: manualVisit,
        recipient: member,
        programSelected: false,
      })
    ).toBe('manual')
  })

  it('AT-02 프로그램 미선택 직접 입력도 일반 변수를 수기 입력한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: manualVisit,
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
            sourceMode: 'SERVER_RESOLVED',
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
            sourceMode: 'SERVER_RESOLVED',
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
        catalog: [{ key: '프로그램명', enabled: true, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' }],
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
        catalog: [{ key: '프로그램명', enabled: true, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' }],
        programSelected: false,
      })
    ).toBeUndefined()
  })

  it('AT-05 프로그램 선택의 허용 변수는 회원 자동 매칭을 유지한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: serverVisit,
        recipient: member,
        programSelected: true,
      })
    ).toBe('server')
    expect(
      pickAlimtalkRecipientSendVariables({
        recipient: { ...member, variables: { '방문 안내': '덮어쓰면 안 됨' } },
        keys: ['방문 안내'],
        catalog: serverVisit,
        programSelected: true,
      })
    ).toBeUndefined()
  })

  it('R7-FE-01 카탈로그 미등록 키는 프로그램 미선택에서도 차단한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '안내문',
        catalog: [],
        recipient: direct,
        programSelected: false,
      })
    ).toBe('blocked')
  })

  it('R7-FE-02 카탈로그 미등록 키는 프로그램 선택에서도 차단한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '알림 링크 경로',
        catalog: serverVisit,
        recipient: direct,
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('R7-FE-03/04 알림 링크 경로는 카탈로그 활성이면 DIRECT 수기다', () => {
    const catalog = [
      {
        key: '알림 링크 경로',
        enabled: true,
        requiresProgram: false,
        sourceMode: 'MANUAL_ALLOWED' as const,
      },
    ]
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '알림 링크 경로',
        catalog,
        recipient: direct,
        programSelected: false,
      })
    ).toBe('manual')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '알림 링크 경로',
        catalog,
        recipient: direct,
        programSelected: true,
      })
    ).toBe('manual')
    expect(
      pickAlimtalkRecipientSendVariables({
        recipient: { ...direct, variables: { '알림 링크 경로': '/mypage' } },
        keys: ['알림 링크 경로'],
        catalog,
        programSelected: true,
      })
    ).toEqual({ '알림 링크 경로': '/mypage' })
    expect(
      pickAlimtalkRecipientSendVariables({
        recipient: { ...direct, variables: { '알림 링크 경로': 'javascript:alert(1)' } },
        keys: ['알림 링크 경로'],
        catalog,
        programSelected: true,
      })
    ).toBeUndefined()
  })

  it('R7-FE-09 등록 회원 SERVER_RESOLVED 신원 키는 프로그램 없이도 서버 치환이고 payload에 넣지 않는다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '회원명',
        catalog: [{ key: '회원명', enabled: true, sourceMode: 'SERVER_RESOLVED' }],
        recipient: member,
        programSelected: false,
      })
    ).toBe('server')
    expect(
      pickAlimtalkRecipientSendVariables({
        recipient: { ...member, variables: { 회원명: '홍길동' } },
        keys: ['회원명'],
        catalog: [{ key: '회원명', enabled: true, sourceMode: 'SERVER_RESOLVED' }],
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
        catalog: [{ key: '프로그램명', enabled: false, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' }],
        recipient: member,
        programSelected: true,
      })
    ).toBe('blocked')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '담당교사명',
        catalog: [{ key: '담당교사명', enabled: false, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' }],
        recipient: member,
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('FE-VAR-04 개인 참여자에서 교사 전용 변수는 차단한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '담당교사명',
        catalog: [{ key: '담당교사명', enabled: false, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' }],
        recipient: { ...member, participationType: 'participant', memberType: 'general' },
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('FE-VAR-05 교사 회원에서 허용된 담당교사 변수는 서버 치환이다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '담당교사명',
        catalog: [{ key: '담당교사명', enabled: true, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' }],
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
          { key: 'UJAT 상반기 봉사자 모집 기간', enabled: true, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' },
          { key: 'UJAT 하반기 봉사자 모집 기간', enabled: false, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('server')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: 'UJAT 하반기 봉사자 모집 기간',
        catalog: [
          { key: 'UJAT 상반기 봉사자 모집 기간', enabled: true, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' },
          { key: 'UJAT 하반기 봉사자 모집 기간', enabled: false, requiresProgram: true, sourceMode: 'SERVER_RESOLVED' },
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
            sourceMode: 'SERVER_RESOLVED',
          },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('server')
  })

  it('sourceMode=EVENT_ONLY는 categoryCode가 SYSTEM이 아니어도 차단한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '이벤트 전용 키',
        catalog: [
          {
            key: '이벤트 전용 키',
            categoryCode: 'STATUS',
            enabled: true,
            sourceMode: 'EVENT_ONLY',
          },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('sourceMode 누락은 SYSTEM 레거시가 아니면 fail-closed다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '방문 안내',
        catalog: [{ key: '방문 안내', enabled: true, requiresProgram: false }],
        recipient: member,
        programSelected: false,
      })
    ).toBe('blocked')
  })

  it('추가 MANUAL_ALLOWED 키도 서버로 재분류하지 않는다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '추가 수동 경로',
        catalog: [
          {
            key: '추가 수동 경로',
            enabled: true,
            requiresProgram: false,
            sourceMode: 'MANUAL_ALLOWED',
          },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('manual')
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '추가 수동 경로',
        catalog: [
          {
            key: '추가 수동 경로',
            enabled: true,
            requiresProgram: false,
            sourceMode: 'MANUAL_ALLOWED',
          },
        ],
        recipient: direct,
        programSelected: false,
      })
    ).toBe('manual')
  })

  it('MANUAL_ALLOWED는 회원·프로그램 선택에서도 서버로 재분류하지 않는다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '알림 링크 경로',
        catalog: [
          {
            key: '알림 링크 경로',
            enabled: true,
            requiresProgram: false,
            sourceMode: 'MANUAL_ALLOWED',
          },
        ],
        recipient: member,
        programSelected: true,
      })
    ).toBe('manual')
  })

  it('내부 경로만 허용하고 외부 URL은 차단한다', () => {
    expect(isUnsafeAlimtalkManualLinkValue('/mypage/activities')).toBe(false)
    expect(isUnsafeAlimtalkManualLinkValue('javascript:alert(1)')).toBe(true)
    expect(isUnsafeAlimtalkManualLinkValue('data:text/html,x')).toBe(true)
    expect(isUnsafeAlimtalkManualLinkValue('https://evil.example/phish')).toBe(true)
  })
})

describe('collectAlimtalkRecipientVariableGaps', () => {
  const noticeCatalog = [
    { key: '안내문', enabled: true, requiresProgram: false, sourceMode: 'MANUAL_ALLOWED' as const },
  ]

  it('값이 비어 있는 직접 입력 변수만 누락으로 본다', () => {
    const gaps = collectAlimtalkRecipientVariableGaps({
      keys: ['안내문'],
      catalog: noticeCatalog,
      programSelected: false,
      recipients: [
        { ...direct, variables: { 안내문: '   ' } },
        { ...member, id: 'actor-MEMBER-8', actorId: 8 },
      ],
    })
    expect(gaps.map(gap => gap.id)).toEqual(['manual-1', 'actor-MEMBER-8'])
    expect(gaps.every(gap => gap.manualMissing.includes('안내문'))).toBe(true)
  })

  it('R7-FE-10 혼합 수신자는 회원 SERVER_RESOLVED 신원과 DIRECT 차단을 나눈다', () => {
    const gaps = collectAlimtalkRecipientVariableGaps({
      keys: ['회원명'],
      catalog: [{ key: '회원명', enabled: true, sourceMode: 'SERVER_RESOLVED' }],
      programSelected: true,
      recipients: [
        member,
        { ...direct, id: 'manual-2', variables: {} },
      ],
    })
    expect(gaps.map(gap => gap.id)).toEqual(['manual-2'])
    expect(gaps[0]?.blocked).toEqual(['회원명'])
  })

  it('채워진 값은 누락이 아니고 빈 문자열로 대체하지 않는다', () => {
    const sent = pickAlimtalkRecipientSendVariables({
      recipient: { ...direct, variables: { 안내문: '  오후  ', '휴면 전환일시': '2026-01-01' } },
      keys: ['안내문', '휴면 전환일시'],
      catalog: noticeCatalog,
      programSelected: false,
    })
    expect(sent).toEqual({ 안내문: '오후' })
  })

  it('AT-15 현재 템플릿에 없는 이전 변수값은 payload에 실리지 않는다', () => {
    const sent = pickAlimtalkRecipientSendVariables({
      recipient: { ...direct, variables: { 안내문: '오전', '다른 안내': '유지' } },
      keys: ['다른 안내'],
      catalog: [
        { key: '안내문', enabled: true, sourceMode: 'MANUAL_ALLOWED' },
        { key: '다른 안내', enabled: true, sourceMode: 'MANUAL_ALLOWED' },
      ],
      programSelected: false,
    })
    expect(sent).toEqual({ '다른 안내': '유지' })
    expect(direct.variables).toBeUndefined()
  })

  it('R7-FE-11 필수 수기값이 없으면 발송 갭이다', () => {
    const gaps = collectAlimtalkRecipientVariableGaps({
      keys: ['알림 링크 경로'],
      catalog: [
        {
          key: '알림 링크 경로',
          enabled: true,
          requiresProgram: false,
          sourceMode: 'MANUAL_ALLOWED',
        },
      ],
      programSelected: true,
      recipients: [direct],
    })
    expect(gaps[0]?.manualMissing).toEqual(['알림 링크 경로'])
  })

  it('R7-FE-09 DIRECT는 회원 신원 서버 경로가 없어 차단한다', () => {
    expect(
      classifyAlimtalkPlaceholderKey({
        key: '회원명',
        catalog: [{ key: '회원명', enabled: true, sourceMode: 'SERVER_RESOLVED' }],
        recipient: direct,
        programSelected: true,
      })
    ).toBe('blocked')
  })

  it('허용되지 않는 링크는 값 없음과 구분한다', () => {
    const gaps = collectAlimtalkRecipientVariableGaps({
      keys: ['알림 링크 경로'],
      catalog: [
        {
          key: '알림 링크 경로',
          enabled: true,
          requiresProgram: false,
          sourceMode: 'MANUAL_ALLOWED',
        },
      ],
      programSelected: true,
      recipients: [{ ...direct, variables: { '알림 링크 경로': 'javascript:alert(1)' } }],
    })
    expect(gaps[0]?.unsafeManual).toEqual(['알림 링크 경로'])
    expect(gaps[0]?.manualMissing).toEqual([])
  })
})
