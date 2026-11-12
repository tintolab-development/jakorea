import { describe, expect, it } from 'vitest'
import { MASKING_POLICY } from './download-policy'

describe('MASKING_POLICY N-16', () => {
  it('masks the last 3 characters of an email local part', () => {
    expect(MASKING_POLICY.email('0915123@naver.com')).toBe('0915***@naver.com')
    expect(MASKING_POLICY.email('ab@naver.com')).toBe('**@naver.com')
    expect(MASKING_POLICY.email('0915***@naver.com')).toBe('0915***@naver.com')
    expect(MASKING_POLICY.email('not-an-email')).toBe('***')
  })

  it('keeps surname and last character of an account holder', () => {
    expect(MASKING_POLICY.accountHolderName('김이')).toBe('김*')
    expect(MASKING_POLICY.accountHolderName('김민이')).toBe('김*이')
    expect(MASKING_POLICY.accountHolderName('남궁민지수')).toBe('남궁**수')
    expect(MASKING_POLICY.accountHolderName('김*이')).toBe('김*이')
  })

  it('masks jibun through dong and road through the road name', () => {
    expect(MASKING_POLICY.address('서울특별시 강남구 역삼동 123-4')).toBe(
      '서울특별시 강남구 역삼동 *****'
    )
    expect(MASKING_POLICY.address('서울특별시 강남구 테헤란로 123')).toBe(
      '서울특별시 강남구 테헤란로 *****'
    )
    expect(MASKING_POLICY.address('상세주소없음')).toBe('비공개')
    expect(MASKING_POLICY.address('서울시 강남구 ***')).toBe('서울시 강남구 ***')
    expect(MASKING_POLICY.address('비공개')).toBe('비공개')
  })

  it('does not re-mask phone, account number, or resident number', () => {
    expect(MASKING_POLICY.phone('010-****-5678')).toBe('010-****-5678')
    expect(MASKING_POLICY.phone('01012345678')).toBe('010-****-5678')
    expect(MASKING_POLICY.accountNumber('123-****-5678')).toBe('123-****-5678')
    expect(MASKING_POLICY.accountNumber('110-123-456789')).toBe('***-***-******')
    expect(MASKING_POLICY.residentNumber('000915-1234567')).toBe('000915-1******')
    expect(MASKING_POLICY.residentNumber('000915-1******')).toBe('000915-1******')
    expect(MASKING_POLICY.residentNumber('bad')).toBe('******-*******')
  })
})
