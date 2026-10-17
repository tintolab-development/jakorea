/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { useRegistrationCatalogReady } from './use-registration-catalog-ready'

afterEach(() => {
  resetProgramRegistrationOverlay()
})

describe('useRegistrationCatalogReady', () => {
  it('overlay에 sponsorIds가 있으면 초기 catalogReady가 true다', () => {
    replaceProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localSponsorIds': ['163001'],
    })
    const { result } = renderHook(() =>
      useRegistrationCatalogReady({ overlayBasicInfoPrefix: 'generalRegistration.basicInfo' })
    )
    expect(result.current.catalogReady).toBe(true)
  })

  it('overlay가 비어 있으면 open 시에만 catalogReady가 켜진다', () => {
    const { result } = renderHook(() =>
      useRegistrationCatalogReady({ overlayBasicInfoPrefix: 'generalRegistration.basicInfo' })
    )
    expect(result.current.catalogReady).toBe(false)
    act(() => {
      result.current.onSelectOpenChange(true)
    })
    expect(result.current.catalogReady).toBe(true)
  })
})
