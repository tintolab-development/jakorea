import { describe, expect, it } from 'vitest'
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
