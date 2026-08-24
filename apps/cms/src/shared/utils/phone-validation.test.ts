import { describe, expect, it } from 'vitest'
import {
  applyKoreanPhoneInputChange,
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
  normalizeKoreanPhoneDigits,
} from '@jakorea/domain/shared/korean-phone'

describe('normalizeKoreanPhoneDigits', () => {
  it('strips separators and caps at 11 digits', () => {
    expect(normalizeKoreanPhoneDigits('010 1234-5678')).toBe('01012345678')
    expect(normalizeKoreanPhoneDigits('010.1234.5678')).toBe('01012345678')
    expect(normalizeKoreanPhoneDigits('010123456789999')).toBe('01012345678')
    expect(normalizeKoreanPhoneDigits('０１０-１２３４-５６７８')).toBe('01012345678')
  })
})

describe('formatKoreanPhoneNumber', () => {
  it('formats complete numbers', () => {
    expect(formatKoreanPhoneNumber('01012345678')).toBe('010-1234-5678')
    expect(formatKoreanPhoneNumber('010-1234-5678')).toBe('010-1234-5678')
    expect(formatKoreanPhoneNumber('0212345678')).toBe('02-1234-5678')
    expect(formatKoreanPhoneNumber('021234567')).toBe('02-123-4567')
    expect(formatKoreanPhoneNumber('03112345678')).toBe('031-1234-5678')
    expect(formatKoreanPhoneNumber('0311234567')).toBe('031-123-4567')
    expect(formatKoreanPhoneNumber('07012345678')).toBe('070-1234-5678')
  })

  it('does not double-hyphen already formatted values', () => {
    expect(formatKoreanPhoneNumber('010-1234-5678')).toBe('010-1234-5678')
    expect(formatKoreanPhoneNumber('02-1234-5678')).toBe('02-1234-5678')
  })

  it('formats incomplete 010 input without blocking', () => {
    expect(formatKoreanPhoneNumber('0')).toBe('0')
    expect(formatKoreanPhoneNumber('01')).toBe('01')
    expect(formatKoreanPhoneNumber('010')).toBe('010')
    expect(formatKoreanPhoneNumber('0101')).toBe('010-1')
    expect(formatKoreanPhoneNumber('01012')).toBe('010-12')
    expect(formatKoreanPhoneNumber('0101234')).toBe('010-1234')
    expect(formatKoreanPhoneNumber('01012345')).toBe('010-1234-5')
  })

  it('formats incomplete 02 input without blocking', () => {
    expect(formatKoreanPhoneNumber('02')).toBe('02')
    expect(formatKoreanPhoneNumber('021')).toBe('02-1')
    expect(formatKoreanPhoneNumber('02123')).toBe('02-123')
    expect(formatKoreanPhoneNumber('021234')).toBe('02-1234')
    expect(formatKoreanPhoneNumber('0212345')).toBe('02-1234-5')
  })
})

describe('isValidKoreanPhoneNumber', () => {
  it('accepts allowed prefixes and lengths', () => {
    expect(isValidKoreanPhoneNumber('01012345678')).toBe(true)
    expect(isValidKoreanPhoneNumber('010-1234-5678')).toBe(true)
    expect(isValidKoreanPhoneNumber('0212345678')).toBe(true)
    expect(isValidKoreanPhoneNumber('021234567')).toBe(true)
    expect(isValidKoreanPhoneNumber('03112345678')).toBe(true)
    expect(isValidKoreanPhoneNumber('0311234567')).toBe(true)
    expect(isValidKoreanPhoneNumber('07012345678')).toBe(true)
    expect(isValidKoreanPhoneNumber('02 1234 5678')).toBe(true)
    expect(isValidKoreanPhoneNumber('070 1234 5678')).toBe(true)
  })

  it('rejects unknown prefixes and wrong lengths', () => {
    expect(isValidKoreanPhoneNumber('10112345678')).toBe(false)
    expect(isValidKoreanPhoneNumber('101-1234-5678')).toBe(false)
    expect(isValidKoreanPhoneNumber('050-1234-5678')).toBe(false)
    expect(isValidKoreanPhoneNumber('080-1234-5678')).toBe(false)
    expect(isValidKoreanPhoneNumber('1588-1234')).toBe(false)
    expect(isValidKoreanPhoneNumber('1670-1234')).toBe(false)
    expect(isValidKoreanPhoneNumber('1800-1234')).toBe(false)
    expect(isValidKoreanPhoneNumber('123-4567-8901')).toBe(false)
    expect(isValidKoreanPhoneNumber('999-1234-5678')).toBe(false)
    expect(isValidKoreanPhoneNumber('010-123-4567')).toBe(false)
    expect(isValidKoreanPhoneNumber('070-123-4567')).toBe(false)
    expect(isValidKoreanPhoneNumber('011-1234-5678')).toBe(false)
    expect(isValidKoreanPhoneNumber('010-12345-6789')).toBe(false)
    expect(isValidKoreanPhoneNumber('02-12-3456')).toBe(false)
    expect(isValidKoreanPhoneNumber('031-12-3456')).toBe(false)
    expect(isValidKoreanPhoneNumber('010123456789')).toBe(false)
    expect(isValidKoreanPhoneNumber('')).toBe(false)
  })
})

describe('applyKoreanPhoneInputChange', () => {
  it('formats paste of mixed separators', () => {
    expect(applyKoreanPhoneInputChange('', '010 1234-5678', 13).formatted).toBe('010-1234-5678')
    expect(applyKoreanPhoneInputChange('', '02-1234-5678', 12).formatted).toBe('02-1234-5678')
  })

  it('deletes the previous digit when backspacing a hyphen', () => {
    const result = applyKoreanPhoneInputChange('010-1234-5', '010-12345', 8)
    expect(result.formatted).toBe('010-1235')
  })
})
