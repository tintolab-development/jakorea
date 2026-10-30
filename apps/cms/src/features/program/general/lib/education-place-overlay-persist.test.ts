import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
} from './general-program-service-detail-json'
import { stripHiddenEducationPlaceFromRegistrationOverlay } from './education-place-overlay-persist'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
} from '@/features/program/general/model/common-info-edit-schema'

const ADDRESS = 'generalRegistration.typeSettings.educationPlaceAddress'
const PLACE_DETAIL = 'generalRegistration.typeSettings.educationPlaceScheduleDetail'
const BY_SESSION = 'generalRegistration.educationCurriculum.educationPlaceBySession'
const SINGLE_FORM = 'generalRegistration.typeSettings.singleEducationForm'
const PLACE = '서울특별시 중구 세종대로 110'

function individualProgram(
  overlay: Record<string, unknown>,
  patch: Partial<Program> = {}
): Program {
  return {
    id: 'p-1',
    title: '개인 커리큘럼',
    generalProgramAudience: 'individual',
    generalParticipantTypes: ['individual'],
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      // 저장 시 overlay 교육 형태는 nested 라벨(정본)에서 다시 만든다
      educationFormLabel: overlay[SINGLE_FORM] === 'online' ? '온라인' : '오프라인',
      educationFormScheduleDetail: 'common',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '' },
      ],
    },
    registrationOverlay: overlay,
    ...patch,
  } as unknown as Program
}

function persistedOverlay(program: Program): Record<string, unknown> {
  return (
    parseGeneralProgramServiceDetailJson(serializeGeneralProgramServiceDetailJson(program))
      .registrationOverlay ?? {}
  )
}

describe('교육 진행 장소 저장 경계 (숨김 값은 API 본문에서 제외)', () => {
  it('오프라인이면 공통 장소를 저장 본문에 싣는다', () => {
    const overlay = { [SINGLE_FORM]: 'offline', [PLACE_DETAIL]: 'common', [ADDRESS]: PLACE }
    expect(persistedOverlay(individualProgram(overlay))[ADDRESS]).toBe(PLACE)
  })

  it('온라인이면 저장 본문에 장소가 없다 — 폼 overlay 값은 그대로', () => {
    const formOverlay = { [SINGLE_FORM]: 'online', [PLACE_DETAIL]: 'common', [ADDRESS]: PLACE }
    const saved = persistedOverlay(individualProgram(formOverlay))
    expect(saved).not.toHaveProperty(ADDRESS)
    expect(saved).not.toHaveProperty(PLACE_DETAIL)
    expect(saved).not.toHaveProperty(BY_SESSION)
    // 폼 상태(overlay KV)는 지우지 않는다
    expect(formOverlay[ADDRESS]).toBe(PLACE)
  })

  it('온라인 → 오프라인으로 되돌리면 폼에 남은 값이 다시 저장된다', () => {
    const formOverlay: Record<string, unknown> = {
      [SINGLE_FORM]: 'online',
      [PLACE_DETAIL]: 'common',
      [ADDRESS]: PLACE,
    }
    expect(persistedOverlay(individualProgram(formOverlay))).not.toHaveProperty(ADDRESS)
    formOverlay[SINGLE_FORM] = 'offline'
    expect(formOverlay[ADDRESS]).toBe(PLACE)
    expect(persistedOverlay(individualProgram(formOverlay))[ADDRESS]).toBe(PLACE)
  })

  it('상세 수정 PATCH 본문(serviceDetailJson)에도 온라인 장소가 없다', () => {
    const program = individualProgram({
      [SINGLE_FORM]: 'online',
      [PLACE_DETAIL]: 'common',
      [ADDRESS]: PLACE,
    })
    const body = mapGeneralProgramToUpdateRequest(program)
    const saved =
      parseGeneralProgramServiceDetailJson(body.serviceDetailJson ?? undefined)
        .registrationOverlay ?? {}
    expect(saved).not.toHaveProperty(ADDRESS)
  })

  it('일정 별 상이 — 온라인 회차·사전 교육(0) 장소는 빼고 노출 회차만 남긴다', () => {
    const overlay = {
      'generalRegistration.typeSettings.multiCommonEducationForm': 'offline',
      'generalRegistration.educationCurriculum.educationFormBySession': {
        1: 'offline',
        2: 'online',
      },
      [PLACE_DETAIL]: 'perSchedule',
      [ADDRESS]: '공통 주소',
      [BY_SESSION]: { 0: '사전 장소', 1: '1회차 장소', 2: '2회차 장소' },
    }
    const program = individualProgram(overlay, {
      generalProgramSessionRound: 'multi',
      generalCommonInfo: {
        educationFormScheduleDetail: 'perSchedule',
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '' },
          { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '' },
        ],
      },
    } as Partial<Program>)
    const stripped = stripHiddenEducationPlaceFromRegistrationOverlay(overlay, program) ?? {}
    expect(stripped[BY_SESSION]).toEqual({ 1: '1회차 장소' })
    expect(stripped).not.toHaveProperty(ADDRESS)
    expect(overlay[BY_SESSION]).toEqual({ 0: '사전 장소', 1: '1회차 장소', 2: '2회차 장소' })
  })

  it('기관 대상이면 장소 키를 모두 뺀다', () => {
    const overlay = { [SINGLE_FORM]: 'offline', [PLACE_DETAIL]: 'common', [ADDRESS]: PLACE }
    const program = individualProgram(overlay, {
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    } as Partial<Program>)
    const stripped = stripHiddenEducationPlaceFromRegistrationOverlay(overlay, program) ?? {}
    expect(stripped).not.toHaveProperty(ADDRESS)
    expect(stripped).not.toHaveProperty(PLACE_DETAIL)
  })
})

describe('교육 진행 장소 저장 경계 — trim·빈 값 생략', () => {
  it('주소는 trim해서 싣고 공백뿐이면 키를 뺀다', () => {
    const trimmed = {
      [SINGLE_FORM]: 'offline',
      [PLACE_DETAIL]: 'common',
      [ADDRESS]: `  ${PLACE}  `,
    }
    expect(persistedOverlay(individualProgram(trimmed))[ADDRESS]).toBe(PLACE)
    const blank = { [SINGLE_FORM]: 'offline', [PLACE_DETAIL]: 'common', [ADDRESS]: '   ' }
    expect(persistedOverlay(individualProgram(blank))).not.toHaveProperty(ADDRESS)
  })

  it('행 값은 trim하고 빈 행은 빼며, 모두 비면 행 키도 뺀다', () => {
    const program = (bySession: Record<number, string>) => {
      const overlay = {
        'generalRegistration.typeSettings.multiCommonEducationForm': 'offline',
        [PLACE_DETAIL]: 'perSchedule',
        [BY_SESSION]: bySession,
      }
      return {
        overlay,
        program: individualProgram(overlay, {
          generalProgramSessionRound: 'multi',
          generalCommonInfo: {
            educationFormLabel: '오프라인',
            educationFormScheduleDetail: 'common',
            curriculumSessions: [
              { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '' },
              { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '' },
            ],
          },
        } as Partial<Program>),
      }
    }
    const mixed = program({ 1: '  1회차 장소 ', 2: '' })
    const stripped = stripHiddenEducationPlaceFromRegistrationOverlay(mixed.overlay, mixed.program)
    expect(stripped?.[BY_SESSION]).toEqual({ 1: '1회차 장소' })
    expect(stripped?.[PLACE_DETAIL]).toBe('perSchedule')
    // 입력 overlay는 바꾸지 않는다
    expect(mixed.overlay[BY_SESSION]).toEqual({ 1: '  1회차 장소 ', 2: '' })

    const empty = program({ 1: ' ', 2: '' })
    const strippedEmpty =
      stripHiddenEducationPlaceFromRegistrationOverlay(empty.overlay, empty.program) ?? {}
    expect(strippedEmpty).not.toHaveProperty(BY_SESSION)
  })

  it('상세 모달 저장(편집값 → patch → PATCH 본문)도 같은 trim·생략 경로를 탄다', () => {
    const existing = individualProgram({
      [SINGLE_FORM]: 'offline',
      [PLACE_DETAIL]: 'common',
      [ADDRESS]: '이전 주소',
    })
    const values = programToGeneralCommonInfoEditValues(existing)
    const patch = generalCommonInfoEditValuesToProgramPatch(
      { ...values, educationPlaceScheduleDetail: 'common', educationPlaceAddress: `  ${PLACE} ` },
      existing
    )
    const body = mapGeneralProgramToUpdateRequest({ ...existing, ...patch } as Program)
    const saved =
      parseGeneralProgramServiceDetailJson(body.serviceDetailJson ?? undefined)
        .registrationOverlay ?? {}
    expect(saved[ADDRESS]).toBe(PLACE)
    // 커리큘럼 행 값이 모두 ''이면 행 키는 본문에 없다
    expect(saved).not.toHaveProperty(BY_SESSION)
  })
})
