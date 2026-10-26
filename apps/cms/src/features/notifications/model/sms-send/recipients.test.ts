import { describe, expect, it } from 'vitest'
import {
  createManualRecipient,
  mergeSmsSendRecipients,
  normalizeSmsSendPhone,
  resolveSmsSendRecipientTypeMode,
  smsSendRecipientTypeColumnTitle,
  smsSendRecipientTypeLabel,
} from './recipients'
import type { SmsSendRecipient } from './types'

function recipient(overrides: Partial<SmsSendRecipient> = {}): SmsSendRecipient {
  return {
    id: '1',
    participationType: '',
    memberType: '',
    name: '홍길동',
    phone: '01012349507',
    source: 'program',
    ...overrides,
  }
}

describe('resolveSmsSendRecipientTypeMode', () => {
  it('uses participation types when a program is selected', () => {
    expect(resolveSmsSendRecipientTypeMode('77')).toBe('participation')
    expect(smsSendRecipientTypeColumnTitle('participation')).toBe('참여 유형')
  })

  it('uses member types when a program is not selected', () => {
    expect(resolveSmsSendRecipientTypeMode('')).toBe('member')
    expect(resolveSmsSendRecipientTypeMode('all')).toBe('member')
    expect(smsSendRecipientTypeColumnTitle('member')).toBe('회원 유형')
  })
})

describe('smsSendRecipientTypeLabel', () => {
  it('maps member types to FE labels when no program is selected', () => {
    expect(
      smsSendRecipientTypeLabel(recipient({ memberType: 'teacher_instructor' }), 'member')
    ).toBe('교사 겸 강사')
    expect(smsSendRecipientTypeLabel(recipient({ memberType: 'school_teacher' }), 'member')).toBe(
      '교사'
    )
  })

  it('maps participation types when a program is selected', () => {
    expect(
      smsSendRecipientTypeLabel(recipient({ participationType: 'participant' }), 'participation')
    ).toBe('참여자')
    expect(
      smsSendRecipientTypeLabel(recipient({ participationType: 'instructor' }), 'participation')
    ).toBe('강사')
    expect(
      smsSendRecipientTypeLabel(recipient({ participationType: 'volunteer' }), 'participation')
    ).toBe('봉사자')
  })
})

function member(id: number, phone: string, variables?: Record<string, string>): SmsSendRecipient {
  return {
    id: `actor-MEMBER-${id}`,
    participationType: 'participant',
    memberType: 'general',
    name: `회원${id}`,
    phone,
    source: 'program',
    actorType: 'MEMBER',
    actorId: id,
    ...(variables ? { variables } : {}),
  }
}

describe('mergeSmsSendRecipients phone dedupe', () => {
  it('회원 선택끼리 하이픈만 다른 번호를 1건으로 합치고 먼저 추가된 값을 유지한다', () => {
    const first = member(1, '010-1234-5678', { '방문 안내': '오전' })
    const merged = mergeSmsSendRecipients(
      [first],
      [member(2, '01012345678', { '방문 안내': '오후' })]
    )
    expect(merged).toEqual([first])
    expect(merged[0]?.actorId).toBe(1)
    expect(merged[0]?.variables).toEqual({ '방문 안내': '오전' })
  })

  it('회원 뒤에 같은 번호 직접 입력이 와도 actorId와 변수값을 덮지 않는다', () => {
    const current = member(4, '010-5555-6666')
    const manual = createManualRecipient('01055556666', '나중', { '방문 안내': '오후' })
    const merged = mergeSmsSendRecipients([current], [manual])
    expect(merged).toEqual([current])
    expect(merged[0]?.actorId).toBe(4)
    expect(merged[0]?.variables).toBeUndefined()
  })

  it('직접 입력 뒤에 같은 번호 회원이 와도 수기 값과 기존 행을 유지한다', () => {
    const manual = createManualRecipient('010-1234-5678', '직접', { '방문 안내': '오전' })
    const merged = mergeSmsSendRecipients([manual], [member(9, '01012345678')])
    expect(merged).toEqual([manual])
    expect(merged[0]?.actorId).toBeUndefined()
    expect(merged[0]?.variables).toEqual({ '방문 안내': '오전' })
  })

  it('마스킹된 번호는 서로 다른 수신자로 유지한다', () => {
    const merged = mergeSmsSendRecipients(
      [member(1, '010-****-5678')],
      [member(2, '010-****-5678')]
    )
    expect(merged.map(item => item.actorId)).toEqual([1, 2])
  })
})

describe('normalizeSmsSendPhone', () => {
  it('formats mixed raw numbers to hyphenated Korean mobile', () => {
    expect(normalizeSmsSendPhone('01012349507')).toBe('010-1234-9507')
    expect(normalizeSmsSendPhone('010-5764-9470')).toBe('010-5764-9470')
  })
})
