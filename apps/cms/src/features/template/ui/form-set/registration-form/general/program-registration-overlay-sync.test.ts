import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  registerGeneralRegistrationWizardRhf,
  type GeneralRegistrationWizardRhfApi,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { createDefaultRegistrationWizardUiValues } from '@/features/program/general/lib/overlay-phase1/registration-wizard-ui-values'
import {
  registerTrainedTeachersRegistrationRhf,
  type TrainedTeachersRegistrationRhfApi,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import { createDefaultTrainedTeachersRegistrationRhfValues } from '@/features/program/trained-teachers/lib/registration-rhf-values'
import {
  getProgramRegistrationOverlayRecord,
  getProgramRegistrationOverlayVersion,
  hydrateRegistrationDraftProgramTitleKo,
  patchProgramRegistrationOverlay,
  patchRegistrationOverlayProgramTitleKo,
  peekProgramRegistrationOverlayRecord,
  readGeneralRegistrationOverlayScheduleLines,
  readGeneralRegistrationOverlaySponsorContactId,
  readGeneralRegistrationOverlaySponsorId,
  readRegistrationOverlayProgramTitleKo,
  readStoredRegistrationProgramTitleKo,
  readTrainedTeachersRegistrationOverlayProgramTitleKo,
  resetProgramRegistrationOverlayStoreForTests,
  setProgramRegistrationOverlayScope,
  subscribeProgramRegistrationOverlayKey,
  subscribeProgramRegistrationOverlayKeys,
  updateProgramRegistrationOverlayKey,
} from './program-registration-overlay-sync'

afterEach(() => {
  registerGeneralRegistrationWizardRhf(null)
  registerTrainedTeachersRegistrationRhf(null)
  resetProgramRegistrationOverlayStoreForTests()
})

function mockWizardRhf(
  values = createDefaultRegistrationWizardUiValues()
): GeneralRegistrationWizardRhfApi {
  return {
    getValues: () => values,
    getPath: () => undefined,
    setPath: vi.fn(),
    reset: vi.fn(),
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
  }
}

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

  it('다중 키 구독은 listed 키 변경 시만 listener를 호출한다', () => {
    const listener = vi.fn()
    const unsub = subscribeProgramRegistrationOverlayKeys(['a', 'b'], listener)

    patchProgramRegistrationOverlay({ title: 'ignored' })
    expect(listener).not.toHaveBeenCalled()

    patchProgramRegistrationOverlay({ a: 1 })
    expect(listener).toHaveBeenCalledTimes(1)

    patchProgramRegistrationOverlay({ b: 2 })
    expect(listener).toHaveBeenCalledTimes(2)

    unsub()
  })

  it('isolates values by templateCode and keeps persist keys unprefixed', () => {
    setProgramRegistrationOverlayScope('registration-general-custom-01')
    patchProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localProgramTitleKo': 'A 등록',
    })

    setProgramRegistrationOverlayScope('registration-general-custom-02')
    expect(
      getProgramRegistrationOverlayRecord()['generalRegistration.basicInfo.localProgramTitleKo']
    ).toBeUndefined()

    setProgramRegistrationOverlayScope('registration-general-custom-01')
    expect(
      getProgramRegistrationOverlayRecord()['generalRegistration.basicInfo.localProgramTitleKo']
    ).toBe('A 등록')

    const overlay = collectOperationalOverlayForCatalogId('registration-general-custom-01')
    expect(overlay).toEqual({
      'generalRegistration.basicInfo.localProgramTitleKo': 'A 등록',
    })
    expect(Object.keys(overlay ?? {}).some(key => key.includes('custom-01'))).toBe(false)
    expect(peekProgramRegistrationOverlayRecord('registration-general-custom-02')).toEqual({})
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

  it('키가 있으면 빈 국문명도 React state fallback보다 우선한다', () => {
    patchProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localProgramTitleKo': '',
    })
    expect(readStoredRegistrationProgramTitleKo('general', '이전 제목')).toBe('')
  })

  it('키가 없으면 React state fallback을 쓴다', () => {
    expect(readStoredRegistrationProgramTitleKo('general', '이전 제목')).toBe('이전 제목')
  })

  it('일반 위저드 RHF가 있으면 overlay 빈 후원사·일정줄보다 RHF를 쓴다', () => {
    const values = createDefaultRegistrationWizardUiValues()
    values.sponsorId = '163001'
    values.sponsorIds = ['163001', '163002']
    values.managerContactId = '163001::c1'
    values.managerContactIds = ['163001::c1']
    values.scheduleLines = ['2026-03-01 10:00~11:00']
    registerGeneralRegistrationWizardRhf(mockWizardRhf(values))
    patchProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localSponsorId': '',
      'generalRegistration.basicInfo.localSponsorIds': [],
      'generalRegistration.basicInfo.localManagerContactId': '',
      'generalRegistration.educationScheduleSettings.scheduleLines': [],
    })
    expect(readGeneralRegistrationOverlaySponsorId()).toBe('163001')
    expect(readGeneralRegistrationOverlaySponsorContactId()).toBe('163001::c1')
    expect(readGeneralRegistrationOverlayScheduleLines()).toEqual(['2026-03-01 10:00~11:00'])
  })

  it('일반 위저드 RHF가 있으면 overlay 빈 키보다 국문 대표명을 쓴다', () => {
    const values = createDefaultRegistrationWizardUiValues()
    values.programTitleKo = 'RHF 국문 대표명'
    registerGeneralRegistrationWizardRhf(mockWizardRhf(values))
    patchProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localProgramTitleKo': '',
    })
    expect(readStoredRegistrationProgramTitleKo('general', '이전 제목')).toBe('RHF 국문 대표명')
    expect(readRegistrationOverlayProgramTitleKo('general')).toBe('RHF 국문 대표명')
  })

  it('continue hydrate payload programTitleKo를 overlay에 반영한다', () => {
    patchRegistrationOverlayProgramTitleKo('general', '이어서 작성 프로그램명')
    expect(readRegistrationOverlayProgramTitleKo('general')).toBe('이어서 작성 프로그램명')
    expect(readStoredRegistrationProgramTitleKo('general')).toBe('이어서 작성 프로그램명')
  })

  it('1사1교 제목은 미사용 programTitleKo state로 덮지 않는다', () => {
    patchProgramRegistrationOverlay({
      'economyRegistration.basicInfo.repKo': '디지털 리터러시 교실',
    })
    patchRegistrationOverlayProgramTitleKo('economy', '')
    expect(readRegistrationOverlayProgramTitleKo('economy')).toBe('디지털 리터러시 교실')
  })

  it('TT RHF 활성 시 국문 대표명은 mainTitle이다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.mainTitle = '임시저장-대표명-A'
    values.announcementTitle = '임시저장-공고명-B'
    values.title = '임시저장-공고명-B'
    registerTrainedTeachersRegistrationRhf(mockTtRhf(values))
    expect(readTrainedTeachersRegistrationOverlayProgramTitleKo()).toBe('임시저장-대표명-A')
    expect(readStoredRegistrationProgramTitleKo('trainedTeachers')).toBe('임시저장-대표명-A')
  })

  it('TT patch는 mainTitle만 바꾸고 title·announcementTitle을 건드리지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.mainTitle = '대표명-원본'
    values.announcementTitle = '공고명-원본'
    values.title = '공고명-원본'
    const rhf = mockTtRhf(values)
    registerTrainedTeachersRegistrationRhf(rhf)
    patchRegistrationOverlayProgramTitleKo('trainedTeachers', '세션메타-공고명')
    expect(rhf.getValues().mainTitle).toBe('세션메타-공고명')
    expect(rhf.getValues().title).toBe('공고명-원본')
    expect(rhf.getValues().announcementTitle).toBe('공고명-원본')
  })

  it('TT 세션 메타 hydrate는 canonical mainTitle을 덮지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.mainTitle = '임시저장-대표명-A'
    values.announcementTitle = '임시저장-공고명-B'
    const rhf = mockTtRhf(values)
    registerTrainedTeachersRegistrationRhf(rhf)
    hydrateRegistrationDraftProgramTitleKo('trainedTeachers', '임시저장-공고명-B')
    expect(rhf.getValues().mainTitle).toBe('임시저장-대표명-A')
    expect(rhf.getValues().announcementTitle).toBe('임시저장-공고명-B')
  })
})

function mockTtRhf(
  values = createDefaultTrainedTeachersRegistrationRhfValues()
): TrainedTeachersRegistrationRhfApi {
  let current = { ...values }
  return {
    getValues: () => current,
    getPath: path => (current as Record<string, unknown>)[path],
    setPath: (path, value) => {
      current = { ...current, [path]: value }
    },
    reset: next => {
      current = next
    },
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
  }
}
