/** @vitest-environment node */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
  resolveGeneralProgramCreateProgramType,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/registration-overlay-sync'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { resetGeneralApplicationOverlayStoreForTests } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import {
  EDITOR_EXTRAS_CURRICULUM_MULTI,
  EDITOR_EXTRAS_CURRICULUM_SINGLE,
  EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM,
  EDITOR_EXTRAS_SCHEDULE_MULTI,
  EDITOR_EXTRAS_SCHEDULE_SINGLE,
} from '@/features/program/general/lib/overlay-phase0/editor-extras-fixtures'
import { commonInfoRhfFieldMapCoversAllKeys } from './common-info-rhf-field-map'
import { overlayKvToIndependentCommonInfoInput } from './overlay-kv-to-common-info-form-values'
import {
  buildIndependentCommonInfo,
  seedIndependentCommonInfoOverlayFromProgram,
} from './build-independent-common-info'
import { deriveIndependentEditorExtrasFromProgram, emptyCurriculumMaps } from './common-info-domain'
import { overlayKvToIndependentRecruitmentInput } from './overlay-kv-to-recruitment-form-values'
import { buildIndependentRecruitmentDraft } from './build-independent-recruitment'
import { overlayKvToIndependentApplicationInput } from './overlay-kv-to-application-form-values'
import {
  buildIndependentApplicationDraft,
  buildIndependentApplicationFormVersionPutOverlay,
} from './build-independent-application'
import { overlayKvToIndependentMediaInput } from './overlay-kv-to-media-form-values'
import { buildIndependentMediaSidecar } from './build-independent-media'
import { snapshotToCommonInfoUpdateSave } from './map-snapshot-to-requests'
import { buildIndependentCommonInfoPatch } from './build-independent-common-info-patch'
import { APPLICATION_BINDING_CATALOG_IDS } from './program-edit-snapshot.types'
import { FIELD_ABSENT, presentField, type CommonInfoFormValues } from './common-info-form-values'
import {
  APPLICATION_RHF_CONNECTABLE,
  BE_SESSION_SSOT_CONTRACT,
  GENERAL_RHF_CONTRACT_ALIGNMENT_STATUS,
  GENERAL_RHF_GATE_BLOCKERS,
  GENERAL_RHF_GATE_MATRIX,
  GENERAL_RHF_MIGRATION_GATE_SCOPE,
  GENERAL_RHF_MIGRATION_GATE_STATUS,
  GENERAL_RHF_SESSION_SCENARIOS,
  INDEPENDENT_TO_DETAIL_RHF_ADAPTER,
  LEGACY_VS_BE_SESSION_DIFF,
  MEDIA_RHF_CONNECTABLE,
  RECRUITMENT_RHF_CONNECTABLE,
  generalRhfGateMatrixSize,
} from './general-rhf-migration-gate'

afterEach(() => {
  for (const catalog of APPLICATION_BINDING_CATALOG_IDS) {
    resetOperationalOverlayForCatalogId(catalog)
  }
  resetGeneralApplicationOverlayStoreForTests()
})

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
        { sessionLabel: '1회차', title: '단원1', description: '본문1' },
        { sessionLabel: '2회차', title: '단원2', description: '본문2' },
      ],
      scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '기존 일정' }],
      educationScheduleLines: ['2026-06-10 10:00'],
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function absentFormValues(): CommonInfoFormValues {
  return overlayKvToIndependentCommonInfoInput({}).formValues
}

function curriculumFormValues(names: Record<number, string>, contents: Record<number, string> = {}) {
  const values = absentFormValues()
  return {
    ...values,
    programTitleKo: presentField('신규 프로그램'),
    publicProgramTitle: presentField('공고용 신규'),
    curriculum: {
      ...emptyCurriculumMaps(),
      unitNameBySession: names,
      unitContentBySession: contents,
    },
  }
}

function parseServiceDetail(json: string | undefined): Record<string, unknown> {
  if (!json) return {}
  return JSON.parse(json) as Record<string, unknown>
}

function nestedSessionsFromRequest(json: string | undefined): unknown[] | undefined {
  const parsed = parseServiceDetail(json)
  const common = (parsed.generalCommonInfo ?? parsed) as { curriculumSessions?: unknown[] }
  return common.curriculumSessions ?? (parsed.curriculumSessions as unknown[] | undefined)
}

const schoolRecruitOverlay: Record<string, unknown> = {
  'recruit.maxAssignableInstructors': 3,
  'recruit.targetLevels': ['elementary'],
  'recruit.recruitRangeSeal': { start: '2026-05-01', end: '2026-05-31' },
  'recruit.programRangeSeal': { start: '2026-06-01', end: '2026-08-31' },
  'recruit.detailInfo.programDescription': '<p>모집 설명</p>',
}

const schoolApplicationOverlay: Record<string, unknown> = {
  'application.institution.teacherEmail': 'teacher@school.kr',
  'application.institution.applicationGrade': '3',
  'application.institution.sexOffense.inquiryMethod': 'online',
}

const uploadedMediaOverlay: Record<string, unknown> = {
  'recruit.detailInfo.thumbFileObjectId': 77,
  'recruit.detailInfo.thumbFileName': 'poster.png',
  'recruit.detailInfo.attachmentFileObjectIds': [101],
}

describe('P0 일반 프로그램 RHF 게이트 — 계약', () => {
  it('범위는 GENERAL* 3종이고 다른 유형은 제외한다', () => {
    expect([...GENERAL_RHF_MIGRATION_GATE_SCOPE]).toEqual([
      'GENERAL',
      'GENERAL_ORGANIZATION',
      'GENERAL_INDIVIDUAL',
    ])
    expect(generalRhfGateMatrixSize()).toBe(12)
    expect(GENERAL_RHF_GATE_MATRIX.every(row => row.support === 'supported')).toBe(true)
  })

  it('BE 세션 정본과 일정 필드 분리를 고정한다', () => {
    expect(BE_SESSION_SSOT_CONTRACT.nestedCanonical).toBe('generalCommonInfo.curriculumSessions')
    expect(BE_SESSION_SSOT_CONTRACT.emptyArrayDeletesAll).toBe(true)
    expect(BE_SESSION_SSOT_CONTRACT.staleOverlayMustNotRestore).toBe(true)
    expect(BE_SESSION_SSOT_CONTRACT.scheduleDetailsIndependent).toBe(true)
    expect(BE_SESSION_SSOT_CONTRACT.educationScheduleLinesAreDisplay).toBe(true)
    expect(BE_SESSION_SSOT_CONTRACT.programSchedulesArePhysicalRows).toBe(true)
  })

  it('기존 change_required known-diff 3건을 유지한다', () => {
    const required = OVERLAY_PHASE0_KNOWN_DIFFS.filter(item => item.change === 'change_required')
    expect(required.map(item => item.id).sort()).toEqual(
      [
        'empty-public-title-apply-fallback',
        'individual-schedule-writes-institution-prefix',
        'recruit-detailinfo-reseed-gap',
      ].sort()
    )
  })
})

describe('P0 BE 세션 SSOT vs Independent payload', () => {
  it('1. 4회차 → 2회차: nested·overlay 미러가 2행이다', () => {
    const extras = { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 2 }
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues(
        { 1: '단원1', 2: '단원2' },
        { 1: '본문1', 2: '본문2' }
      ),
      editorExtras: extras,
      baseline: {
        ...baseProgram(),
        generalCommonInfo: {
          ...baseProgram().generalCommonInfo,
          curriculumSessions: [
            { sessionLabel: '1회차', title: '단원1', description: '본문1' },
            { sessionLabel: '2회차', title: '단원2', description: '본문2' },
            { sessionLabel: '3회차', title: '단원3', description: '본문3' },
            { sessionLabel: '4회차', title: '단원4', description: '본문4' },
          ],
        },
      },
      mode: 'update',
    })
    expect(independent.programDraft.generalCommonInfo?.curriculumSessions).toHaveLength(2)
    const names = independent.persistOverlay[
      'generalRegistration.educationCurriculum.unitNameBySession'
    ] as Record<number, string>
    expect(Object.keys(names).map(Number).sort((a, b) => a - b)).toEqual([1, 2])
    expect(
      GENERAL_RHF_SESSION_SCENARIOS.find(item => item.id === 'reduce-4-to-2')?.verdict
    ).toBe('matches-be')
  })

  it('2. 2회차 → 0회차: 명시적 삭제는 []', () => {
    const extras = { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 0 }
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues({}),
      editorExtras: extras,
      baseline: baseProgram(),
      mode: 'update',
      sessionAuthoring: { curriculum: { kind: 'clear' } },
    })
    expect(independent.programDraft.generalCommonInfo?.curriculumSessions).toEqual([])
    const byCount = buildIndependentCommonInfo({
      formValues: curriculumFormValues({}),
      editorExtras: extras,
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(byCount.programDraft.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(
      GENERAL_RHF_SESSION_SCENARIOS.find(item => item.id === 'delete-all-2-to-0')?.verdict
    ).toBe('matches-be')
  })

  it('3. 2회차 → 4회차 추가', () => {
    const extras = { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 4 }
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues(
        { 1: '단원1', 2: '단원2', 3: '단원3', 4: '단원4' },
        { 1: '본문1', 2: '본문2', 3: '본문3', 4: '본문4' }
      ),
      editorExtras: extras,
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(independent.programDraft.generalCommonInfo?.curriculumSessions).toHaveLength(4)
  })

  it('4. nested 2 / stale overlay 4: stale maps로 세션 수를 늘리지 않는다', () => {
    const program: Program = {
      ...baseProgram(),
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '단원1',
          2: '단원2',
          3: 'stale3',
          4: 'stale4',
        },
      },
    }
    expect(deriveIndependentEditorExtrasFromProgram(program).curriculumSessionCount).toBe(2)
    const legacyCount = extrasFromGeneralProgram(program).curriculumSessionCount ?? Number.NaN
    expect(legacyCount).toBeGreaterThan(2)
    expect(LEGACY_VS_BE_SESSION_DIFF.action).toMatch(/Legacy extras에 맞추지 않음/)

    const adapted = overlayKvToIndependentCommonInfoInput(program.registrationOverlay ?? {})
    const independent = buildIndependentCommonInfo({
      formValues: adapted.formValues,
      sidecars: adapted.sidecars,
      editorExtras: deriveIndependentEditorExtrasFromProgram(program),
      baseline: program,
      mode: 'update',
    })
    expect(independent.programDraft.generalCommonInfo?.curriculumSessions).toHaveLength(2)
    expect(
      independent.programDraft.generalCommonInfo?.curriculumSessions?.map(row => row.title)
    ).toEqual(['단원1', '단원2'])
  })

  it('4-seed. nested 시드 경로면 stale overlay를 미러에서 제거한다', () => {
    const program: Program = {
      ...baseProgram(),
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '단원1',
          2: '단원2',
          3: 'stale3',
          4: 'stale4',
        },
      },
    }
    const seeded = seedIndependentCommonInfoOverlayFromProgram(program)
    const names = seeded['generalRegistration.educationCurriculum.unitNameBySession'] as
      | Record<number, string>
      | undefined
    expect(Object.keys(names ?? {}).map(Number).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it('5. nested 없음 / overlay-only 는 maps가 있을 때 복원한다', () => {
    const overlay = {
      'generalRegistration.educationCurriculum.unitNameBySession': {
        1: '레거시1',
        2: '레거시2',
      },
      'generalRegistration.educationCurriculum.unitContentBySession': {
        1: '본문1',
        2: '본문2',
      },
    }
    const baseline: Program = {
      ...baseProgram(),
      generalCommonInfo: { announcementTitle: '기존 공고', venueKind: 'inside' },
    }
    expect(baseline.generalCommonInfo?.curriculumSessions).toBeUndefined()
    const adapted = overlayKvToIndependentCommonInfoInput(overlay)
    const independent = buildIndependentCommonInfo({
      formValues: adapted.formValues,
      sidecars: adapted.sidecars,
      editorExtras: EDITOR_EXTRAS_CURRICULUM_MULTI,
      baseline,
      mode: 'update',
    })
    expect(independent.programDraft.generalCommonInfo?.curriculumSessions?.length).toBe(2)
  })

  it('6. sparse sessionNo [1,3] 을 밀도화하지 않는다', () => {
    const extras = { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 2 }
    const baseline: Program = {
      ...baseProgram(),
      generalCommonInfo: { announcementTitle: '기존 공고', venueKind: 'inside' },
    }
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues({ 1: '단원1', 3: '단원3' }, { 1: '본문1', 3: '본문3' }),
      editorExtras: extras,
      baseline,
      mode: 'update',
    })
    const sessions = independent.programDraft.generalCommonInfo?.curriculumSessions ?? []
    expect(sessions.map(row => row.sessionNo)).toEqual([1, 3])
    expect(sessions).toHaveLength(2)
    expect(
      GENERAL_RHF_SESSION_SCENARIOS.find(item => item.id === 'sparse-session-1-3')?.verdict
    ).toBe('matches-be')
  })

  it('7. 변경 없으면 curriculumSessions 키를 생략하고, 제품 mapper는 재직렬화한다', () => {
    const baseline: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
          { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
        ],
      },
    }
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues({ 1: '단원1', 2: '단원2' }, { 1: '본문1', 2: '본문2' }),
      editorExtras: EDITOR_EXTRAS_CURRICULUM_MULTI,
      baseline,
      mode: 'update',
      sessionAuthoring: { curriculum: { kind: 'omit' } },
    })
    const aligned = buildIndependentCommonInfoPatch({
      draft: independent,
      baseline,
      sessionAuthoring: { curriculum: { kind: 'omit' } },
    })
    expect(aligned.curriculumSessionsIntent).toBe('omit')
    expect(aligned.generalCommonInfoPatch).not.toHaveProperty('curriculumSessions')
    expect(aligned.productMapperReserializesUnchangedNested).toBe(true)
    const save = snapshotToCommonInfoUpdateSave(
      {
        commonInfo: {
          applied: independent.applied,
          program: independent.programDraft,
          inputOverlay: independent.persistOverlay,
          resyncedOverlay: independent.persistOverlay,
          extras: EDITOR_EXTRAS_CURRICULUM_MULTI,
        },
        recruitments: [],
        applicationBindings: [],
        media: { state: { origin: 'empty' }, bindCalls: [] },
        editorExtras: EDITOR_EXTRAS_CURRICULUM_MULTI,
        draftMetadata: { mode: 'update', programId: '186234' },
      },
      baseline
    )
    expect(nestedSessionsFromRequest(save.updateRequest.serviceDetailJson)).toBeDefined()
  })

  it('8. 구조 미변경이면 상대 nested를 보존하고, 구조 변경이면 비활성 nested를 [] 한다', () => {
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues({ 1: '단원1' }),
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(independent.programDraft.generalCommonInfo?.scheduleDetails).toEqual(
      baseProgram().generalCommonInfo?.scheduleDetails
    )
    expect(independent.programDraft.generalCommonInfo?.educationScheduleLines).toEqual([
      '2026-06-10 10:00',
    ])
    const schedule = buildIndependentCommonInfo({
      formValues: {
        ...absentFormValues(),
        schedule: {
          eventNameByDetail: { 1: '행사' },
          scheduleDateByDetailIso: {},
          groupTimesByDetail: {},
          educationFormByDetail: {},
          participationByDetail: {},
          ipsByDetailIndex: {},
          assignmentByDetail: {},
          preEducationName: '',
        },
      },
      editorExtras: EDITOR_EXTRAS_SCHEDULE_SINGLE,
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(schedule.programDraft.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(schedule.programDraft.generalCommonInfo?.scheduleDetails?.length).toBeGreaterThan(0)
    expect(schedule.programDraft.schedules).toEqual(baseProgram().schedules)
    expect(schedule.programDraft.generalCommonInfo?.educationScheduleLines).toEqual([
      '2026-06-10 10:00',
    ])
  })
})

describe('P0 Builder 통합 · 유형 Matrix', () => {
  it('신규 등록: Common+Recruit+Application+Media 한 시나리오', () => {
    const extras = EDITOR_EXTRAS_CURRICULUM_SINGLE
    const overlay = {
      'generalRegistration.basicInfo.localProgramTitleKo': '통합 프로그램',
      'generalRegistration.basicInfo.publicProgramTitle': '통합 공고',
      'generalRegistration.basicInfo.businessField': 'career_employment',
      'generalRegistration.kpi.participantCount': 10,
      'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-06-10 10:00'],
    }
    const commonAdapted = overlayKvToIndependentCommonInfoInput(overlay)
    const common = buildIndependentCommonInfo({
      formValues: commonAdapted.formValues,
      sidecars: commonAdapted.sidecars,
      editorExtras: extras,
      baseline: baseProgram(),
      mode: 'create',
    })
    const recruitAdapted = overlayKvToIndependentRecruitmentInput(schoolRecruitOverlay)
    const recruit = buildIndependentRecruitmentDraft({
      formValues: recruitAdapted.formValues,
      sidecars: { ...recruitAdapted.sidecars, preferOverlay: true },
      baseline: common.programDraft,
      mode: 'create',
    })
    const applicationAdapted = overlayKvToIndependentApplicationInput(schoolApplicationOverlay)
    const application = buildIndependentApplicationDraft({
      catalog: 'application-participant-school',
      formValues: applicationAdapted.formValues,
      sidecars: applicationAdapted.sidecars,
    })
    const mediaAdapted = overlayKvToIndependentMediaInput(uploadedMediaOverlay)
    const media = buildIndependentMediaSidecar({
      formValues: mediaAdapted.formValues,
      sidecars: {
        ...mediaAdapted.sidecars,
        created: {
          id: '186234',
          programRecruitments: [{ id: 9, recruitmentType: 'PARTICIPANT' }],
        },
      },
    })
    const createBody = mapGeneralProgramToCreateRequest({
      ...recruit.programDraft,
      registrationOverlay: { ...common.persistOverlay, ...recruit.persistOverlay },
    })
    expect(createBody.programType).toBe('GENERAL_ORGANIZATION')
    expect(recruit.programDraft.title).toBeTruthy()
    expect(JSON.stringify(createBody.serviceDetailJson ?? '')).not.toMatch(/application\.institution/)
    expect(application.sink).toBe('form-version-overlay')
    expect(application.formBindingIntent.formType).toBe('APPLICATION')
    expect(buildIndependentApplicationFormVersionPutOverlay(application.overlay).overlay).toEqual(
      application.overlay
    )
    expect(media.bindCalls.some(call => call.kind === 'putProgramRecruitmentThumbnail')).toBe(true)
    expect(media.state.thumbFileObjectId).toBe(77)
    expect(String(media.state.keyVisualImage ?? '')).not.toMatch(/^blob:/)
  })

  it('상세 수정: Independent PATCH와 모집 행 PATCH가 프로그램 nested를 보존한다', () => {
    const existing: Program = {
      ...baseProgram(),
      programRecruitments: [
        {
          id: 9001,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-01-10T00:00:00.000Z',
          endAt: '2026-01-20T00:00:00.000Z',
        },
      ],
      applicationStartDate: '2026-01-10T00:00:00.000Z',
      applicationEndDate: '2026-01-20T00:00:00.000Z',
    }
    const common = buildIndependentCommonInfo({
      formValues: {
        ...curriculumFormValues({ 1: '수정단원' }, { 1: '수정본문' }),
        publicProgramTitle: presentField('수정 공고'),
      },
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: existing,
      mode: 'update',
    })
    const update = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: common.programDraft.title,
        generalCommonInfo: common.programDraft.generalCommonInfo,
        registrationOverlay: common.persistOverlay,
      },
      existing
    )
    expect(nestedSessionsFromRequest(update.serviceDetailJson)?.[0]).toMatchObject({
      title: '수정단원',
    })

    const recruitAdapted = overlayKvToIndependentRecruitmentInput(schoolRecruitOverlay)
    const recruit = buildIndependentRecruitmentDraft({
      formValues: recruitAdapted.formValues,
      sidecars: { ...recruitAdapted.sidecars, preferOverlay: true },
      baseline: existing,
      mode: 'update',
    })
    const row = buildProgramRecruitmentRowSaveRequest({
      baseline: existing,
      draft: recruit.programDraft,
      patch: {
        generalCommonInfo: recruit.programDraft.generalCommonInfo,
        registrationOverlay: schoolRecruitOverlay,
      },
      audience: 'participant',
    })
    expect(row).toBeDefined()
    expect(recruit.programDraft.applicationStartDate).toBe(existing.applicationStartDate)
    expect(recruit.programDraft.generalCommonInfo?.curriculumSessions).toEqual(
      existing.generalCommonInfo?.curriculumSessions
    )
  })

  it('유형×구조×회차 12조합의 create programType·nested 형태', () => {
    const extrasBy: Record<string, typeof EDITOR_EXTRAS_CURRICULUM_SINGLE> = {
      'GENERAL|curriculum|single': {
        ...EDITOR_EXTRAS_CURRICULUM_SINGLE,
        participantOrganization: true,
        participantIndividual: true,
      },
      'GENERAL|curriculum|multi': {
        ...EDITOR_EXTRAS_CURRICULUM_MULTI,
        participantOrganization: true,
        participantIndividual: true,
      },
      'GENERAL|schedule|single': {
        ...EDITOR_EXTRAS_SCHEDULE_SINGLE,
        participantOrganization: true,
        participantIndividual: true,
      },
      'GENERAL|schedule|multi': {
        ...EDITOR_EXTRAS_SCHEDULE_MULTI,
        participantOrganization: true,
        participantIndividual: true,
      },
      'GENERAL_ORGANIZATION|curriculum|single': EDITOR_EXTRAS_CURRICULUM_SINGLE,
      'GENERAL_ORGANIZATION|curriculum|multi': EDITOR_EXTRAS_CURRICULUM_MULTI,
      'GENERAL_ORGANIZATION|schedule|single': EDITOR_EXTRAS_SCHEDULE_SINGLE,
      'GENERAL_ORGANIZATION|schedule|multi': EDITOR_EXTRAS_SCHEDULE_MULTI,
      'GENERAL_INDIVIDUAL|curriculum|single': EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM,
      'GENERAL_INDIVIDUAL|curriculum|multi': {
        ...EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM,
        sessionRoundType: 'multi',
        curriculumSessionCount: 2,
      },
      'GENERAL_INDIVIDUAL|schedule|single': {
        ...EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM,
        programType: 'schedule',
      },
      'GENERAL_INDIVIDUAL|schedule|multi': {
        ...EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM,
        programType: 'schedule',
        sessionRoundType: 'multi',
        scheduleCurriculumDetailCount: 2,
      },
    }
    for (const row of GENERAL_RHF_GATE_MATRIX) {
      const extras = extrasBy[`${row.programType}|${row.structure}|${row.round}`]
      const independent = buildIndependentCommonInfo({
        formValues:
          row.structure === 'curriculum'
            ? curriculumFormValues({ 1: '단원1', 2: '단원2' })
            : {
                ...absentFormValues(),
                programTitleKo: presentField('일정 프로그램'),
                schedule: {
                  eventNameByDetail: { 1: '행사1', 2: '행사2' },
                  scheduleDateByDetailIso: {},
                  groupTimesByDetail: {},
                  educationFormByDetail: {},
                  participationByDetail: {},
                  ipsByDetailIndex: {},
                  assignmentByDetail: {},
                  preEducationName: '',
                },
              },
        editorExtras: extras,
        baseline: baseProgram(),
        mode: 'create',
      })
      const programType = resolveGeneralProgramCreateProgramType(
        independent.programDraft.generalProgramAudience,
        independent.programDraft.generalParticipantTypes
      )
      expect(programType).toBe(row.programType)
      expect(independent.programDraft.generalProgramEducationStructure).toBe(row.structure)
      expect(independent.programDraft.generalProgramSessionRound).toBe(row.round)
      if (row.structure === 'curriculum') {
        expect(independent.programDraft.generalCommonInfo?.curriculumSessions?.length).toBeGreaterThan(0)
      } else {
        expect(independent.programDraft.generalCommonInfo?.scheduleDetails?.length).toBeGreaterThan(0)
      }
    }
  })

  it('임시저장 복원: 신청 apply→collect 왕복, 취소는 baseline 재시드', () => {
    applyOperationalOverlayForCatalogId(
      'application-participant-school',
      schoolApplicationOverlay
    )
    const collected = collectOperationalOverlayForCatalogId('application-participant-school') ?? {}
    const restoredAdapted = overlayKvToIndependentApplicationInput(collected)
    const restored = buildIndependentApplicationDraft({
      catalog: 'application-participant-school',
      formValues: restoredAdapted.formValues,
      sidecars: restoredAdapted.sidecars,
    })
    expect(restored.overlay['application.institution.teacherEmail']).toBe('teacher@school.kr')
    expect(restored.localOverlay['application.institution.teacherEmail']).toBe('teacher@school.kr')

    const edited = buildIndependentCommonInfo({
      formValues: { ...curriculumFormValues({ 1: '수정' }), publicProgramTitle: presentField('바꿈') },
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: baseProgram(),
      mode: 'update',
    })
    const cancelled = buildIndependentCommonInfo({
      formValues: { ...absentFormValues(), publicProgramTitle: FIELD_ABSENT },
      editorExtras: deriveIndependentEditorExtrasFromProgram(baseProgram()),
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(edited.programDraft.generalCommonInfo?.announcementTitle).toBe('바꿈')
    expect(cancelled.programDraft.generalCommonInfo?.announcementTitle).toBe('기존 공고')
  })

  it('빈값·null KPI present 는 draft 0 / 키 부재는 baseline', () => {
    const presentNull = buildIndependentCommonInfo({
      formValues: {
        ...absentFormValues(),
        kpiParticipantCount: presentField(null, null),
      },
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: {
        ...baseProgram(),
        generalCommonInfo: {
          ...baseProgram().generalCommonInfo,
          kpi: {
            finalParticipants: 40,
            instructorCount: 3,
            volunteerCount: 2,
            finalSchools: 6,
            finalClasses: 9,
          },
        },
      },
      mode: 'update',
    })
    expect(presentNull.programDraft.generalCommonInfo?.kpi?.finalParticipants).toBe(0)
    const absent = buildIndependentCommonInfo({
      formValues: absentFormValues(),
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: {
        ...baseProgram(),
        generalCommonInfo: {
          ...baseProgram().generalCommonInfo,
          kpi: {
            finalParticipants: 40,
            instructorCount: 3,
            volunteerCount: 2,
            finalSchools: 6,
            finalClasses: 9,
          },
        },
      },
      mode: 'update',
    })
    expect(absent.programDraft.generalCommonInfo?.kpi?.finalParticipants).toBe(40)
  })
})

describe('P0 RHF 연결 준비', () => {
  it('Independent CommonInfo 키 맵은 완전하고 상세 RHF와 형태가 다른 항목이 있다', () => {
    expect(commonInfoRhfFieldMapCoversAllKeys()).toBe(true)
    const mismatches = INDEPENDENT_TO_DETAIL_RHF_ADAPTER.filter(
      item => item.status === 'shape-mismatch' || item.status === 'extras-not-form'
    )
    expect(mismatches.map(item => item.independent)).toEqual(
      expect.arrayContaining(['curriculum', 'schedule', 'operationRangeSeal'])
    )
  })

  it('위저드는 RHF가 없고 상세 공통/모집은 useForm이 있다', () => {
    const dir = path.join(__dirname, '../../ui/registration/registration-fullpage-modal.tsx')
    const wizard = readFileSync(dir, 'utf8')
    expect(wizard.includes("from 'react-hook-form'")).toBe(false)
    const commonForm = readFileSync(
      path.join(__dirname, '../../hooks/use-common-info-edit-form.ts'),
      'utf8'
    )
    expect(commonForm.includes('useForm')).toBe(true)
    expect(commonForm.includes('curriculumSessions')).toBe(true)
    expect(RECRUITMENT_RHF_CONNECTABLE.wizardRhf).toBe(false)
    expect(RECRUITMENT_RHF_CONNECTABLE.connectableWithAdapter).toBe(true)
    expect(APPLICATION_RHF_CONNECTABLE.sink).toBe('form-version-overlay')
    expect(MEDIA_RHF_CONNECTABLE.sink).toMatch(/fileObjectId|PUT/)
  })

  it('세션 계약은 COMPLETE이고 위저드 FormProvider 부재는 남는다', () => {
    expect(GENERAL_RHF_CONTRACT_ALIGNMENT_STATUS).toBe(
      'GENERAL_RHF_CONTRACT_ALIGNMENT_COMPLETE'
    )
    expect(GENERAL_RHF_MIGRATION_GATE_STATUS).toBe('GENERAL_RHF_MIGRATION_GATE_BLOCKED')
    expect(GENERAL_RHF_GATE_BLOCKERS).toEqual([
      'wizard-has-no-form-provider',
      'known-diff-change-required',
    ])
    expect(GENERAL_RHF_SESSION_SCENARIOS.every(item => item.verdict === 'matches-be')).toBe(true)
  })
})
