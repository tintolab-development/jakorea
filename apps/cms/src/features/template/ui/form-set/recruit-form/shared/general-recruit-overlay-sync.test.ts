import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getGeneralRecruitOverlayRecord,
  getGeneralRecruitOverlayVersion,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
  subscribeGeneralRecruitOverlayKey,
  updateGeneralRecruitOverlayKey,
} from './general-recruit-overlay-sync'

afterEach(() => {
  resetGeneralRecruitOverlay()
})

describe('general-recruit-overlay-sync', () => {
  it('같은 값으로 patch하면 overlay 버전을 올리지 않는다', () => {
    patchGeneralRecruitOverlay({ k: 'a' })
    const version = getGeneralRecruitOverlayVersion()
    patchGeneralRecruitOverlay({ k: 'a' })
    expect(getGeneralRecruitOverlayVersion()).toBe(version)
    expect(getGeneralRecruitOverlayRecord().k).toBe('a')
  })

  it('updater가 같은 참조를 반환하면 overlay 버전을 올리지 않는다', () => {
    const names = ['file.pdf']
    updateGeneralRecruitOverlayKey<string[]>('names', () => names)
    const version = getGeneralRecruitOverlayVersion()
    updateGeneralRecruitOverlayKey<string[]>('names', prev => prev ?? names)
    expect(getGeneralRecruitOverlayVersion()).toBe(version)
  })

  it('키별 구독은 변경된 키의 listener만 호출한다', () => {
    const titleListener = vi.fn()
    const otherListener = vi.fn()
    const unsubTitle = subscribeGeneralRecruitOverlayKey('title', titleListener)
    const unsubOther = subscribeGeneralRecruitOverlayKey('other', otherListener)

    patchGeneralRecruitOverlay({ title: 'A' })
    expect(titleListener).toHaveBeenCalledTimes(1)
    expect(otherListener).not.toHaveBeenCalled()

    patchGeneralRecruitOverlay({ other: 'B' })
    expect(titleListener).toHaveBeenCalledTimes(1)
    expect(otherListener).toHaveBeenCalledTimes(1)

    unsubTitle()
    unsubOther()
  })
})
