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
    const unitMap = parsed.registrationOverlay?.[UNIT_NAME_KEY] as Record<string, unknown> | undefined
    expect(
      Object.keys(unitMap ?? {})
        .filter(key => unitMap?.[key] != null)
        .map(Number)
        .sort((a, b) => a - b)
    ).toEqual([1, 2])
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
})
