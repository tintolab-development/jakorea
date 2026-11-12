import { describe, expect, it } from 'vitest'
import { formatTemplateVariableUsage } from './template-variable-usage'

describe('formatTemplateVariableUsage', () => {
  it('변수 키 개수를 중복 없이 센다', () => {
    expect(formatTemplateVariableUsage(['이름', '이름', ' 프로그램명 '])).toBe('사용 2개')
  })

  it('변수가 없으면 미사용', () => {
    expect(formatTemplateVariableUsage([])).toBe('미사용')
    expect(formatTemplateVariableUsage(new Set(['  ']))).toBe('미사용')
  })

  it('본문을 모르면 단정하지 않는다', () => {
    expect(formatTemplateVariableUsage(null)).toBe('-')
    expect(formatTemplateVariableUsage(undefined)).toBe('-')
  })
})
