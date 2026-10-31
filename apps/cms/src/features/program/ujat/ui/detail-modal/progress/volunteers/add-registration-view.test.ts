import { describe, expect, it } from 'vitest'
import { parseUjatVolAddMemberIdParam } from '@/features/program/ujat/lib/ujat-program-detail-url'

/** add-registration-view `resolveVolunteerRegisterMemberId`와 동일 규칙 */
function resolveVolunteerRegisterMemberId(memberId: string): number | null {
  const parsed = parseUjatVolAddMemberIdParam(memberId)
  return parsed == null ? null : Number(parsed)
}

describe('resolveVolunteerRegisterMemberId', () => {
  it('양의 정수 문자열만 통과한다', () => {
    expect(resolveVolunteerRegisterMemberId('190094')).toBe(190094)
    expect(resolveVolunteerRegisterMemberId('1')).toBe(1)
  })

  it('UUID·빈 값·비양수는 null', () => {
    expect(resolveVolunteerRegisterMemberId('')).toBeNull()
    expect(resolveVolunteerRegisterMemberId('550e8400-e29b-41d4-a716-446655440000')).toBeNull()
    expect(resolveVolunteerRegisterMemberId('0')).toBeNull()
    expect(resolveVolunteerRegisterMemberId('-12')).toBeNull()
    expect(resolveVolunteerRegisterMemberId('12.5')).toBeNull()
    expect(resolveVolunteerRegisterMemberId('12abc')).toBeNull()
  })
})
