import { describe, expect, it } from 'vitest'
import {
  mergeSponsorLogoFiles,
  validateSponsorLogoSelection,
  validateSponsorLogoTotalCount,
} from '@/features/sponsor/lib/sponsor-logo-file-policy'

describe('validateSponsorLogoSelection', () => {
  it('rejects disallowed extension', () => {
    expect(
      validateSponsorLogoSelection([new File(['x'], 'logo.gif', { type: 'image/gif' })])
    ).toMatch(/JPG/)
  })

  it('rejects file over 20MB', () => {
    const big = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'logo.png')
    expect(validateSponsorLogoSelection([big])).toMatch(/20MB/)
  })
})

describe('validateSponsorLogoTotalCount', () => {
  it('enforces max 20 retained + pending', () => {
    const pending = Array.from({ length: 2 }, (_, i) => new File(['x'], `a${i}.png`))
    expect(validateSponsorLogoTotalCount(19, pending)).toMatch(/20개/)
  })
})

describe('mergeSponsorLogoFiles', () => {
  it('dedupes identical files', () => {
    const file = new File(['x'], 'a.png')
    expect(mergeSponsorLogoFiles([file], [file])).toHaveLength(1)
  })
})
