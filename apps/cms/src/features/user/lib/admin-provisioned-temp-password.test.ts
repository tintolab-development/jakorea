import { describe, expect, it } from 'vitest'
import { resolveAdminProvisionedTempPassword } from '@/features/user/lib/admin-provisioned-temp-password'

describe('resolveAdminProvisionedTempPassword', () => {
  it('계정 아이디를 임시 비밀번호로 반환한다', () => {
    expect(resolveAdminProvisionedTempPassword('member@example.com')).toBe('member@example.com')
  })

  it('앞뒤 공백을 제거한다', () => {
    expect(resolveAdminProvisionedTempPassword('  member@example.com  ')).toBe('member@example.com')
  })

  it('빈 계정 아이디는 거부한다', () => {
    expect(() => resolveAdminProvisionedTempPassword('')).toThrow('계정 아이디가 필요합니다.')
    expect(() => resolveAdminProvisionedTempPassword('   ')).toThrow('계정 아이디가 필요합니다.')
  })
})
