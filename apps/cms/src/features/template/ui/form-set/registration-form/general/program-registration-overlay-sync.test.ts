import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProgramRegistrationOverlayRecord,
  getProgramRegistrationOverlayVersion,
  patchProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
  subscribeProgramRegistrationOverlayKey,
  updateProgramRegistrationOverlayKey,
} from './program-registration-overlay-sync'

afterEach(() => {
  resetProgramRegistrationOverlay()
})

describe('program-registration-overlay-sync', () => {
  it('같은 값으로 patch하면 overlay 버전을 올리지 않는다', () => {
    patchProgramRegistrationOverlay({ k: 'a' })
    const version = getProgramRegistrationOverlayVersion()
    patchProgramRegistrationOverlay({ k: 'a' })
    expect(getProgramRegistrationOverlayVersion()).toBe(version)
    expect(getProgramRegistrationOverlayRecord().k).toBe('a')
  })

  it('updater가 같은 참조를 반환하면 overlay 버전을 올리지 않는다', () => {
    const lines = ['line']
    updateProgramRegistrationOverlayKey<string[]>('lines', () => lines)
    const version = getProgramRegistrationOverlayVersion()
    updateProgramRegistrationOverlayKey<string[]>('lines', prev => prev ?? lines)
    expect(getProgramRegistrationOverlayVersion()).toBe(version)
  })

  it('키별 구독은 변경된 키의 listener만 호출한다', () => {
    const titleListener = vi.fn()
    const otherListener = vi.fn()
    const unsubTitle = subscribeProgramRegistrationOverlayKey('title', titleListener)
    const unsubOther = subscribeProgramRegistrationOverlayKey('other', otherListener)

    patchProgramRegistrationOverlay({ title: 'A' })
    expect(titleListener).toHaveBeenCalledTimes(1)
    expect(otherListener).not.toHaveBeenCalled()

    patchProgramRegistrationOverlay({ other: 'B' })
    expect(titleListener).toHaveBeenCalledTimes(1)
    expect(otherListener).toHaveBeenCalledTimes(1)

    unsubTitle()
    unsubOther()
  })
})
