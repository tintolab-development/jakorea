import { describe, expect, it } from 'vitest'
import { validateApplicationGiveUpReason } from './application-give-up'

describe('validateApplicationGiveUpReason', () => {
  it('rejects shorter than 2 characters', () => {
    expect(validateApplicationGiveUpReason('a')).toMatch(/2자 이상/)
    expect(validateApplicationGiveUpReason('  ')).toMatch(/2자 이상/)
  })

  it('accepts 2 through 500 characters', () => {
    expect(validateApplicationGiveUpReason('ab')).toBeNull()
    expect(validateApplicationGiveUpReason('a'.repeat(500))).toBeNull()
  })

  it('rejects longer than 500 characters', () => {
    expect(validateApplicationGiveUpReason('a'.repeat(501))).toMatch(/500자/)
  })

  it('TT 활동 포기는 1 through 1000 characters를 허용한다', () => {
    expect(validateApplicationGiveUpReason('a', { minLength: 1, maxLength: 1000 })).toBeNull()
    expect(
      validateApplicationGiveUpReason('a'.repeat(1000), { minLength: 1, maxLength: 1000 })
    ).toBeNull()
    expect(
      validateApplicationGiveUpReason('a'.repeat(1001), { minLength: 1, maxLength: 1000 })
    ).toMatch(/1000자/)
  })
})
