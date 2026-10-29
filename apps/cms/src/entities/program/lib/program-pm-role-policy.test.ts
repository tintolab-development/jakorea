import { describe, expect, it } from 'vitest'
import {
  canAssignProgramRoleToCmsAdmin,
  isCmsViewerAdminRole,
} from './program-pm-role-policy'

describe('isCmsViewerAdminRole', () => {
  it('treats VIEWER and PROGRAM_VIEWER as lookup-only', () => {
    expect(isCmsViewerAdminRole('VIEWER')).toBe(true)
    expect(isCmsViewerAdminRole('viewer')).toBe(true)
    expect(isCmsViewerAdminRole('PROGRAM_VIEWER')).toBe(true)
  })

  it('does not treat other CMS roles as lookup-only', () => {
    expect(isCmsViewerAdminRole('PM')).toBe(false)
    expect(isCmsViewerAdminRole('PROGRAM_MANAGER')).toBe(false)
    expect(isCmsViewerAdminRole('MASTER')).toBe(false)
    expect(isCmsViewerAdminRole(undefined)).toBe(false)
  })
})

describe('canAssignProgramRoleToCmsAdmin', () => {
  it('locks CMS VIEWER to program ASSISTANT', () => {
    expect(canAssignProgramRoleToCmsAdmin('VIEWER', 'OWNER')).toBe(false)
    expect(canAssignProgramRoleToCmsAdmin('VIEWER', 'PARTNER')).toBe(false)
    expect(canAssignProgramRoleToCmsAdmin('VIEWER', 'ASSISTANT')).toBe(true)
    expect(canAssignProgramRoleToCmsAdmin('PROGRAM_VIEWER', 'ASSISTANT')).toBe(true)
  })

  it('rejects MASTER for any program role', () => {
    expect(canAssignProgramRoleToCmsAdmin('MASTER', 'OWNER')).toBe(false)
    expect(canAssignProgramRoleToCmsAdmin('MASTER', 'ASSISTANT')).toBe(false)
  })

  it('allows OWNER/PARTNER only for accounting·program manager roles', () => {
    expect(canAssignProgramRoleToCmsAdmin('PROGRAM_MANAGER', 'OWNER')).toBe(true)
    expect(canAssignProgramRoleToCmsAdmin('ACCOUNTING_MANAGER', 'PARTNER')).toBe(true)
    expect(canAssignProgramRoleToCmsAdmin('PROGRAM_MANAGER', 'ASSISTANT')).toBe(false)
    expect(canAssignProgramRoleToCmsAdmin('PM', 'OWNER')).toBe(true)
    expect(canAssignProgramRoleToCmsAdmin('MIDDLE', 'OWNER')).toBe(true)
    expect(canAssignProgramRoleToCmsAdmin(undefined, 'OWNER')).toBe(true)
  })
})
