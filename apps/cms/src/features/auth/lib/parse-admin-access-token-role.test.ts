import { describe, expect, it } from 'vitest'
import { parseAdminRoleCodeFromAccessToken } from './parse-admin-access-token-role'

function jwtWithPayload(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

describe('parseAdminRoleCodeFromAccessToken', () => {
  it('roleCode 클레임을 파싱한다', () => {
    expect(parseAdminRoleCodeFromAccessToken(jwtWithPayload({ roleCode: 'MASTER' }))).toBe('MASTER')
  })

  it('ROLE_ 접두 authorities를 파싱한다', () => {
    expect(
      parseAdminRoleCodeFromAccessToken(jwtWithPayload({ authorities: ['ROLE_PM'] })),
    ).toBe('PM')
  })
})
