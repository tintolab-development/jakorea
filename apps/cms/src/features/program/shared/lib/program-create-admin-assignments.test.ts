import { describe, expect, it } from 'vitest'
import {
  PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE,
  isCmsRoleEligibleProgramOwner,
  withProgramCreateAdminAssignments,
} from './program-create-admin-assignments'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'

const baseRequest: ProgramCreateRequest = {
  title: 'test',
  programType: 'COMPANY_SCHOOL',
}

describe('isCmsRoleEligibleProgramOwner', () => {
  it('allows accounting and program manager roles', () => {
    expect(isCmsRoleEligibleProgramOwner('ACCOUNTING_MANAGER')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('PROGRAM_MANAGER')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('MIDDLE')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('PM')).toBe(true)
  })

  it('rejects master and viewer', () => {
    expect(isCmsRoleEligibleProgramOwner('MASTER')).toBe(false)
    expect(isCmsRoleEligibleProgramOwner('PROGRAM_VIEWER')).toBe(false)
    expect(isCmsRoleEligibleProgramOwner('VIEWER')).toBe(false)
  })
})

describe('withProgramCreateAdminAssignments', () => {
  it('keeps explicit PM assignments', () => {
    const request = {
      ...baseRequest,
      adminAssignments: [{ adminId: 99, role: 'PM' }],
    }
    expect(
      withProgramCreateAdminAssignments(request, {
        roleCode: 'MASTER',
        adminAccountId: 1,
      })
    ).toEqual(request)
  })

  it('omits assignments so the server assigns the creator PM', () => {
    expect(
      withProgramCreateAdminAssignments(baseRequest, {
        roleCode: 'PROGRAM_MANAGER',
        adminAccountId: 42,
      })
    ).toEqual(baseRequest)
  })

  it('requires exactly one creator PM when assignments are explicit', () => {
    expect(() =>
      withProgramCreateAdminAssignments(
        {
          ...baseRequest,
          adminAssignments: [
            { adminId: 1, role: 'PM' },
            { adminId: 2, role: 'PM' },
          ],
        },
        { roleCode: 'PROGRAM_MANAGER', adminAccountId: 42 }
      )
    ).toThrow(/생성자 PM은 정확히 1명/)
  })

  it('rejects master as the explicit creator PM', () => {
    expect(() =>
      withProgramCreateAdminAssignments(
        { ...baseRequest, adminAssignments: [{ adminId: 1, role: 'PM' }] },
        { roleCode: 'MASTER', adminAccountId: 1 }
      )
    ).toThrow(/Master는 생성 담당자 목록/)
  })

  it('does not self-assign or block master (no registration owner picker)', () => {
    expect(
      withProgramCreateAdminAssignments(baseRequest, {
        roleCode: 'MASTER',
        adminAccountId: 1,
      })
    ).toEqual(baseRequest)
  })

  it('rejects program viewer', () => {
    expect(() =>
      withProgramCreateAdminAssignments(baseRequest, {
        roleCode: 'PROGRAM_VIEWER',
        adminAccountId: 1,
      })
    ).toThrow(PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE)
  })
})
