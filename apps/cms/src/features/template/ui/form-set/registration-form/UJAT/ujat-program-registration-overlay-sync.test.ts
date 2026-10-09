import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getUjatProgramRegistrationOverlayVersion,
  patchUjatProgramRegistrationOverlay,
  resetUjatProgramRegistrationOverlay,
  subscribeUjatProgramRegistrationOverlayKey,
} from './ujat-program-registration-overlay-sync'

afterEach(() => {
  resetUjatProgramRegistrationOverlay()
})

describe('ujat-program-registration-overlay-sync', () => {
  it('같은 값으로 patch하면 overlay 버전을 올리지 않는다', () => {
    patchUjatProgramRegistrationOverlay({ title: 'A' })
    const version = getUjatProgramRegistrationOverlayVersion()
    patchUjatProgramRegistrationOverlay({ title: 'A' })
    expect(getUjatProgramRegistrationOverlayVersion()).toBe(version)
  })

  it('키별 구독은 변경된 키의 listener만 호출한다', () => {
    const titleListener = vi.fn()
    const otherListener = vi.fn()
    const unsubTitle = subscribeUjatProgramRegistrationOverlayKey('ujat.basicInfo.repKo', titleListener)
    const unsubOther = subscribeUjatProgramRegistrationOverlayKey('ujat.basicInfo.repEn', otherListener)

    patchUjatProgramRegistrationOverlay({ 'ujat.basicInfo.repKo': '가나다' })
    expect(titleListener).toHaveBeenCalledTimes(1)
    expect(otherListener).not.toHaveBeenCalled()

    unsubTitle()
    unsubOther()
  })
})
