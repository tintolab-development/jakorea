import { describe, expect, it } from 'vitest'
import {
  MAIL_TEMPLATE_NAME_INVALID_MESSAGE,
  MAIL_TEMPLATE_NAME_REQUIRED_MESSAGE,
  isValidMailTemplateName,
  validateMailTemplateName,
} from './template-name'

describe('mail template name (NHN EMAIL displayName)', () => {
  it('rejects empty', () => {
    expect(validateMailTemplateName('')).toBe(MAIL_TEMPLATE_NAME_REQUIRED_MESSAGE)
    expect(validateMailTemplateName('   ')).toBe(MAIL_TEMPLATE_NAME_REQUIRED_MESSAGE)
    expect(isValidMailTemplateName('')).toBe(false)
  })

  it('rejects spaces and special characters', () => {
    expect(validateMailTemplateName('테스트 템플릿')).toBe(MAIL_TEMPLATE_NAME_INVALID_MESSAGE)
    expect(validateMailTemplateName('테스트/템플릿')).toBe(MAIL_TEMPLATE_NAME_INVALID_MESSAGE)
    expect(validateMailTemplateName('테스트.템플릿')).toBe(MAIL_TEMPLATE_NAME_INVALID_MESSAGE)
    expect(isValidMailTemplateName('테스트 템플릿')).toBe(false)
  })

  it('accepts hangul, latin, digits, underscore, hyphen', () => {
    expect(validateMailTemplateName('테스트템플릿')).toBeNull()
    expect(validateMailTemplateName('테스트_템플릿')).toBeNull()
    expect(validateMailTemplateName('테스트-템플릿')).toBeNull()
    expect(validateMailTemplateName('MailTemplate01')).toBeNull()
    expect(isValidMailTemplateName('테스트_템플릿')).toBe(true)
  })
})
