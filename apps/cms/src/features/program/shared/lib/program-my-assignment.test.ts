import { describe, expect, it } from 'vitest'
import {
  canListProgramManagers,
  canRevealProgramGeneralPii,
  canRevealProgramSensitivePii,
} from './program-my-assignment'
import { projectProgramPrivacyValue } from './project-program-privacy'

const pm = {
  assigned: true,
  assignmentRole: 'PM',
  masterBypass: false,
  capabilities: ['PROGRAM_VIEW', 'PROGRAM_EDIT', 'SENSITIVE_PII_READ', 'PROGRAM_ADMIN_MANAGE'],
}

describe('program my-assignment capabilities', () => {
  it('blocks plaintext when a PM assignment only has PROGRAM_VIEW', () => {
    const viewerCeiling = {
      assigned: true,
      assignmentRole: 'PM',
      capabilities: ['PROGRAM_VIEW'],
    }
    expect(canRevealProgramGeneralPii(viewerCeiling)).toBe(false)
    expect(canRevealProgramSensitivePii(viewerCeiling)).toBe(false)
    expect(canListProgramManagers(viewerCeiling)).toBe(false)
  })

  it('lets PARTNER read general fields and not account or the manager list', () => {
    const partner = {
      assigned: true,
      assignmentRole: 'PARTNER',
      capabilities: ['PROGRAM_VIEW', 'PROGRAM_EDIT', 'APPLICATION_REVIEW'],
    }
    expect(canRevealProgramGeneralPii(partner)).toBe(true)
    expect(canRevealProgramSensitivePii(partner)).toBe(false)
    expect(canListProgramManagers(partner)).toBe(false)
  })

  it('lets PM and master-bypass capabilities through without inventing missing ones', () => {
    expect(canRevealProgramSensitivePii(pm)).toBe(true)
    expect(canListProgramManagers(pm)).toBe(true)
    expect(
      canRevealProgramSensitivePii({
        assigned: false,
        assignmentRole: null,
        masterBypass: true,
        capabilities: ['PROGRAM_VIEW'],
      })
    ).toBe(false)
  })

  it('drops account and resident fields before cache write', () => {
    const projected = projectProgramPrivacyValue(
      {
        contact: '010-1111-2222',
        accountNumber: '110-123-456789',
        instructorCmsProfile: { bankAccounts: [{ accountNo: '999' }] },
      },
      false
    )
    expect(projected.value).toEqual({ contact: '010-1111-2222', instructorCmsProfile: {} })
    expect(projected.leakedFields).toEqual(['accountNumber', 'instructorCmsProfile.bankAccounts'])
  })
})
