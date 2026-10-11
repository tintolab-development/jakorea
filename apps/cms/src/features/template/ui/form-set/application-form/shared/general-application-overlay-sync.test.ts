import { afterEach, describe, expect, it } from 'vitest'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  peekGeneralApplicationOverlayRecord,
  resetGeneralApplicationOverlayStoreForTests,
  setGeneralApplicationOverlayScope,
} from './general-application-overlay-sync'

afterEach(() => {
  resetGeneralApplicationOverlayStoreForTests()
})

describe('general-application-overlay-sync scope isolation', () => {
  it('isolates values by templateCode and keeps persist keys unprefixed', () => {
    setGeneralApplicationOverlayScope('application-instructor-custom-01')
    patchGeneralApplicationOverlay({
      'application.instructor.memo': 'A 신청',
    })

    setGeneralApplicationOverlayScope('application-instructor-custom-02')
    expect(getGeneralApplicationOverlayRecord()['application.instructor.memo']).toBeUndefined()

    setGeneralApplicationOverlayScope('application-instructor-custom-01')
    expect(getGeneralApplicationOverlayRecord()['application.instructor.memo']).toBe('A 신청')

    const overlay = collectOperationalOverlayForCatalogId('application-instructor-custom-01')
    expect(overlay).toEqual({
      'application.instructor.memo': 'A 신청',
    })
    expect(Object.keys(overlay ?? {}).some(key => key.includes('custom-01'))).toBe(false)
    expect(peekGeneralApplicationOverlayRecord('application-instructor-custom-02')).toEqual({})
  })
})
