import { describe, expect, it } from 'vitest'
import { formatBirthWithOptionalAge, toPolicyMaskedBirthDisplay } from './format-gender-birth-display'
import { mapApiBirthDateToDisplay } from '@/features/program/general/api/adapters/student-roster-adapters'
import { mask1365IdForDisplay } from './map-external-identifiers'
import { MASKING_POLICY } from '@/shared/constants/download-policy'

describe('Step 6 FE 표시 — BE 마스킹 값을 정책 표기로, 재마스킹·추정 없이', () => {
  it('BE 마스킹 생년월일(yyyy-**-**)은 정책 표기(yyyy.**.**)로 바꾸고 다른 값은 그대로 둔다', () => {
    expect(toPolicyMaskedBirthDisplay('2000-**-**')).toBe('2000.**.**')
    expect(toPolicyMaskedBirthDisplay('2000.**.**')).toBe('2000.**.**')
    expect(toPolicyMaskedBirthDisplay('2000-01-15')).toBe('2000-01-15')
    expect(toPolicyMaskedBirthDisplay(null)).toBe('')
  })

  it('생년월일·나이: 마스킹이면 정책 표기, 나이 0(미상)은 붙이지 않는다', () => {
    expect(formatBirthWithOptionalAge('2000-**-**', 25)).toBe('2000.**.** (만 25세)')
    expect(formatBirthWithOptionalAge('2000-**-**', 0)).toBe('2000.**.**')
    expect(formatBirthWithOptionalAge('2000.01.15', 25)).toBe('2000. 01. 15 (만 25세)')
    expect(formatBirthWithOptionalAge(undefined, undefined)).toBe('-')
  })

  it('학생 명단: 마스킹 생년월일을 그대로(yyyy-**-**) 보여주지 않는다', () => {
    expect(mapApiBirthDateToDisplay('2013-**-**')).toBe('2013.**.**')
  })

  it('이미 마스킹된 이메일·연락처·1365 ID를 다른 규칙으로 다시 가리지 않는다', () => {
    expect(MASKING_POLICY.email('abcd***@example.com')).toBe('abcd***@example.com')
    expect(MASKING_POLICY.email('abcdefg@example.com')).toBe('abcd***@example.com')
    expect(MASKING_POLICY.phone('010-****-5678')).toBe('010-****-5678')
    expect(mask1365IdForDisplay('volunteer**')).toBe('volunteer**')
    expect(mask1365IdForDisplay('volunteer99')).toBe('volunteer**')
  })
})
