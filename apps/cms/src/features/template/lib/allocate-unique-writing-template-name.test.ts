import { describe, expect, it } from 'vitest'
import { allocateUniqueWritingTemplateName } from '@/features/template/lib/allocate-unique-writing-template-name'

describe('allocateUniqueWritingTemplateName', () => {
  it('returns base when unused', () => {
    expect(allocateUniqueWritingTemplateName('동의 양식 신규 폼', [])).toBe('동의 양식 신규 폼')
  })

  it('appends (1) when base exists', () => {
    expect(
      allocateUniqueWritingTemplateName('동의 양식 신규 폼', ['동의 양식 신규 폼'])
    ).toBe('동의 양식 신규 폼 (1)')
  })

  it('appends next free number', () => {
    expect(
      allocateUniqueWritingTemplateName('설문조사', [
        '설문조사',
        '설문조사 (1)',
        '설문조사 (2)',
      ])
    ).toBe('설문조사 (3)')
  })

  it('fills gaps in numbering', () => {
    expect(allocateUniqueWritingTemplateName('폼', ['폼', '폼 (2)'])).toBe('폼 (1)')
  })
})
