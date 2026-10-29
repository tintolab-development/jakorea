/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { buildGeneralProgramPortalPreview } from './platform-preview-payload'

const ADDRESS = 'generalRegistration.typeSettings.educationPlaceAddress'
const PLACE_DETAIL = 'generalRegistration.typeSettings.educationPlaceScheduleDetail'
const BY_DETAIL = 'generalRegistration.educationScheduleCurriculum.educationPlaceByDetail'
const BY_SESSION = 'generalRegistration.educationCurriculum.educationPlaceBySession'
const SINGLE_FORM = 'generalRegistration.typeSettings.singleEducationForm'
const MULTI_FORM = 'generalRegistration.typeSettings.multiCommonEducationForm'

function individualProgram(patch: Partial<Program>): Program {
  return {
    id: '4100',
    title: '개인 교육',
    rounds: [],
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    generalProgramAudience: 'individual',
    generalParticipantTypes: ['individual'],
    ...patch,
  } as unknown as Program
}

describe('미리보기 — 개인 일반 「교육 진행 장소」', () => {
  it('common: 공통 주소가 venue보다 앞서고 모드·주소 필드를 싣는다', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'individuals',
      program: individualProgram({
        venue: '기존 venue',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'single',
        generalCommonInfo: {
          educationFormLabel: '오프라인',
          educationFormScheduleDetail: 'common',
          curriculumSessions: [
            { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '' },
          ],
        },
        registrationOverlay: {
          [SINGLE_FORM]: 'offline',
          [PLACE_DETAIL]: 'common',
          [ADDRESS]: '  서울 중구 세종대로 110 ',
        },
      }),
    })
    expect(detail.venue).toBe('서울 중구 세종대로 110')
    expect(detail.educationPlaceScheduleDetail).toBe('common')
    expect(detail.educationPlaceAddress).toBe('서울 중구 세종대로 110')
    // common + 공통 주소 — 커리큘럼 행은 싣되 행별 장소는 없음(기본정보에 한 번)
    expect(detail.educationStructure).toBe('curriculum')
    expect(detail.sessionRound).toBe('single')
    expect(detail.curriculumSessions).toEqual([{ sessionLabel: '1차시', title: '단원1' }])
  })

  function curriculumProgram(overlay: Record<string, unknown>, formValue = 'offline'): Program {
    return individualProgram({
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalCommonInfo: {
        educationFormLabel: formValue === 'online' ? '온라인' : '오프라인',
        educationFormScheduleDetail: 'common',
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '2차시', description: '기초' },
          { sessionNo: 2, sessionLabel: '2회차', title: '3차시', description: '' },
        ],
      },
      registrationOverlay: { [MULTI_FORM]: formValue, ...overlay },
    } as Partial<Program>)
  }

  it('common + 공통 주소(복수 회차): BE와 같은 행 모양 — 제목 「N차시」, sessionRound multi', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'individuals',
      program: curriculumProgram({ [PLACE_DETAIL]: 'common', [ADDRESS]: '서울시 중구 세종대로 110' }),
    })
    expect(detail.venue).toBe('서울시 중구 세종대로 110')
    expect(detail.sessionRound).toBe('multi')
    expect(detail.curriculumSessions).toEqual([
      { sessionLabel: '1회차', title: '2차시', description: '기초' },
      { sessionLabel: '2회차', title: '3차시' },
    ])
  })

  it.each([
    ['온라인(장소 숨김)', curriculumProgram({ [PLACE_DETAIL]: 'common', [ADDRESS]: '서울' }, 'online')],
    ['common 주소 미입력(작성 중)', curriculumProgram({ [PLACE_DETAIL]: 'common', [ADDRESS]: '  ' })],
    ['장소 미설정(구버전)', curriculumProgram({})],
  ])('%s: 커리큘럼 행 투영 없음(기존 그대로)', (_label, program) => {
    const detail = buildGeneralProgramPortalPreview({ audience: 'individuals', program })
    expect(detail.educationStructure).toBeUndefined()
    expect(detail.curriculumSessions).toBeUndefined()
  })

  it('perSchedule 커리큘럼: curriculumSessions 교육 차시에만 주소(사전·연수 행 제외, 키 1부터)', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'individuals',
      program: individualProgram({
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          educationFormLabel: '오프라인',
          educationFormScheduleDetail: 'common',
          curriculumSessions: [
            { sessionNo: 0, sessionLabel: '사전 교육', title: '오리엔테이션', description: '' },
            { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '기초' },
            { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '' },
            { sessionNo: 3, sessionLabel: '', title: '', description: '' },
          ],
        },
        registrationOverlay: {
          [MULTI_FORM]: 'offline',
          [PLACE_DETAIL]: 'perSchedule',
          [BY_SESSION]: { 0: '사전 주소', 1: ' 1회차 주소 ', 2: '' },
        },
      } as Partial<Program>),
    })
    expect(detail.educationPlaceScheduleDetail).toBe('perSchedule')
    expect(detail.educationPlaceAddress).toBeNull()
    expect(detail.educationStructure).toBe('curriculum')
    expect(detail.sessionRound).toBe('multi')
    expect(detail.curriculumSessions).toEqual([
      { sessionLabel: '사전 교육', title: '오리엔테이션' },
      { sessionLabel: '1회차', title: '단원1', description: '기초', educationPlaceAddress: '1회차 주소' },
      { sessionLabel: '2회차', title: '단원2' },
    ])
    // 운영 legacy curricula는 그대로
    expect(detail.curricula?.[0]?.sessions).toHaveLength(3)
  })

  it('perSchedule: 공통 주소는 null, 교육 일정 행에만 주소(사전 교육 제외)', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'individuals',
      program: individualProgram({
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          educationFormLabel: '오프라인',
          educationFormScheduleDetail: 'common',
          scheduleDetails: [
            {
              scheduleLabel: '사전 교육',
              blockKind: 'preEducation',
              name: '사전',
              scheduleDateLabel: '2026년 11월 1일(일) 10:00 ~ 12:00',
            },
            {
              scheduleLabel: '세부 일정 01',
              blockKind: 'sub',
              name: 'A',
              scheduleDateLabel: '2026년 11월 2일(월) 10:00 ~ 12:00',
            },
            {
              scheduleLabel: '세부 일정 02',
              blockKind: 'sub',
              name: 'B',
              scheduleDateLabel: '2026년 11월 9일(월) 10:00 ~ 12:00',
            },
          ],
        },
        registrationOverlay: {
          [MULTI_FORM]: 'offline',
          [PLACE_DETAIL]: 'perSchedule',
          [ADDRESS]: '숨겨진 공통 주소',
          [BY_DETAIL]: { 0: '사전 주소', 1: ' A 주소 ', 2: 'B 주소' },
        },
      } as Partial<Program>),
    })
    expect(detail.educationPlaceScheduleDetail).toBe('perSchedule')
    expect(detail.educationPlaceAddress).toBeNull()
    expect(detail.venue).toBeUndefined()
    expect(detail.schedules?.map(row => row.address)).toEqual([undefined, 'A 주소', 'B 주소'])
  })

  it('기관 대상·장소 미설정이면 두 필드가 null', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'institutions',
      program: individualProgram({
        venue: '기관 venue',
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution'],
        registrationOverlay: { [PLACE_DETAIL]: 'common', [ADDRESS]: '무시' },
      } as Partial<Program>),
    })
    expect(detail.venue).toBe('기관 venue')
    expect(detail.educationPlaceScheduleDetail).toBeNull()
    expect(detail.educationPlaceAddress).toBeNull()
  })
})
