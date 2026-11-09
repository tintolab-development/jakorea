import { describe, expect, it } from 'vitest'
import {
  canDownloadSensitiveConsentFile,
  isProgramOwnerAssignmentRole,
} from './can-download-sensitive-consent-file'

describe('canDownloadSensitiveConsentFile', () => {
  it('allows Master regardless of program owner flag', () => {
    expect(canDownloadSensitiveConsentFile({ roleCode: 'MASTER' })).toBe(true)
    expect(
      canDownloadSensitiveConsentFile({ roleCode: 'MASTER', isProgramOwner: false })
    ).toBe(true)
  })

  it('blocks viewers regardless of program owner flag', () => {
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PROGRAM_VIEWER' })).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'VIEWER' })).toBe(false)
    expect(
      canDownloadSensitiveConsentFile({ roleCode: 'PROGRAM_VIEWER', isProgramOwner: true })
    ).toBe(false)
  })

  it('blocks non-Master admins on CMS default screens (no program context)', () => {
    expect(canDownloadSensitiveConsentFile({ roleCode: 'ACCOUNTING_MANAGER' })).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PROGRAM_MANAGER' })).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'MIDDLE' })).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PM' })).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PARTNER' })).toBe(false)
  })

  it('allows Accounting Manager and Program Manager only as the program owner', () => {
    for (const roleCode of ['ACCOUNTING_MANAGER', 'PROGRAM_MANAGER', 'MIDDLE', 'PM', 'PARTNER']) {
      expect(canDownloadSensitiveConsentFile({ roleCode, isProgramOwner: true })).toBe(true)
      expect(canDownloadSensitiveConsentFile({ roleCode, isProgramOwner: false })).toBe(false)
    }
  })

  it('treats assignment role PM as program owner', () => {
    expect(isProgramOwnerAssignmentRole('PM')).toBe(true)
    expect(isProgramOwnerAssignmentRole('PARTNER')).toBe(false)
    expect(isProgramOwnerAssignmentRole('VIEWER')).toBe(false)
  })
})
