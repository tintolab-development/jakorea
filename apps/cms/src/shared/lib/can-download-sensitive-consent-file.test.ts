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

  it('blocks Accounting Manager and viewers', () => {
    expect(canDownloadSensitiveConsentFile({ roleCode: 'ACCOUNTING_MANAGER' })).toBe(false)
    expect(
      canDownloadSensitiveConsentFile({
        roleCode: 'ACCOUNTING_MANAGER',
        isProgramOwner: true,
      })
    ).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PROGRAM_VIEWER' })).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'VIEWER' })).toBe(false)
  })

  it('allows Program Manager unless isProgramOwner is false', () => {
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PROGRAM_MANAGER' })).toBe(true)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'MIDDLE' })).toBe(true)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PM' })).toBe(true)
    expect(
      canDownloadSensitiveConsentFile({ roleCode: 'PROGRAM_MANAGER', isProgramOwner: true })
    ).toBe(true)
    expect(
      canDownloadSensitiveConsentFile({ roleCode: 'PROGRAM_MANAGER', isProgramOwner: false })
    ).toBe(false)
  })

  it('allows Partner only when they are the program owner', () => {
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PARTNER' })).toBe(false)
    expect(canDownloadSensitiveConsentFile({ roleCode: 'PARTNER', isProgramOwner: true })).toBe(
      true
    )
  })

  it('treats assignment role PM as program owner', () => {
    expect(isProgramOwnerAssignmentRole('PM')).toBe(true)
    expect(isProgramOwnerAssignmentRole('PARTNER')).toBe(false)
    expect(isProgramOwnerAssignmentRole('VIEWER')).toBe(false)
  })
})
