import { describe, expect, it } from 'vitest'
import {
  MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE,
  MAIL_SENDER_EMAIL_REQUIRED_MESSAGE,
  MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL,
  findHarvestedMailSenderKey,
  isAllowedMailSenderDomain,
  isHarvestedMailSenderEmail,
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

  it('rejects domains outside the NHN allowlist when profiles are absent', () => {
    expect(validateMailSenderEmail('user@gmail.com')).toBe(MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE)
  })

  it('accepts jakorea.org (and subdomains) when profiles are absent', () => {
    expect(validateMailSenderEmail('gildong@jakorea.org')).toBeNull()
    expect(validateMailSenderEmail('noreply@mail.jakorea.org')).toBeNull()
    expect(validateMailSenderEmail(MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL)).toBeNull()
    expect(isAllowedMailSenderDomain('a@jakorea.org')).toBe(true)
  })

  it('matches BE harvest rule when sender profiles exist', () => {
    const harvested = ['jakorea@jakorea.org', 'noreply.sandbox@jakorea.org']
    expect(validateMailSenderEmail('jakorea@jakorea.org', { harvestedSenderKeys: harvested })).toBeNull()
    expect(
      validateMailSenderEmail('JAKOREA@jakorea.org', { harvestedSenderKeys: harvested })
    ).toBeNull()
    expect(
      validateMailSenderEmail('other@jakorea.org', { harvestedSenderKeys: harvested })
    ).toBe(MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE)
    expect(isHarvestedMailSenderEmail('jakorea@jakorea.org', harvested)).toBe(true)
    expect(findHarvestedMailSenderKey('JAKOREA@jakorea.org', harvested)).toBe(
      'jakorea@jakorea.org'
    )
  })
})
