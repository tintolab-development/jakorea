import { describe, expect, it } from 'vitest'
import { resolveFoundEmail } from './find-email-service'

describe('resolveFoundEmail — 이메일 찾기 완료는 전체 이메일(정책 CMS-02)', () => {
  it('계정 원문 이메일을 maskedEmail보다 먼저 쓴다', () => {
    expect(
      resolveFoundEmail({
        matched: true,
        maskedEmail: 'abcd***@example.com',
        accounts: [{ email: 'abcdefg@example.com', maskedEmail: 'abcd***@example.com' }],
      })
    ).toBe('abcdefg@example.com')
  })

  it('원문 이메일이 없으면 서버 maskedEmail 값을 그대로 쓴다', () => {
    expect(resolveFoundEmail({ matched: true, maskedEmail: ' abcd***@example.com ' })).toBe(
      'abcd***@example.com'
    )
    expect(
      resolveFoundEmail({ matched: true, accounts: [{ email: ' ', maskedEmail: 'ab**@example.com' }] })
    ).toBe('ab**@example.com')
  })

  it('이메일 정보가 없으면 undefined', () => {
    expect(resolveFoundEmail({ matched: true, accounts: [] })).toBeUndefined()
  })
})
