import { describe, expect, it } from 'vitest'
import {
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

describe('normalizeSmsSendPhone', () => {
  it('formats mixed raw numbers to hyphenated Korean mobile', () => {
    expect(normalizeSmsSendPhone('01012349507')).toBe('010-1234-9507')
    expect(normalizeSmsSendPhone('010-5764-9470')).toBe('010-5764-9470')
  })
})
