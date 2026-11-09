import { describe, expect, it } from 'vitest'
import {
  isCmsAccountPaymentsAdminRole,
  isCmsMasterAdminRole,
  isCmsMemberPiiAdminRole,
  isCmsOperableProgramOwnerRole,
  isCmsRoleEligibleProgramOwner,
  isCmsRoleForbiddenProgramOwner,
  isCmsViewerAdminRole,
  resolveCmsGlobalAdminRole,
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

describe('resolveCmsGlobalAdminRole — 전역 역할만 정본 4종으로', () => {
  it.each([
    ['MASTER', 'MASTER'],
    ['ACCOUNTING_MANAGER', 'ACCOUNTING_MANAGER'],
    ['accounting-manager', 'ACCOUNTING_MANAGER'],
    ['ACCOUNTING', 'ACCOUNTING_MANAGER'],
    ['PROGRAM_MANAGER', 'PROGRAM_MANAGER'],
    ['MIDDLE', 'PROGRAM_MANAGER'],
    ['PROGRAM_VIEWER', 'PROGRAM_VIEWER'],
    ['VIEWER', 'PROGRAM_VIEWER'],
  ])('%s → %s', (raw, expected) => {
    expect(resolveCmsGlobalAdminRole(raw)).toBe(expected)
  })

  it.each(['PM', 'PARTNER', 'OWNER', 'ASSISTANT', '', null, undefined])(
    'V1.2 이전 프로그램 역할 코드·빈 값(%s)은 전역 역할이 아니다',
    raw => {
      expect(resolveCmsGlobalAdminRole(raw)).toBeNull()
    }
  )
})

describe('전역 역할 공통 판정', () => {
  it('계좌 지급 확인은 Master·Accounting Manager만', () => {
    expect(isCmsAccountPaymentsAdminRole('MASTER')).toBe(true)
    expect(isCmsAccountPaymentsAdminRole('ACCOUNTING')).toBe(true)
    expect(isCmsAccountPaymentsAdminRole('PROGRAM_MANAGER')).toBe(false)
    expect(isCmsAccountPaymentsAdminRole('PROGRAM_VIEWER')).toBe(false)
    expect(isCmsAccountPaymentsAdminRole('PM')).toBe(false)
  })

  it('회원 기본 개인정보 확인은 Master·Accounting Manager·Program Manager만', () => {
    expect(isCmsMemberPiiAdminRole('MASTER')).toBe(true)
    expect(isCmsMemberPiiAdminRole('ACCOUNTING_MANAGER')).toBe(true)
    expect(isCmsMemberPiiAdminRole('MIDDLE')).toBe(true)
    expect(isCmsMemberPiiAdminRole('PROGRAM_VIEWER')).toBe(false)
    expect(isCmsMemberPiiAdminRole('PM')).toBe(false)
    expect(isCmsMemberPiiAdminRole('PARTNER')).toBe(false)
  })
})
