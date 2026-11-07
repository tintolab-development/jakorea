import { describe, expect, it } from 'vitest'
import {
  coercePositiveInt,
  copyUserResponseResendIds,
  isUserResponseDisplayRowId,
  resolveCanonicalUserDetailId,
} from './user-response-row-id'

describe('user-response-row-id', () => {
  it('local-admin slug는 display row id', () => {
    expect(isUserResponseDisplayRowId('local-admin-member-viewer')).toBe(true)
  })

  it('uuid·numeric·admin-account prefix는 display row id 아님', () => {
    expect(isUserResponseDisplayRowId('a1c1b91b-d1ce-4bec-a192-8b3290113227')).toBe(false)
    expect(isUserResponseDisplayRowId('42')).toBe(false)
    expect(isUserResponseDisplayRowId('admin-account-7')).toBe(false)
  })

  it('coercePositiveInt — 문자열 숫자 허용', () => {
    expect(coercePositiveInt('12')).toBe(12)
    expect(coercePositiveInt(0)).toBeUndefined()
  })

  it('copyUserResponseResendIds — 양수만 복사', () => {
    expect(
      copyUserResponseResendIds({
        instructorRoleRequestId: 55,
        adminAccountId: null,
      })
    ).toEqual({ instructorRoleRequestId: 55 })
    expect(
      copyUserResponseResendIds({
        instructorRoleRequestId: 0,
        adminAccountId: undefined,
      })
    ).toEqual({})
  })

  it('resolveCanonicalUserDetailId — admin slug → admin-account-{id}', () => {
    expect(
      resolveCanonicalUserDetailId(
        { id: 'local-demo-admin-viewer', adminAccountId: 165003 },
        { id: 'local-demo-admin-viewer', adminAccountId: 165003 }
      )
    ).toBe('admin-account-165003')
  })
})
