import { describe, expect, it } from 'vitest'
import { isAllowedMailSenderDomain, validateMailSenderEmail } from './sender-email'

describe('validateMailSenderEmail', () => {
  it('requires a non-empty email', () => {
    expect(validateMailSenderEmail('')).toBe('발신 메일을 입력하세요.')
    expect(validateMailSenderEmail('  ')).toBe('발신 메일을 입력하세요.')
  })

  it('rejects invalid shape', () => {
    expect(validateMailSenderEmail('not-an-email')).toBe('발신 메일 형식이 올바르지 않습니다.')
  })

  it('rejects domains outside the NHN allowlist', () => {
    expect(validateMailSenderEmail('user@gmail.com')).toBe(
      'NHN에 등록된 발신 메일 도메인만 사용할 수 있습니다.'
    )
  })

  it('accepts jakorea.org (and subdomains)', () => {
    expect(validateMailSenderEmail('gildong@jakorea.org')).toBeNull()
    expect(validateMailSenderEmail('noreply@mail.jakorea.org')).toBeNull()
    expect(isAllowedMailSenderDomain('a@jakorea.org')).toBe(true)
  })
})
