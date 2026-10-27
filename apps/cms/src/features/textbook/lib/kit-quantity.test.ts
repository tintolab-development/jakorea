import { describe, expect, it } from 'vitest'
import { isValidKitQuantityInput, parseKitQuantityInput } from './kit-quantity'

describe('isValidKitQuantityInput', () => {
  it('1 이상 정수만 허용한다', () => {
    expect(isValidKitQuantityInput('1')).toBe(true)
    expect(isValidKitQuantityInput('24')).toBe(true)
    expect(isValidKitQuantityInput('32')).toBe(true)
  })

  it('공란·0·음수·소수·문자를 거부한다', () => {
    expect(isValidKitQuantityInput('')).toBe(false)
    expect(isValidKitQuantityInput('  ')).toBe(false)
    expect(isValidKitQuantityInput('0')).toBe(false)
    expect(isValidKitQuantityInput('-1')).toBe(false)
    expect(isValidKitQuantityInput('1.5')).toBe(false)
    expect(isValidKitQuantityInput('abc')).toBe(false)
    expect(isValidKitQuantityInput('1e2')).toBe(false)
  })
})

describe('parseKitQuantityInput', () => {
  it('정수를 반환한다', () => {
    expect(parseKitQuantityInput('24')).toBe(24)
  })

  it('parseInt처럼 소수를 잘라 성공시키지 않는다', () => {
    expect(() => parseKitQuantityInput('1.5')).toThrow(/1 이상의 정수/)
  })
})
