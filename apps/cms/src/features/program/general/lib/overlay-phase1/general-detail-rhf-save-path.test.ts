/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  extrasFromGeneralProgram,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/registration-overlay-sync'
import {
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  buildIndependentDetailCommonInfoFromRhf,
  independentAppliesExplicitStructureReset,
  independentPreservesSiblingWhenStructureUnchanged,
} from './build-independent-detail-common-info'
import { mapIndependentCommonInfoPatchToUpdateRequest } from './build-independent-common-info-patch'
import { GENERAL_RHF_GATE_MATRIX } from './general-rhf-migration-gate'
import {
  GENERAL_DETAIL_OPERATIONAL_RISK_PATHS,
  GENERAL_DETAIL_RHF_INTENDED_CALL_CHAIN,
  GENERAL_DETAIL_RHF_PRODUCT_CALL_CHAIN,
  GENERAL_DETAIL_RHF_SAVE_BLOCKERS,
  GENERAL_DETAIL_RHF_SAVE_MIN_HOOK_SWAP_FILES,
  GENERAL_DETAIL_RHF_SAVE_POLICY,
  GENERAL_DETAIL_RHF_SAVE_SCOPE,
  GENERAL_DETAIL_RHF_SAVE_STATUS,
  GENERAL_DETAIL_RHF_SAVE_STR_RESULTS,
  GENERAL_DETAIL_RHF_SAVE_WIRE_CHECKS,
  GENERAL_DETAIL_SERIALIZER_STATUS,
} from './general-detail-rhf-save-path'

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
      educationScheduleLines: ['2026-06-10 10:00'],
      kpi: {
        finalParticipants: 40,
        instructorCount: 3,
        volunteerCount: 2,
        finalSchools: 6,
        finalClasses: 9,
      },
      wageGradeRows: [{ grade: '1급 강사비', pricing: '1시간 당 | 기본 : 100,000원' }],
      paymentItems: '교통비',
      sponsorManagementIds: ['163001'],
    },
    registrationOverlay: {
      [UNIT_NAME_KEY]: { 1: '단원1', 2: '단원2', 3: 'stale3', 4: 'stale4' },
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseServiceDetail(json: string | undefined): {
  generalCommonInfo?: Record<string, unknown>
  registrationOverlay?: Record<string, unknown>
  registration?: { overlay?: Record<string, unknown> }
} {
  if (!json) return {}
  return JSON.parse(json) as ReturnType<typeof parseServiceDetail>
}

function hasOwn(record: Record<string, unknown> | undefined, key: string): boolean {
  return record != null && Object.prototype.hasOwnProperty.call(record, key)
}

function overlayUnitNameKeys(parsed: ReturnType<typeof parseServiceDetail>): number[] {
  const overlay = parsed.registrationOverlay ?? parsed.registration?.overlay ?? {}
  const map = overlay[UNIT_NAME_KEY] as Record<string, unknown> | undefined
  return Object.keys(map ?? {})
    .filter(key => map?.[key] != null)
    .map(Number)
    .filter(n => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b)
}

function sessionNosFromJson(parsed: ReturnType<typeof parseServiceDetail>): number[] {
  const rows = parsed.generalCommonInfo?.curriculumSessions as
    | Array<{ sessionNo?: number }>
    | undefined
  return (rows ?? []).map(row => row.sessionNo ?? -1)
}

describe('Phase 1-E 상세 공통정보 저장 경로', () => {
  it('범위·호출 사슬·known-diff 3건을 고정한다', () => {
    expect([...GENERAL_DETAIL_RHF_SAVE_SCOPE]).toEqual([
      'GENERAL',
      'GENERAL_ORGANIZATION',
      'GENERAL_INDIVIDUAL',
    ])
    expect(GENERAL_DETAIL_RHF_PRODUCT_CALL_CHAIN[1]).toBe(
      'useGeneralProgramCommonInfoSave.triggerSave'
    )
    expect(GENERAL_DETAIL_RHF_PRODUCT_CALL_CHAIN[2]).toBe('form.getValues()')
    expect(GENERAL_DETAIL_RHF_INTENDED_CALL_CHAIN[0]).toMatch(/form.getValues/)
    expect(GENERAL_DETAIL_RHF_SAVE_MIN_HOOK_SWAP_FILES).toEqual([
      'apps/cms/src/features/program/general/hooks/use-common-info-save.ts',
    ])
    expect(
      OVERLAY_PHASE0_KNOWN_DIFFS.filter(item => item.change === 'change_required')
        .map(item => item.id)
        .sort()
    ).toEqual(
      ['empty-public-title-apply-fallback', 'recruit-detailinfo-reseed-gap'].sort()
    )
  })

  it('1. 필드 미변경 PATCH omit 이 최종 JSON 에도 유지된다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const result = buildIndependentDetailCommonInfoFromRhf({
      values,
      existing,
      sessionAuthoring: { curriculum: { kind: 'omit' }, schedule: { kind: 'omit' } },
    })
    expect(result.alignedPatch.curriculumSessionsIntent).toBe('omit')
    expect(result.alignedPatch.patch.generalCommonInfo).not.toHaveProperty('curriculumSessions')
    expect(result.alignedPatch.patch).not.toHaveProperty('registrationOverlay')

    const body = mapIndependentCommonInfoPatchToUpdateRequest(existing, result.alignedPatch)
    const parsed = parseServiceDetail(body.serviceDetailJson)
    expect(hasOwn(parsed.generalCommonInfo, 'curriculumSessions')).toBe(false)
    expect(hasOwn(parsed.generalCommonInfo, 'scheduleDetails')).toBe(false)
    expect(
      GENERAL_DETAIL_RHF_SAVE_WIRE_CHECKS.find(
        item => item.id === 'final-body-omits-unchanged-curriculumSessions'
      )?.matchesBe
    ).toBe(true)
  })

  it('2. 명시적 세션 전체 삭제는 최종 JSON 에 [] 이다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const result = buildIndependentDetailCommonInfoFromRhf({
      values: { ...values, curriculumSessions: [] },
      existing,
      sessionAuthoring: { curriculum: { kind: 'clear' } },
    })
    expect(result.alignedPatch.generalCommonInfoPatch.curriculumSessions).toEqual([])
    const body = mapIndependentCommonInfoPatchToUpdateRequest(existing, result.alignedPatch)
    const parsed = parseServiceDetail(body.serviceDetailJson)
    expect(parsed.generalCommonInfo?.curriculumSessions).toEqual([])
  })

  it('3. 일부 세션 삭제는 nested 2행이고 sessionNo 1·2를 유지한다', () => {
    const existing: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
          { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
          { sessionNo: 3, sessionLabel: '3회차', title: '단원3', description: '본문3' },
          { sessionNo: 4, sessionLabel: '4회차', title: '단원4', description: '본문4' },
        ],
      },
    }
    const values = programToGeneralCommonInfoEditValues(existing)
    const result = buildIndependentDetailCommonInfoFromRhf({
      values: { ...values, curriculumSessions: values.curriculumSessions.slice(0, 2) },
      existing,
    })
    const body = mapIndependentCommonInfoPatchToUpdateRequest(existing, result.alignedPatch)
    const parsed = parseServiceDetail(body.serviceDetailJson)
    expect(sessionNosFromJson(parsed)).toEqual([1, 2])
    expect(
      (parsed.generalCommonInfo?.curriculumSessions as Array<{ title?: string }>).map(
        row => row.title
      )
    ).toEqual(['단원1', '단원2'])
  })

  it('4. sparse sessionNo [1,3] 이 최종 JSON 에 유지된다', () => {
    const existing: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
          { sessionNo: 3, sessionLabel: '3회차', title: '단원3', description: '본문3' },
        ],
      },
    }
    const values = programToGeneralCommonInfoEditValues(existing)
    const result = buildIndependentDetailCommonInfoFromRhf({
      values: {
        ...values,
        curriculumSessions: values.curriculumSessions.map((row, index) =>
          index === 1 ? { ...row, title: '단원3 수정' } : row
        ),
      },
      existing,
    })
    const body = mapIndependentCommonInfoPatchToUpdateRequest(existing, result.alignedPatch)
    const parsed = parseServiceDetail(body.serviceDetailJson)
    expect(sessionNosFromJson(parsed)).toEqual([1, 3])
    expect(parsed.generalCommonInfo?.curriculumSessions).toHaveLength(2)
  })

  it('5. Independent nested-ssot 는 stale unit map 을 재동봉하지 않는다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const omitResult = buildIndependentDetailCommonInfoFromRhf({
      values,
      existing,
      sessionAuthoring: { curriculum: { kind: 'omit' } },
    })
    expect(omitResult.alignedPatch.patch.registrationOverlay).toBeUndefined()
    const omitBody = mapIndependentCommonInfoPatchToUpdateRequest(existing, omitResult.alignedPatch)
    const omitParsed = parseServiceDetail(omitBody.serviceDetailJson)
    expect(hasOwn(omitParsed.generalCommonInfo, 'curriculumSessions')).toBe(false)
    expect(overlayUnitNameKeys(omitParsed)).toEqual([1, 2])
    expect(overlayUnitNameKeys(omitParsed)).not.toContain(3)
    expect(overlayUnitNameKeys(omitParsed)).not.toContain(4)

    const shrinkExisting: Program = {
      ...existing,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
          { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
          { sessionNo: 3, sessionLabel: '3회차', title: '단원3', description: '본문3' },
          { sessionNo: 4, sessionLabel: '4회차', title: '단원4', description: '본문4' },
        ],
      },
    }
    const shrinkValues = programToGeneralCommonInfoEditValues(shrinkExisting)
    const shrink = buildIndependentDetailCommonInfoFromRhf({
      values: { ...shrinkValues, curriculumSessions: shrinkValues.curriculumSessions.slice(0, 2) },
      existing: shrinkExisting,
    })
    const shrinkParsed = parseServiceDetail(
      mapIndependentCommonInfoPatchToUpdateRequest(shrinkExisting, shrink.alignedPatch)
        .serviceDetailJson
    )
    expect(sessionNosFromJson(shrinkParsed)).toEqual([1, 2])
    expect(overlayUnitNameKeys(shrinkParsed)).toEqual([1, 2])

    const clear = buildIndependentDetailCommonInfoFromRhf({
      values: { ...values, curriculumSessions: [] },
      existing,
      sessionAuthoring: { curriculum: { kind: 'clear' } },
    })
    const clearParsed = parseServiceDetail(
      mapIndependentCommonInfoPatchToUpdateRequest(existing, clear.alignedPatch).serviceDetailJson
    )
    expect(clearParsed.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(overlayUnitNameKeys(clearParsed)).toEqual([])

    expect(
      GENERAL_DETAIL_RHF_SAVE_WIRE_CHECKS.find(
        item => item.id === 'final-body-does-not-reattach-stale-overlay'
      )?.matchesBe
    ).toBe(true)
  })

  it('5b. 제품 3인자 mapper 는 기본 legacy-merge 로 stale overlay 를 유지한다', () => {
    const existing = baseProgram()
    const { curriculumSessions: _omitSessions, ...commonWithoutSessions } =
      existing.generalCommonInfo ?? {}
    void _omitSessions
    const body = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: existing.title,
        generalCommonInfo: commonWithoutSessions,
      },
      existing
    )
    expect(overlayUnitNameKeys(parseServiceDetail(body.serviceDetailJson))).toEqual([1, 2, 3, 4])
  })

  it('6. STR-01/02 교육구조 전환 시 비활성 nested는 최종 JSON 에서 [] 이다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const toSchedule = buildIndependentDetailCommonInfoFromRhf({
      values: { ...values, educationStructure: 'schedule', sessionRound: 'single' },
      existing,
    })
    expect(toSchedule.structureChanged).toBe(true)
    expect(toSchedule.rhfPatch.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(toSchedule.programDraft.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(
      independentAppliesExplicitStructureReset(toSchedule.programDraft, toSchedule.rhfPatch, 'schedule')
    ).toBe(true)
    const scheduleBody = mapIndependentCommonInfoPatchToUpdateRequest(
      existing,
      toSchedule.alignedPatch
    )
    const scheduleParsed = parseServiceDetail(scheduleBody.serviceDetailJson)
    expect(scheduleParsed.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(hasOwn(scheduleParsed.generalCommonInfo, 'scheduleDetails')).toBe(true)
    expect(overlayUnitNameKeys(scheduleParsed)).toEqual([])
    expect(toSchedule.alignedPatch.patch.generalCommonInfo).toHaveProperty('curriculumSessions')
    expect(toSchedule.alignedPatch.patch.generalCommonInfo).toHaveProperty('scheduleDetails')

    const scheduleExisting: Program = {
      ...existing,
      generalProgramEducationStructure: 'schedule',
    }
    const scheduleValues = programToGeneralCommonInfoEditValues(scheduleExisting)
    const toCurriculum = buildIndependentDetailCommonInfoFromRhf({
      values: { ...scheduleValues, educationStructure: 'curriculum', sessionRound: 'multi' },
      existing: scheduleExisting,
    })
    expect(toCurriculum.rhfPatch.generalCommonInfo?.scheduleDetails).toEqual([])
    expect(toCurriculum.programDraft.generalCommonInfo?.scheduleDetails).toEqual([])
    const curriculumBody = mapIndependentCommonInfoPatchToUpdateRequest(
      scheduleExisting,
      toCurriculum.alignedPatch
    )
    expect(parseServiceDetail(curriculumBody.serviceDetailJson).generalCommonInfo?.scheduleDetails).toEqual(
      []
    )
    expect(hasOwn(parseServiceDetail(curriculumBody.serviceDetailJson).generalCommonInfo, 'curriculumSessions')).toBe(
      true
    )
    expect(toCurriculum.alignedPatch.patch.generalCommonInfo).toHaveProperty('scheduleDetails')
    expect(toCurriculum.alignedPatch.patch.generalCommonInfo).toHaveProperty('curriculumSessions')
  })

  it('6b. 구조 변경 없이 커리큘럼·일정 상세만 수정하면 상대 nested를 생략한다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const curriculumEdit = buildIndependentDetailCommonInfoFromRhf({
      values: {
        ...values,
        curriculumSessions: values.curriculumSessions.map((row, index) =>
          index === 0 ? { ...row, title: '단원1 수정' } : row
        ),
      },
      existing,
    })
    expect(curriculumEdit.alignedPatch.scheduleDetailsIntent).toBe('omit')
    const curriculumBody = mapIndependentCommonInfoPatchToUpdateRequest(
      existing,
      curriculumEdit.alignedPatch
    )
    const curriculumParsed = parseServiceDetail(curriculumBody.serviceDetailJson)
    expect(hasOwn(curriculumParsed.generalCommonInfo, 'scheduleDetails')).toBe(false)
    expect(
      (curriculumParsed.generalCommonInfo?.curriculumSessions as Array<{ title?: string }>)[0]
        ?.title
    ).toBe('단원1 수정')

    const scheduleExisting: Program = {
      ...existing,
      generalProgramEducationStructure: 'schedule',
    }
    const scheduleValues = programToGeneralCommonInfoEditValues(scheduleExisting)
    const scheduleEdit = buildIndependentDetailCommonInfoFromRhf({
      values: {
        ...scheduleValues,
        scheduleDetails: scheduleValues.scheduleDetails.map((row, index) =>
          index === 0 ? { ...row, name: '일정 수정' } : row
        ),
      },
      existing: scheduleExisting,
    })
    expect(scheduleEdit.alignedPatch.curriculumSessionsIntent).toBe('omit')
    const scheduleBody = mapIndependentCommonInfoPatchToUpdateRequest(
      scheduleExisting,
      scheduleEdit.alignedPatch
    )
    expect(
      hasOwn(parseServiceDetail(scheduleBody.serviceDetailJson).generalCommonInfo, 'curriculumSessions')
    ).toBe(false)
  })

  it('7. 변경되지 않은 KPI는 최종 JSON 에서 생략하고, 제품 overlay-first 는 stale extras를 따른다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const result = buildIndependentDetailCommonInfoFromRhf({ values, existing })
    const body = mapIndependentCommonInfoPatchToUpdateRequest(existing, result.alignedPatch)
    expect(hasOwn(parseServiceDetail(body.serviceDetailJson).generalCommonInfo, 'kpi')).toBe(false)
    expect(result.alignedPatch.patch.generalCommonInfo).not.toHaveProperty('kpi')

    const overlayApplied = applyGeneralRegistrationOverlayToProgram(
      existing,
      existing.registrationOverlay as Record<string, unknown>,
      extrasFromGeneralProgram(existing)
    )
    expect(extrasFromGeneralProgram(existing).curriculumSessionCount).toBeGreaterThan(2)
    expect(overlayApplied.generalCommonInfo?.curriculumSessions?.length).toBeGreaterThan(2)
  })

  it('8. 최종 API body 는 serviceDetailJson 문자열이고 overlay 재직렬화를 포함한다', () => {
    const existing = baseProgram()
    const result = buildIndependentDetailCommonInfoFromRhf({
      values: programToGeneralCommonInfoEditValues(existing),
      existing,
    })
    const body = mapIndependentCommonInfoPatchToUpdateRequest(existing, result.alignedPatch)
    expect(typeof body.serviceDetailJson).toBe('string')
    expect(body.serviceDetailJson).toContain('"schemaVersion":1')
    const synced = resyncGeneralRegistrationOverlayFromProgram(
      {
        ...existing,
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'multi',
      },
      existing.registrationOverlay as Record<string, unknown>
    )
    const productPatch = generalCommonInfoEditValuesToProgramPatch(
      programToGeneralCommonInfoEditValues(existing),
      existing
    )
    expect(productPatch.generalCommonInfo?.scheduleDetails).toEqual([])
    expect(Object.keys(synced).length).toBeGreaterThan(0)
  })

  it('9. 일반 프로그램 12개 지원 조합이 상세 RHF → Mapper 에서 깨지지 않는다', () => {
    expect(GENERAL_RHF_GATE_MATRIX).toHaveLength(12)
    for (const row of GENERAL_RHF_GATE_MATRIX) {
      const existing: Program = {
        ...baseProgram(),
        generalProgramAudience: row.programType === 'GENERAL_INDIVIDUAL' ? 'individual' : 'organization',
        generalParticipantTypes:
          row.programType === 'GENERAL'
            ? ['school_institution', 'individual']
            : row.programType === 'GENERAL_INDIVIDUAL'
              ? ['individual']
              : ['school_institution'],
        generalProgramEducationStructure: row.structure,
        generalProgramSessionRound: row.round,
      }
      const values = programToGeneralCommonInfoEditValues(existing)
      const result = buildIndependentDetailCommonInfoFromRhf({
        values: {
          ...values,
          educationStructure: row.structure,
          sessionRound: row.round,
          participantOrganization: row.programType !== 'GENERAL_INDIVIDUAL',
          participantIndividual: row.programType !== 'GENERAL_ORGANIZATION',
        },
        existing,
      })
      const body = mapIndependentCommonInfoPatchToUpdateRequest(existing, result.alignedPatch)
      expect(typeof body.serviceDetailJson).toBe('string')
      expect(result.programDraft.generalProgramEducationStructure).toBe(row.structure)
      expect(result.programDraft.generalProgramSessionRound).toBe(row.round)
    }
  })

  it('저장 경로 판정은 HOOK_READY 이다', () => {
    expect(GENERAL_DETAIL_RHF_SAVE_POLICY).toEqual({
      nestedSsot: true,
      explicitStructureReset: true,
      explicitDeleteOnly: true,
      preserveOnStructureChange: false,
    })
    expect(GENERAL_DETAIL_RHF_SAVE_STATUS).toBe('GENERAL_DETAIL_RHF_SAVE_HOOK_READY')
    expect(GENERAL_DETAIL_SERIALIZER_STATUS).toBe('GENERAL_DETAIL_SERIALIZER_READY')
    expect([...GENERAL_DETAIL_RHF_SAVE_BLOCKERS]).toEqual([])
    expect(
      GENERAL_DETAIL_RHF_SAVE_WIRE_CHECKS.filter(item => !item.matchesBe).map(item => item.id)
    ).toEqual([])
    expect(GENERAL_DETAIL_RHF_SAVE_STR_RESULTS).toHaveLength(12)
    expect(GENERAL_DETAIL_RHF_SAVE_STR_RESULTS.filter(item => item.verdict === 'BLOCKED').map(item => item.id)).toEqual(
      []
    )
    expect(GENERAL_DETAIL_RHF_SAVE_STR_RESULTS.find(item => item.id === 'STR-12')?.verdict).toBe(
      'PASS'
    )
    expect(GENERAL_DETAIL_RHF_SAVE_STR_RESULTS.find(item => item.id === 'STR-07')?.verdict).toBe(
      'PASS'
    )
    expect(GENERAL_DETAIL_OPERATIONAL_RISK_PATHS.every(item => item.blockingApi == null)).toBe(true)
    expect(
      independentPreservesSiblingWhenStructureUnchanged(
        buildIndependentDetailCommonInfoFromRhf({
          values: programToGeneralCommonInfoEditValues(baseProgram()),
          existing: baseProgram(),
        }).programDraft,
        baseProgram(),
        'curriculum'
      )
    ).toBe(true)
  })
})
