import { describe, expect, it } from 'vitest'
import {
  canAssignProgramRoleToCmsAdmin,
  isCmsViewerAdminRole,
} from './program-pm-role-policy'

describe('isCmsViewerAdminRole', () => {
  it('treats VIEWER as lookup-only', () => {
    expect(isCmsViewerAdminRole('VIEWER')).toBe(true)
    expect(isCmsViewerAdminRole('viewer')).toBe(true)
  })

  it('does not treat other CMS roles as lookup-only', () => {
    expect(isCmsViewerAdminRole('PM')).toBe(false)
    expect(isCmsViewerAdminRole('MASTER')).toBe(false)
    expect(isCmsViewerAdminRole(undefined)).toBe(false)
  })
})

describe('canAssignProgramRoleToCmsAdmin', () => {
  it('locks CMS VIEWER to program ASSISTANT', () => {
    expect(canAssignProgramRoleToCmsAdmin('VIEWER', 'OWNER')).toBe(false)
    expect(canAssignProgramRoleToCmsAdmin('VIEWER', 'PARTNER')).toBe(false)
    expect(canAssignProgramRoleToCmsAdmin('VIEWER', 'ASSISTANT')).toBe(true)
  })

  it('allows PM/PARTNER/ASSISTANT for other CMS roles', () => {
    expect(canAssignProgramRoleToCmsAdmin('PM', 'OWNER')).toBe(true)
    expect(canAssignProgramRoleToCmsAdmin('PARTNER', 'PARTNER')).toBe(true)
    expect(canAssignProgramRoleToCmsAdmin(undefined, 'OWNER')).toBe(true)
  })
})
