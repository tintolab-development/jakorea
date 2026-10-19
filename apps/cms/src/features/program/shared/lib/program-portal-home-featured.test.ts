import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  applyPortalHomeFeaturedToRequest,
  parsePortalHomeDisplayOrder,
  portalHomeFeaturedFormValues,
  portalHomeFeaturedProgramPatch,
} from './program-portal-home-featured'

const program = {
  featuredOnHome: true,
  homeDisplayOrder: 3,
} as Program

describe('program-portal-home-featured', () => {
  it('parses 1+ integers only', () => {
    expect(parsePortalHomeDisplayOrder(1)).toBe(1)
    expect(parsePortalHomeDisplayOrder('2')).toBe(2)
    expect(parsePortalHomeDisplayOrder(0)).toBeNull()
    expect(parsePortalHomeDisplayOrder('')).toBeNull()
  })

  it('maps form values and patch', () => {
    expect(portalHomeFeaturedFormValues(program)).toEqual({
      featuredOnHome: true,
      homeDisplayOrder: '3',
    })
    expect(
      portalHomeFeaturedProgramPatch({ featuredOnHome: false, homeDisplayOrder: '3' })
    ).toEqual({ featuredOnHome: false, homeDisplayOrder: null })
  })

  it('sends full create/update fields and clears order when featured is off', () => {
    const body: Parameters<typeof applyPortalHomeFeaturedToRequest>[0] = {}
    applyPortalHomeFeaturedToRequest(body, program, 'full')
    expect(body).toEqual({ featuredOnHome: true, homeDisplayOrder: 3 })

    const off: Parameters<typeof applyPortalHomeFeaturedToRequest>[0] = {}
    applyPortalHomeFeaturedToRequest(off, { ...program, featuredOnHome: false }, 'full')
    expect(off.featuredOnHome).toBe(false)
    expect(off.homeDisplayOrder).toBeNull()
  })

  it('omits PATCH when keys are untouched and clears order when ON without a number', () => {
    const skipped: Parameters<typeof applyPortalHomeFeaturedToRequest>[0] = {}
    applyPortalHomeFeaturedToRequest(skipped, program, 'patch', { title: 'only title' })
    expect(skipped.featuredOnHome).toBeUndefined()

    const cleared: Parameters<typeof applyPortalHomeFeaturedToRequest>[0] = {}
    applyPortalHomeFeaturedToRequest(
      cleared,
      { ...program, homeDisplayOrder: null },
      'patch',
      { featuredOnHome: true, homeDisplayOrder: null }
    )
    expect(cleared.featuredOnHome).toBe(true)
    expect(cleared.homeDisplayOrder).toBeNull()
    expect(cleared.clearFields).toEqual(['homeDisplayOrder'])
  })
})
