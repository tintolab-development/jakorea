import { describe, expect, it } from 'vitest'
import {
  PROGRAM_CREATE_OWNER_REQUIRES_ELIGIBLE_PM_MESSAGE,
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

  it('self-assigns eligible creators as PM', () => {
    expect(
      withProgramCreateAdminAssignments(baseRequest, {
        roleCode: 'PROGRAM_MANAGER',
        adminAccountId: 42,
      }).adminAssignments
    ).toEqual([{ adminId: 42, role: 'PM' }])
  })

  it('rejects master without explicit owner', () => {
    expect(() =>
      withProgramCreateAdminAssignments(baseRequest, {
        roleCode: 'MASTER',
        adminAccountId: 1,
      })
    ).toThrow(PROGRAM_CREATE_OWNER_REQUIRES_ELIGIBLE_PM_MESSAGE)
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
