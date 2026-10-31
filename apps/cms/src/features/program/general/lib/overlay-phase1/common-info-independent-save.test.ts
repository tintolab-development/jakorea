/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { programToGeneralCommonInfoEditValues } from '@/features/program/general/model/common-info-edit-schema'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/registration-overlay-sync'
import {
  createGeneralProgramCommonInfoIndependentSave,
  GENERAL_COMMON_INFO_INDEPENDENT_SERIALIZE_OPTIONS,
} from './common-info-independent-save'
import { resolvePublicProgramTitleDisplay } from '@/features/program/shared/lib/public-program-title'

const UNIT_NAME_KEY = 'generalRegistration.educationCurriculum.unitNameBySession'

function baseProgram(): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: '186234',
    sponsorId: 'sponsor-1',
    title: '기존 대표명',
    mainTitle: '기존 대표명',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    partnerInvolvement: true,
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      venueKind: 'inside',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
        { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
      ],
      scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '기존 일정' }],
      kpi: { finalParticipants: 40, instructorCount: 3, volunteerCount: 2, finalSchools: 6, finalClasses: 9 },
    },
    registrationOverlay: {
      [UNIT_NAME_KEY]: { 1: '단원1', 2: '단원2', 3: 'stale3', 4: 'stale4' },
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseJson(json: string | undefined): {
  generalCommonInfo?: Record<string, unknown>
  registration?: { overlay?: Record<string, unknown> }
  registrationOverlay?: Record<string, unknown>
} {
  if (!json) return {}
  return JSON.parse(json) as ReturnType<typeof parseJson>
}

describe('createGeneralProgramCommonInfoIndependentSave', () => {
  it('overlay apply 없이 form 값으로 PATCH 하고 nested-ssot 를 붙인다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const overlayApplied = applyGeneralRegistrationOverlayToProgram(
      existing,
      existing.registrationOverlay as Record<string, unknown>,
      extrasFromGeneralProgram(existing)
    )
    expect(overlayApplied.generalCommonInfo?.curriculumSessions?.length).toBeGreaterThan(2)

    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '수정 공고' },
      program: existing,
    })
    expect(save.serializeOptions).toEqual(GENERAL_COMMON_INFO_INDEPENDENT_SERIALIZE_OPTIONS)
    expect(save.patch.registrationOverlay).toBeUndefined()
    expect(save.patch.generalCommonInfo).not.toHaveProperty('curriculumSessions')
    expect(save.programDraft.generalCommonInfo?.announcementTitle).toBe('수정 공고')

    const body = mapGeneralProgramToUpdateRequest(
      save.programDraft,
      save.patch,
      existing,
      save.serializeOptions
    )
    const parsed = parseJson(body.serviceDetailJson)
    expect(parsed.generalCommonInfo).not.toHaveProperty('curriculumSessions')
    const persistOverlay = parsed.registration?.overlay ?? parsed.registrationOverlay
    const unitMap = persistOverlay?.[UNIT_NAME_KEY] as Record<string, unknown> | undefined
    expect(
      Object.keys(unitMap ?? {})
        .filter(key => unitMap?.[key] != null)
        .map(Number)
        .sort((a, b) => a - b)
    ).toEqual([1, 2])
  })

  it('PATCH expectedUpdatedAt는 GET baseline revision을 그대로 쓰고 draft에 now()를 넣지 않는다', () => {
    const serverRevision = '2026-10-31T12:10:00.059740Z'
    const existing = { ...baseProgram(), updatedAt: serverRevision }
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '수정 공고' },
      program: existing,
    })
    expect(save.programDraft.updatedAt).toBe(serverRevision)
    const body = mapGeneralProgramToUpdateRequest(
      save.programDraft,
      save.patch,
      existing,
      save.serializeOptions
    )
    expect(body.expectedUpdatedAt).toBe(serverRevision)
  })

  it('draft updatedAt이 잘못 덮여 있어도 baseline GET revision으로 PATCH 잠금을 보낸다', () => {
    const serverRevision = '2026-10-31T12:10:00.059740Z'
    const staleDraftRevision = '2026-10-31T22:01:10.140Z'
    const existing = { ...baseProgram(), updatedAt: serverRevision }
    const poisonedDraft: Program = { ...existing, updatedAt: staleDraftRevision }
    const body = mapGeneralProgramToUpdateRequest(
      poisonedDraft,
      { title: '제목만' },
      existing
    )
    expect(body.expectedUpdatedAt).toBe(serverRevision)
  })

  it('구조 변경 시 이전 nested [] 와 신규 nested 배열을 함께 보낸다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, educationStructure: 'schedule', sessionRound: 'single' },
      program: existing,
    })
    expect(save.structureChanged).toBe(true)
    expect(save.patch.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(Array.isArray(save.patch.generalCommonInfo?.scheduleDetails)).toBe(true)

    const parsed = parseJson(
      mapGeneralProgramToUpdateRequest(
        save.programDraft,
        save.patch,
        existing,
        save.serializeOptions
      ).serviceDetailJson
    )
    expect(parsed.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(parsed.generalCommonInfo).toHaveProperty('scheduleDetails')
  })

  it('공고용 프로그램명만 바꾸면 draft overlay 공고명도 새 값으로 맞춘다', () => {
    const existing: Program = {
      ...baseProgram(),
      registrationOverlay: {
        ...baseProgram().registrationOverlay,
        'generalRegistration.basicInfo.publicProgramTitle': '기존 공고',
      },
    }
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '새 공고' },
      program: existing,
      changedFormKeys: new Set(['announcementTitle']),
    })
    expect(save.patch.generalCommonInfo?.announcementTitle).toBe('새 공고')
    expect(save.patch).not.toHaveProperty('registrationOverlay')
    expect(
      save.programDraft.registrationOverlay?.['generalRegistration.basicInfo.publicProgramTitle']
    ).toBe('새 공고')
    expect(resolvePublicProgramTitleDisplay(save.programDraft)).toBe('새 공고')
  })

  it('새 공고명이 대표명과 같아도 이전 overlay 공고명이 보이지 않는다', () => {
    const existing: Program = {
      ...baseProgram(),
      registrationOverlay: {
        ...baseProgram().registrationOverlay,
        'generalRegistration.basicInfo.publicProgramTitle': '기존 공고',
      },
    }
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '기존 대표명' },
      program: existing,
      changedFormKeys: new Set(['announcementTitle']),
    })
    expect(resolvePublicProgramTitleDisplay(save.programDraft)).toBe('기존 대표명')
  })
})
