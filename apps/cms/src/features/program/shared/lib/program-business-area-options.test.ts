import { describe, expect, it } from 'vitest'
import { businessAreaCatalogState, resolveProgramBusinessAreaOptions } from './program-business-area-options'
import { normalizeProgramBusinessAreaValue, resolveStoredBusinessArea } from './program-detail-info-constants'
import { businessAreaToProgramValue } from '@/features/program/general/lib/overlay-phase1/common-info-domain'

describe('dynamic program business area catalog', () => {
  it('keeps legacy codes for existing areas while selecting new canonical names', () => {
    const state = { kind: 'ready', names: ['경제금융', '디지털금융 교육', '새 사업분야'] } as const
    expect(resolveProgramBusinessAreaOptions(state, 'economy_finance', 'form')).toEqual([
      { value: 'economy_finance', label: '경제금융' },
      { value: '디지털금융 교육', label: '디지털금융 교육' },
      { value: '새 사업분야', label: '새 사업분야' },
    ])
    expect(businessAreaToProgramValue('새 사업분야')).toBe('새 사업분야')
    expect(resolveStoredBusinessArea('새 사업분야')).toBe('새 사업분야')
    expect(resolveStoredBusinessArea('career_employment')).toBe('진로취업')
    expect(resolveStoredBusinessArea('')).toBe('')
    expect(normalizeProgramBusinessAreaValue('constructor')).toBe('constructor')
  })

  it('does not restore obsolete static names or replace existing selections', () => {
    expect(resolveProgramBusinessAreaOptions({ kind: 'ready', names: ['경제교육'] }, 'economy_finance', 'form'))
      .toEqual([{ value: 'economy_finance', label: '경제금융', disabled: true },
        { value: '경제교육', label: '경제교육' }])
    expect(resolveProgramBusinessAreaOptions({ kind: 'ready', names: [] }, undefined, 'form')).toEqual([])
    expect(resolveProgramBusinessAreaOptions({ kind: 'ready', names: ['경제금융'] }, '경제금융', 'form'))
      .toEqual([{ value: '경제금융', label: '경제금융' }])
  })

  it('does not leak stale catalog results after access denial or network failure', () => {
    const names = ['new secret catalog value']
    const denied = businessAreaCatalogState({ enabled: true, failed: true, forbidden: true, names })
    expect(denied.kind).toBe('legacy')
    expect(resolveProgramBusinessAreaOptions(denied, '', 'form').some(o => o.label === names[0])).toBe(false)
    const unavailable = businessAreaCatalogState({ enabled: true, failed: true, forbidden: false, names })
    expect(resolveProgramBusinessAreaOptions(unavailable, '현재 분야', 'master'))
      .toEqual([{ value: '현재 분야', label: '현재 분야', disabled: true }])
    expect(businessAreaCatalogState({ enabled: true, failed: false, forbidden: false })).toEqual({ kind: 'loading' })
    expect(businessAreaCatalogState({ enabled: false, failed: false, forbidden: false, names })).toEqual({ kind: 'legacy' })
  })
})
