import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProgramRegistrationOverlayRecord,
  getProgramRegistrationOverlayVersion,
  patchProgramRegistrationOverlay,
  patchRegistrationOverlayProgramTitleKo,
  readRegistrationOverlayProgramTitleKo,
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

describe('readRegistrationOverlayProgramTitleKo', () => {
  it('1사1교는 작성한 국문 대표명(repKo)을 임시저장 제목으로 쓴다', () => {
    patchProgramRegistrationOverlay({
      'economyRegistration.basicInfo.repKo': '디지털 리터러시 교실',
      'generalRegistration.basicInfo.localProgramTitleKo': '일반 제목',
    })
    expect(readRegistrationOverlayProgramTitleKo('economy')).toBe('디지털 리터러시 교실')
  })

  it('1사1교에서 제목을 아직 안 바꿨으면 화면 기본 대표명을 쓴다', () => {
    expect(readRegistrationOverlayProgramTitleKo('economy')).toBe('1사1교 경제금융교육')
  })

  it('1사1교 제목은 미사용 programTitleKo state로 덮지 않는다', () => {
    patchProgramRegistrationOverlay({
      'economyRegistration.basicInfo.repKo': '디지털 리터러시 교실',
    })
    patchRegistrationOverlayProgramTitleKo('economy', '')
    expect(readRegistrationOverlayProgramTitleKo('economy')).toBe('디지털 리터러시 교실')
  })
})
