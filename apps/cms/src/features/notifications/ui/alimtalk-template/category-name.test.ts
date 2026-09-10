import { describe, expect, it } from 'vitest'
import { isValidCategoryName, sanitizeCategoryNameInput } from './category-name'

describe('sanitizeCategoryNameInput', () => {
  it('한글, 영문, 숫자, _, -는 유지한다', () => {
    expect(sanitizeCategoryNameInput('안내_Notice-01')).toBe('안내_Notice-01')
    expect(sanitizeCategoryNameInput('Abcxyz')).toBe('Abcxyz')
  })

  it('공백·특수문자는 제거한다', () => {
    expect(sanitizeCategoryNameInput('안내 공지!')).toBe('안내공지')
    expect(sanitizeCategoryNameInput('foo@bar.com')).toBe('foobarcom')
  })
})

describe('isValidCategoryName', () => {
  it('허용 문자만 있으면 true', () => {
    expect(isValidCategoryName('서비스이용')).toBe(true)
    expect(isValidCategoryName('Notice_01-A')).toBe(true)
  })

  it('빈 값·공백만이면 false', () => {
    expect(isValidCategoryName('')).toBe(false)
    expect(isValidCategoryName('   ')).toBe(false)
  })
})
