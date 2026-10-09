import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  getGeneralRecruitOverlayRecord,
  getGeneralRecruitOverlayVersion,
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  resetGeneralRecruitOverlay,
  resetGeneralRecruitOverlayStoreForTests,
  setGeneralRecruitOverlayScope,
  subscribeGeneralRecruitOverlayKey,
  updateGeneralRecruitOverlayKey,
} from './general-recruit-overlay-sync'

afterEach(() => {
  resetGeneralRecruitOverlayStoreForTests()
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

  it('isolates values by templateCode and keeps persist keys unprefixed', () => {
    setGeneralRecruitOverlayScope('recruitment-instructor-custom-01')
    patchGeneralRecruitOverlay({
      'recruitInstructor.detailInfo.programDescription': '<p>A 상세</p>',
    })

    setGeneralRecruitOverlayScope('recruitment-instructor-custom-02')
    expect(getGeneralRecruitOverlayRecord()['recruitInstructor.detailInfo.programDescription']).toBe(
      undefined
    )

    setGeneralRecruitOverlayScope('recruitment-instructor-custom-01')
    expect(getGeneralRecruitOverlayRecord()['recruitInstructor.detailInfo.programDescription']).toBe(
      '<p>A 상세</p>'
    )

    const overlay = collectOperationalOverlayForCatalogId('recruitment-instructor-custom-01')
    expect(overlay).toEqual({
      'recruitInstructor.detailInfo.programDescription': '<p>A 상세</p>',
    })
    expect(Object.keys(overlay ?? {}).some(key => key.includes('custom-01'))).toBe(false)
    expect(peekGeneralRecruitOverlayRecord('recruitment-instructor-custom-02')).toEqual({})
  })

  it('신규 등록 진입 시 이전 위저드의 비활성 모집 버킷까지 비운다', () => {
    setGeneralRecruitOverlayScope('recruitment-instructor')
    patchGeneralRecruitOverlay({ 'recruitInstructor.title': '이전 등록' })
    setGeneralRecruitOverlayScope('recruitment-volunteer')
    patchGeneralRecruitOverlay({ 'recruitVolunteer.title': '이전 봉사자' })
    resetGeneralRecruitOverlay()
    expect(peekGeneralRecruitOverlayRecord('recruitment-instructor')['recruitInstructor.title']).toBe(
      '이전 등록'
    )

    resetAllOperationalOverlayStores()
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-instructor')['recruitInstructor.title']
    ).toBeUndefined()
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-volunteer')['recruitVolunteer.title']
    ).toBeUndefined()
  })
})
