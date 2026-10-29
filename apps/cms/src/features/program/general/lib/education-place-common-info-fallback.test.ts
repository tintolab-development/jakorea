/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { GeneralProgramCommonInfoExtension, Program } from '@/types/domain'
import {
  educationPlaceFromGeneralCommonInfo,
  overlayWithEducationPlaceCommonInfoFallback,
} from './education-place-common-info-fallback'
import { hydrateRegistrationWizardUiValues } from './overlay-phase1/registration-wizard-legacy-hydrate'
import { programToGeneralCommonInfoEditValues } from '@/features/program/general/model/common-info-edit-schema'

const ADDRESS = 'generalRegistration.typeSettings.educationPlaceAddress'
const PLACE_DETAIL = 'generalRegistration.typeSettings.educationPlaceScheduleDetail'
const BY_SESSION = 'generalRegistration.educationCurriculum.educationPlaceBySession'
const BY_DETAIL = 'generalRegistration.educationScheduleCurriculum.educationPlaceByDetail'

const perScheduleWithPre: GeneralProgramCommonInfoExtension = {
  educationPlaceScheduleDetail: 'perSchedule',
  educationPlaceAddress: null,
  curriculumSessions: [
    {
      sessionNo: 0,
      sessionLabel: '사전 교육',
      title: '사전',
      description: '',
      isPreEducation: true,
      educationPlaceAddress: '사전 주소',
    },
    {
      sessionNo: 1,
      sessionLabel: '1회차',
      title: '단원1',
      description: '',
      educationPlaceAddress: ' 1회차 주소 ',
    },
    {
      sessionNo: 2,
      sessionLabel: '2회차',
      title: '단원2',
      description: '',
      educationPlaceAddress: '2회차 주소',
    },
  ],
} as GeneralProgramCommonInfoExtension

describe('educationPlaceFromGeneralCommonInfo — BE 복사본 → overlay 행 키', () => {
  it('사전 교육 ON: 작성 배열 i → 키 i, 사전 교육 행은 건너뛴다', () => {
    expect(educationPlaceFromGeneralCommonInfo(perScheduleWithPre)).toEqual({
      scheduleDetail: 'perSchedule',
      bySession: { 1: '1회차 주소', 2: '2회차 주소' },
      byDetail: {},
    })
  })

  it('사전 교육 OFF: 작성 배열 i → 키 i + 1 (일정형)', () => {
    const common = {
      educationPlaceScheduleDetail: 'perSchedule',
      scheduleDetails: [
        {
          scheduleLabel: '세부 일정 01',
          blockKind: 'sub',
          name: 'A',
          educationPlaceAddress: 'A 주소',
        },
        {
          scheduleLabel: '세부 일정 02',
          blockKind: 'sub',
          name: 'B',
          educationPlaceAddress: 'B 주소',
        },
      ],
    } as unknown as GeneralProgramCommonInfoExtension
    expect(educationPlaceFromGeneralCommonInfo(common).byDetail).toEqual({
      1: 'A 주소',
      2: 'B 주소',
    })
  })

  it('common이면 공통 주소만, 행 값은 싣지 않는다', () => {
    const common = {
      ...perScheduleWithPre,
      educationPlaceScheduleDetail: 'common',
      educationPlaceAddress: ' 서울 중구 ',
    } as GeneralProgramCommonInfoExtension
    expect(educationPlaceFromGeneralCommonInfo(common)).toEqual({
      scheduleDetail: 'common',
      address: '서울 중구',
      bySession: {},
      byDetail: {},
    })
  })

  it('모드 없이 주소만 있으면 common, 아무것도 없으면 미설정', () => {
    expect(
      educationPlaceFromGeneralCommonInfo({
        educationPlaceAddress: '부산',
      } as GeneralProgramCommonInfoExtension).scheduleDetail
    ).toBe('common')
    expect(educationPlaceFromGeneralCommonInfo({}).scheduleDetail).toBeUndefined()
    expect(overlayWithEducationPlaceCommonInfoFallback({ a: 1 }, {})).toEqual({ a: 1 })
  })
})

describe('overlayWithEducationPlaceCommonInfoFallback — 우선순위', () => {
  it('overlay에 장소 값이 있으면 overlay가 정본', () => {
    const overlay = { [PLACE_DETAIL]: 'common', [ADDRESS]: 'overlay 주소' }
    expect(overlayWithEducationPlaceCommonInfoFallback(overlay, perScheduleWithPre)).toBe(overlay)
  })

  it('overlay에 없으면 generalCommonInfo로 채우고 입력 overlay는 바꾸지 않는다', () => {
    const overlay = { other: 'x' }
    const next = overlayWithEducationPlaceCommonInfoFallback(overlay, perScheduleWithPre)
    expect(next).toEqual({
      other: 'x',
      [PLACE_DETAIL]: 'perSchedule',
      [BY_SESSION]: { 1: '1회차 주소', 2: '2회차 주소' },
    })
    expect(overlay).toEqual({ other: 'x' })
    expect(next).not.toHaveProperty(BY_DETAIL)
  })
})

describe('재조회 fallback 적용 지점', () => {
  it('등록 위저드 hydrate', () => {
    const hydrated = hydrateRegistrationWizardUiValues({
      overlay: {},
      generalCommonInfo: perScheduleWithPre,
    })
    expect(hydrated.educationPlaceScheduleDetail).toBe('perSchedule')
    expect(hydrated.educationPlaceBySession).toEqual({ 1: '1회차 주소', 2: '2회차 주소' })
  })

  it('상세 공통 정보 편집 값', () => {
    const program = {
      id: 'p-1',
      title: '개인',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalCommonInfo: perScheduleWithPre,
      registrationOverlay: {},
      rounds: [],
    } as unknown as Program
    const values = programToGeneralCommonInfoEditValues(program)
    expect(values.educationPlaceScheduleDetail).toBe('perSchedule')
    const places = values.curriculumSessions.map(session => session.educationPlace)
    expect(places).toEqual([undefined, '1회차 주소', '2회차 주소'])
  })
})
