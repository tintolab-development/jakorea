import { describe, expect, it } from 'vitest'
import { sanitizeNotificationTemplateNameInput } from './template-name-input'

describe('sanitizeNotificationTemplateNameInput', () => {
  it('공백·특수문자는 제거한다', () => {
    expect(sanitizeNotificationTemplateNameInput('테스트 템플릿!')).toBe('테스트템플릿')
    expect(sanitizeNotificationTemplateNameInput('foo@bar')).toBe('foobar')
  })

  it('IME 조합 중 자모를 유지한다', () => {
    expect(sanitizeNotificationTemplateNameInput('테ㅅ')).toBe('테ㅅ')
    expect(sanitizeNotificationTemplateNameInput('ㄱ')).toBe('ㄱ')
    expect(sanitizeNotificationTemplateNameInput('테스트_01-a')).toBe('테스트_01-a')
  })
})
