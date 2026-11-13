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

  it('rejects selection over 100MB in total', () => {
    const files = Array.from(
      { length: 6 },
      (_, i) => new File([new Uint8Array(17 * 1024 * 1024)], `logo${i}.png`)
    )
    expect(validateSponsorLogoSelection(files)).toMatch(/100MB/)
  })
})

describe('validateSponsorLogoTotalCount', () => {
  it('enforces max 10 retained + pending', () => {
    const pending = Array.from({ length: 2 }, (_, i) => new File(['x'], `a${i}.png`))
    expect(validateSponsorLogoTotalCount(9, pending)).toMatch(/10개/)
    expect(validateSponsorLogoTotalCount(8, pending)).toBeNull()
  })
})

describe('mergeSponsorLogoFiles', () => {
  it('dedupes identical files', () => {
    const file = new File(['x'], 'a.png')
    expect(mergeSponsorLogoFiles([file], [file])).toHaveLength(1)
  })
})
