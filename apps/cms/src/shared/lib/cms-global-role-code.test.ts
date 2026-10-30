import { describe, expect, it } from 'vitest'
import {
  isCmsMasterAdminRole,
  isCmsOperableProgramOwnerRole,
  isCmsRoleEligibleProgramOwner,
  isCmsRoleForbiddenProgramOwner,
  isCmsViewerAdminRole,
} from './cms-global-role-code'

/** 로컬 ja_cms_local GET /me 실측 */
const LOCAL_ME_ROLE_SAMPLES = {
  'admin1@jakorea.org': 'MASTER',
  'pm1@jakorea.org': 'MIDDLE',
  'partner1@jakorea.org': 'MIDDLE',
  'viewer1@jakorea.org': 'VIEWER',
} as const

describe('cms-global-role-code', () => {
  it('maps local /me samples to N-16 display buckets', () => {
    expect(isCmsMasterAdminRole(LOCAL_ME_ROLE_SAMPLES['admin1@jakorea.org'])).toBe(true)
    expect(isCmsOperableProgramOwnerRole(LOCAL_ME_ROLE_SAMPLES['pm1@jakorea.org'])).toBe(true)
    expect(isCmsOperableProgramOwnerRole(LOCAL_ME_ROLE_SAMPLES['partner1@jakorea.org'])).toBe(true)
    expect(isCmsViewerAdminRole(LOCAL_ME_ROLE_SAMPLES['viewer1@jakorea.org'])).toBe(true)
  })

  it('treats N-16 and legacy program-manager codes as PM-eligible', () => {
    expect(isCmsRoleEligibleProgramOwner('ACCOUNTING_MANAGER')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('PROGRAM_MANAGER')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('MIDDLE')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('PM')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('PARTNER')).toBe(true)
    expect(isCmsRoleEligibleProgramOwner('MASTER')).toBe(false)
    expect(isCmsRoleEligibleProgramOwner('PROGRAM_VIEWER')).toBe(false)
    expect(isCmsRoleEligibleProgramOwner('VIEWER')).toBe(false)
  })

  it('forbids master and viewers as program owners', () => {
    expect(isCmsRoleForbiddenProgramOwner('MASTER')).toBe(true)
    expect(isCmsRoleForbiddenProgramOwner('PROGRAM_VIEWER')).toBe(true)
    expect(isCmsRoleForbiddenProgramOwner('VIEWER')).toBe(true)
    expect(isCmsRoleForbiddenProgramOwner('PROGRAM_MANAGER')).toBe(false)
  })
})
