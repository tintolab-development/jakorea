import { describe, expect, it } from 'vitest'
import { canRevealProgramPrivacy, findMyProgramRole } from './program-privacy-access'
import type { ProgramRole } from '@/types/user'

function mapRole(role: string | null | undefined): ProgramRole | null {
  if (role === 'PM' || role === 'OWNER') return 'OWNER'
  if (role === 'PARTNER') return 'PARTNER'
  if (role === 'VIEWER' || role === 'ASSISTANT') return 'ASSISTANT'
  return null
}

describe('canRevealProgramPrivacy', () => {
  it('allows general plaintext for the program PM and partner only', () => {
    expect(canRevealProgramPrivacy('OWNER', 'general')).toBe(true)
    expect(canRevealProgramPrivacy('PARTNER', 'general')).toBe(true)
    expect(canRevealProgramPrivacy('ASSISTANT', 'general')).toBe(false)
    expect(canRevealProgramPrivacy(null, 'general')).toBe(false)
  })

  it('allows resident number and account plaintext for the program PM only', () => {
    expect(canRevealProgramPrivacy('OWNER', 'rrn')).toBe(true)
    expect(canRevealProgramPrivacy('OWNER', 'account')).toBe(true)
    expect(canRevealProgramPrivacy('PARTNER', 'rrn')).toBe(false)
    expect(canRevealProgramPrivacy('PARTNER', 'account')).toBe(false)
    expect(canRevealProgramPrivacy('ASSISTANT', 'account')).toBe(false)
  })
})

describe('findMyProgramRole', () => {
  const rows = [
    { adminId: 10, adminName: '마스터', role: 'PM' },
    { adminId: 20, adminEmail: 'partner@example.com', role: 'PARTNER' },
    { adminId: 30, role: 'VIEWER' },
  ]

  it('matches adminAccountId and maps PM, PARTNER, VIEWER', () => {
    expect(findMyProgramRole(rows, 10, mapRole)).toBe('OWNER')
    expect(findMyProgramRole(rows, 20, mapRole)).toBe('PARTNER')
    expect(findMyProgramRole(rows, 30, mapRole)).toBe('ASSISTANT')
    expect(canRevealProgramPrivacy(findMyProgramRole(rows, 10, mapRole), 'account')).toBe(true)
    expect(canRevealProgramPrivacy(findMyProgramRole(rows, 20, mapRole), 'general')).toBe(true)
    expect(canRevealProgramPrivacy(findMyProgramRole(rows, 20, mapRole), 'rrn')).toBe(false)
    expect(canRevealProgramPrivacy(findMyProgramRole(rows, 30, mapRole), 'general')).toBe(false)
  })

  it('does not infer a role from name, email, or a missing assignment', () => {
    expect(findMyProgramRole(rows, 999, mapRole)).toBeNull()
    expect(findMyProgramRole([{ adminId: 1, role: 'NOT_A_ROLE' }], 1, mapRole)).toBeNull()
    expect(findMyProgramRole([{ adminId: 10, role: 'PM' }, { adminId: 10, role: 'PARTNER' }], 10, mapRole)).toBeNull()
    expect(findMyProgramRole(rows, null, mapRole)).toBeNull()
  })
})
