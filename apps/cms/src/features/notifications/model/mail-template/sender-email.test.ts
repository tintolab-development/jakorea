import { describe, expect, it } from 'vitest'
import {
  MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE,
  MAIL_SENDER_EMAIL_REQUIRED_MESSAGE,
  isAllowedMailSenderDomain,
  validateMailSenderEmail,
} from './sender-email'

describe('validateMailSenderEmail', () => {
  it('requires a non-empty email', () => {
    expect(validateMailSenderEmail('')).toBe(MAIL_SENDER_EMAIL_REQUIRED_MESSAGE)
    expect(validateMailSenderEmail('  ')).toBe(MAIL_SENDER_EMAIL_REQUIRED_MESSAGE)
  })

  it('rejects invalid shape', () => {
    expect(validateMailSenderEmail('not-an-email')).toBe('발신 메일 형식이 올바르지 않습니다.')
  })

  it('rejects domains outside the NHN allowlist', () => {
    expect(validateMailSenderEmail('user@gmail.com')).toBe(MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE)
  })

  it('accepts jakorea.org (and subdomains)', () => {
    expect(validateMailSenderEmail('gildong@jakorea.org')).toBeNull()
    expect(validateMailSenderEmail('noreply@mail.jakorea.org')).toBeNull()
    expect(isAllowedMailSenderDomain('a@jakorea.org')).toBe(true)
  })
})
