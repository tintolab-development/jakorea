import { describe, expect, it } from 'vitest'
import {
  formatCurrencyInput,
  normalizeNumericInputOnBlur,
  sanitizeNumericInput,
} from './numeric-input'

describe('sanitizeNumericInput', () => {
  it('integer 입력에서 숫자와 선행 음수 기호만 남긴다', () => {
    expect(sanitizeNumericInput('-1a2-3', { mode: 'integer' })).toBe('-123')
    expect(sanitizeNumericInput('-', { mode: 'integer' })).toBe('-')
    expect(sanitizeNumericInput('', { mode: 'integer' })).toBe('')
  })

  it('decimal 입력의 소수점을 하나만 남기고 precision을 적용한다', () => {
    expect(sanitizeNumericInput('12.3.456', { mode: 'decimal', precision: 2 })).toBe('12.34')
    expect(sanitizeNumericInput('.', { mode: 'decimal', precision: 2 })).toBe('.')
    expect(sanitizeNumericInput('-.', { mode: 'decimal', precision: 2 })).toBe('-.')
  })

  it('currency와 numericText는 raw digits를 반환한다', () => {
    expect(sanitizeNumericInput('1,234원', { mode: 'currency' })).toBe('1234')
    expect(sanitizeNumericInput('001-02', { mode: 'numericText' })).toBe('00102')
    expect(sanitizeNumericInput('１２３，４５６원', { mode: 'currency' })).toBe('123456')
  })
})

describe('normalizeNumericInputOnBlur', () => {
  it('blur 전에는 허용한 음수 중간 상태를 blur에서 정리한다', () => {
    expect(
      normalizeNumericInputOnBlur('-12', {
        mode: 'integer',
        allowNegative: false,
      })
    ).toBe('12')
    expect(normalizeNumericInputOnBlur('-', { mode: 'integer' })).toBe('')
  })

  it('min과 max를 blur에서 적용한다', () => {
    const options = { mode: 'integer' as const, min: 10, max: 20 }

    expect(normalizeNumericInputOnBlur('2', options)).toBe('10')
    expect(normalizeNumericInputOnBlur('15', options)).toBe('15')
    expect(normalizeNumericInputOnBlur('30', options)).toBe('20')
  })

  it('일반 숫자는 선행 0을 정리하지만 numericText는 보존한다', () => {
    expect(normalizeNumericInputOnBlur('00012', { mode: 'integer' })).toBe('12')
    expect(normalizeNumericInputOnBlur('00012', { mode: 'numericText' })).toBe('00012')
  })
})

describe('formatCurrencyInput', () => {
  it('raw digits를 천 단위 쉼표로 표시한다', () => {
    expect(formatCurrencyInput('1234567')).toBe('1,234,567')
    expect(formatCurrencyInput('')).toBe('')
  })
})
