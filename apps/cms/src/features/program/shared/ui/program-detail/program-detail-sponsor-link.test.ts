import { describe, expect, it } from 'vitest'
import {
  buildSponsorDetailPageUrl,
  normalizeSponsorOrganizationKind,
  sanitizeInternalReturnTo,
} from '@/features/sponsor/lib/sponsor-detail-page-url'
import { normalizeSponsorHomepageUrl } from './program-detail-sponsor-link'

describe('normalizeSponsorHomepageUrl', () => {
  it('returns null for empty values', () => {
    expect(normalizeSponsorHomepageUrl(null)).toBeNull()
    expect(normalizeSponsorHomepageUrl('')).toBeNull()
    expect(normalizeSponsorHomepageUrl('-')).toBeNull()
  })

  it('keeps absolute http(s) URLs', () => {
    expect(normalizeSponsorHomepageUrl('https://www.samsung.com')).toBe('https://www.samsung.com')
    expect(normalizeSponsorHomepageUrl('http://example.com')).toBe('http://example.com')
  })

  it('prefixes https for protocol-relative and bare hosts', () => {
    expect(normalizeSponsorHomepageUrl('//www.samsung.com')).toBe('https://www.samsung.com')
    expect(normalizeSponsorHomepageUrl('www.samsung.com')).toBe('https://www.samsung.com')
  })
})

describe('buildSponsorDetailPageUrl', () => {
  it('builds sponsor detail URL with sp_kind', () => {
    expect(buildSponsorDetailPageUrl('1627251')).toBe(
      '/sponsor?sp_kind=corporate&sponsorId=1627251&sponsorLnb=sponsor-detail'
    )
    expect(
      buildSponsorDetailPageUrl('1627251', { organizationKind: 'foundation' })
    ).toBe('/sponsor?sp_kind=foundation&sponsorId=1627251&sponsorLnb=sponsor-detail')
  })

  it('appends sanitized returnTo', () => {
    const url = buildSponsorDetailPageUrl('1627251', {
      organizationKind: 'corporate',
      returnTo: '/programs/general?programId=1&lnb=info&tab=info',
    })
    expect(url).toContain('sp_kind=corporate')
    expect(url).toContain('sponsorId=1627251')
    expect(url).toContain('sponsorLnb=sponsor-detail')
    expect(url).toContain(
      `returnTo=${encodeURIComponent('/programs/general?programId=1&lnb=info&tab=info')}`
    )
  })

  it('normalizes organization kind', () => {
    expect(normalizeSponsorOrganizationKind('foundation')).toBe('foundation')
    expect(normalizeSponsorOrganizationKind('corporate')).toBe('corporate')
    expect(normalizeSponsorOrganizationKind(undefined)).toBe('corporate')
  })

  it('rejects open redirects in returnTo', () => {
    expect(sanitizeInternalReturnTo('https://evil.example')).toBeNull()
    expect(sanitizeInternalReturnTo('//evil.example')).toBeNull()
    expect(sanitizeInternalReturnTo('/programs/general')).toBe('/programs/general')
  })
})
