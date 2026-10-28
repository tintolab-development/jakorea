/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/registration-overlay-sync'
import {
  EDITOR_EXTRAS_CURRICULUM_MULTI,
  EDITOR_EXTRAS_CURRICULUM_SINGLE,
  EDITOR_EXTRAS_SCHEDULE_SINGLE,
} from '@/features/program/general/lib/overlay-phase0/editor-extras-fixtures'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { programToGeneralCommonInfoEditValues } from '@/features/program/general/model/common-info-edit-schema'
import { overlayKvToIndependentCommonInfoInput } from './overlay-kv-to-common-info-form-values'
import { overlayKvToIndependentRecruitmentInput } from './overlay-kv-to-recruitment-form-values'
import { overlayKvToIndependentApplicationInput } from './overlay-kv-to-application-form-values'
import { overlayKvToIndependentMediaInput } from './overlay-kv-to-media-form-values'
import { buildIndependentCommonInfo } from './build-independent-common-info'
import { buildIndependentCommonInfoPatch } from './build-independent-common-info-patch'
import {
  buildIndependentDetailCommonInfoFromRhf,
  independentAppliesExplicitStructureReset,
  independentPreservesSiblingWhenStructureUnchanged,
} from './build-independent-detail-common-info'
import { buildIndependentRecruitmentDraft } from './build-independent-recruitment'
import {
  buildIndependentApplicationDraft,
  buildIndependentApplicationFormVersionPutOverlay,
} from './build-independent-application'
import { buildIndependentMediaSidecar } from './build-independent-media'
import { deriveIndependentEditorExtrasFromProgram, emptyCurriculumMaps } from './common-info-domain'
import { presentField, type CommonInfoFormValues } from './common-info-form-values'
import { BE_CONTRACT_EXPECTED_DIFFS } from './be-contract-expected-diff'
import {
  GENERAL_RHF_CONTRACT_ALIGNMENT_STATUS,
  GENERAL_RHF_GATE_MATRIX,
  GENERAL_RHF_SESSION_SCENARIOS,
} from './general-rhf-migration-gate'

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
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function curriculumFormValues(names: Record<number, string>, contents: Record<number, string> = {}) {
  const values = overlayKvToIndependentCommonInfoInput({}).formValues
  return {
    ...values,
    programTitleKo: presentField('신규 프로그램'),
    curriculum: {
      ...emptyCurriculumMaps(),
      unitNameBySession: names,
      unitContentBySession: contents,
    },
  } satisfies CommonInfoFormValues
}

function sessionNos(program: Program): number[] {
  return (program.generalCommonInfo?.curriculumSessions ?? []).map(row => row.sessionNo ?? -1)
}

describe('Phase 1-D BE 세션 계약 정렬', () => {
  it('known-diff 13건을 무단 변경하지 않는다', () => {
    expect(OVERLAY_PHASE0_KNOWN_DIFFS).toHaveLength(13)
  })

  it('BE_CONTRACT_EXPECTED_DIFF 6건이 Legacy와 Independent를 구분한다', () => {
    expect(BE_CONTRACT_EXPECTED_DIFFS).toHaveLength(6)
    expect(GENERAL_RHF_SESSION_SCENARIOS.every(item => item.verdict === 'matches-be')).toBe(true)
  })

  it('1. 세션 4 → 2 축소는 nested·overlay 미러가 2행이다', () => {
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues({ 1: '단원1', 2: '단원2' }, { 1: '본문1', 2: '본문2' }),
      editorExtras: { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 2 },
      baseline: {
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
      },
      mode: 'update',
    })
    expect(sessionNos(independent.programDraft)).toEqual([1, 2])
    const names = independent.persistOverlay[
      'generalRegistration.educationCurriculum.unitNameBySession'
    ] as Record<number, string>
    expect(Object.keys(names).map(Number).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it('2. 세션 2 → 0 명시적 삭제는 []', () => {
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues({}),
      editorExtras: { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 0 },
      baseline: baseProgram(),
      mode: 'update',
      sessionAuthoring: { curriculum: { kind: 'clear' } },
    })
    expect(independent.programDraft.generalCommonInfo?.curriculumSessions).toEqual([])
    const patch = buildIndependentCommonInfoPatch({
      draft: independent,
      baseline: baseProgram(),
      sessionAuthoring: { curriculum: { kind: 'clear' } },
    })
    expect(patch.curriculumSessionsIntent).toBe('clear')
    expect(patch.generalCommonInfoPatch.curriculumSessions).toEqual([])
  })

  it('3. 세션 2 → 4 추가는 nested 4행이다', () => {
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues(
        { 1: '단원1', 2: '단원2', 3: '단원3', 4: '단원4' },
        { 1: '본문1', 2: '본문2', 3: '본문3', 4: '본문4' }
      ),
      editorExtras: { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 4 },
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(sessionNos(independent.programDraft)).toEqual([1, 2, 3, 4])
  })

  it('4. nested 2 / stale overlay 4는 세션 수를 늘리지 않는다', () => {
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
    expect(extrasFromGeneralProgram(program).curriculumSessionCount).toBeGreaterThan(2)
    const adapted = overlayKvToIndependentCommonInfoInput(program.registrationOverlay ?? {})
    const independent = buildIndependentCommonInfo({
      formValues: adapted.formValues,
      sidecars: adapted.sidecars,
      editorExtras: deriveIndependentEditorExtrasFromProgram(program),
      baseline: program,
      mode: 'update',
    })
    expect(sessionNos(independent.programDraft)).toEqual([1, 2])
  })

  it('5. nested 누락 / overlay-only 는 maps로 복원한다', () => {
    const overlay = {
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '레거시1', 2: '레거시2' },
      'generalRegistration.educationCurriculum.unitContentBySession': { 1: '본문1', 2: '본문2' },
    }
    const baseline: Program = {
      ...baseProgram(),
      generalCommonInfo: { announcementTitle: '기존 공고', venueKind: 'inside' },
    }
    const adapted = overlayKvToIndependentCommonInfoInput(overlay)
    const independent = buildIndependentCommonInfo({
      formValues: adapted.formValues,
      sidecars: adapted.sidecars,
      editorExtras: EDITOR_EXTRAS_CURRICULUM_MULTI,
      baseline,
      mode: 'update',
    })
    expect(sessionNos(independent.programDraft)).toEqual([1, 2])
  })

  it('6. sparse sessionNo [1,3] 을 밀도화하지 않고 추가 시 구멍을 채우지 않는다', () => {
    const baseline: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        announcementTitle: '기존 공고',
        venueKind: 'inside',
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
          { sessionNo: 3, sessionLabel: '3회차', title: '단원3', description: '본문3' },
        ],
      },
    }
    const sparse = buildIndependentCommonInfo({
      formValues: curriculumFormValues({ 1: '단원1', 3: '단원3' }, { 1: '본문1', 3: '본문3' }),
      editorExtras: { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 2 },
      baseline,
      mode: 'update',
    })
    expect(sessionNos(sparse.programDraft)).toEqual([1, 3])

    const appended = buildIndependentCommonInfo({
      formValues: curriculumFormValues(
        { 1: '단원1', 3: '단원3', 4: '단원4' },
        { 1: '본문1', 3: '본문3', 4: '본문4' }
      ),
      editorExtras: { ...EDITOR_EXTRAS_CURRICULUM_MULTI, curriculumSessionCount: 3 },
      baseline,
      mode: 'update',
    })
    expect(sessionNos(appended.programDraft)).toEqual([1, 3, 4])
  })

  it('7. curriculumSessions 변경 없음 → PATCH omit, 명시는 []', () => {
    const omitPatch = buildIndependentCommonInfoPatch({
      draft: buildIndependentCommonInfo({
        formValues: curriculumFormValues({ 1: '단원1', 2: '단원2' }, { 1: '본문1', 2: '본문2' }),
        editorExtras: EDITOR_EXTRAS_CURRICULUM_MULTI,
        baseline: baseProgram(),
        mode: 'update',
        sessionAuthoring: { curriculum: { kind: 'omit' } },
      }),
      baseline: baseProgram(),
      sessionAuthoring: { curriculum: { kind: 'omit' } },
    })
    expect(omitPatch.curriculumSessionsIntent).toBe('omit')
    expect(omitPatch.generalCommonInfoPatch).not.toHaveProperty('curriculumSessions')
    expect(omitPatch.productMapperReserializesUnchangedNested).toBe(true)
  })

  it('8. 구조 변경 시 비활성 nested는 [] 이고 educationScheduleLines·schedules[]는 보존한다', () => {
    const schedule = buildIndependentCommonInfo({
      formValues: overlayKvToIndependentCommonInfoInput({}).formValues,
      editorExtras: EDITOR_EXTRAS_SCHEDULE_SINGLE,
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(schedule.programDraft.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(schedule.programDraft.generalCommonInfo?.educationScheduleLines).toEqual([
      '2026-06-10 10:00',
    ])
    expect(schedule.programDraft.schedules).toEqual(baseProgram().schedules)
  })

  it('9. 상세 nested RHF mapper를 재사용하고 구조 변경 시 비활성 nested를 [] 한다', () => {
    const existing = baseProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const result = buildIndependentDetailCommonInfoFromRhf({
      values: { ...values, educationStructure: 'schedule', sessionRound: 'single' },
      existing,
    })
    expect(result.structureChanged).toBe(true)
    expect(result.rhfPatch.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(
      independentAppliesExplicitStructureReset(result.programDraft, result.rhfPatch, 'schedule')
    ).toBe(true)
    expect(result.programDraft.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(result.alignedPatch.curriculumSessionsIntent).toBe('clear')
    const unchanged = buildIndependentDetailCommonInfoFromRhf({ values, existing })
    expect(unchanged.structureChanged).toBe(false)
    expect(
      independentPreservesSiblingWhenStructureUnchanged(unchanged.programDraft, existing, 'curriculum')
    ).toBe(true)
  })

  it('10. 신규 등록 formValues → Program draft → CREATE nested에 sessionNo가 있다', () => {
    const independent = buildIndependentCommonInfo({
      formValues: curriculumFormValues({ 1: '단원1' }, { 1: '본문1' }),
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: {
        ...baseProgram(),
        generalCommonInfo: { announcementTitle: '기존 공고', venueKind: 'inside' },
      },
      mode: 'create',
    })
    expect(independent.programDraft.generalCommonInfo?.curriculumSessions?.[0]?.sessionNo).toBe(1)
    const createBody = mapGeneralProgramToCreateRequest({
      ...independent.programDraft,
      registrationOverlay: independent.persistOverlay,
    })
    expect(createBody.programType).toBe('GENERAL_ORGANIZATION')
    expect(createBody.title).toBe('신규 프로그램')
    const serviceDetail =
      typeof createBody.serviceDetailJson === 'string'
        ? (JSON.parse(createBody.serviceDetailJson) as {
            generalCommonInfo?: { curriculumSessions?: Array<{ sessionNo?: number; title?: string }> }
          })
        : null
    expect(serviceDetail?.generalCommonInfo?.curriculumSessions?.[0]).toMatchObject({
      sessionNo: 1,
      title: '단원1',
    })
  })

  it('11. 기존 12개 지원 조합 회귀', () => {
    expect(GENERAL_RHF_GATE_MATRIX).toHaveLength(12)
    expect(GENERAL_RHF_GATE_MATRIX.every(row => row.support === 'supported')).toBe(true)
  })

  it('12. 신청·모집·미디어 sink 회귀', () => {
    const recruit = buildIndependentRecruitmentDraft({
      formValues: overlayKvToIndependentRecruitmentInput({
        'recruit.maxAssignableInstructors': 3,
      }).formValues,
      sidecars: { preferOverlay: true },
      baseline: baseProgram(),
      mode: 'update',
    })
    expect(recruit.programDraft.generalCommonInfo?.curriculumSessions).toEqual(
      baseProgram().generalCommonInfo?.curriculumSessions
    )

    const application = buildIndependentApplicationDraft({
      catalog: 'application-participant-school',
      formValues: overlayKvToIndependentApplicationInput({
        'application.institution.teacherEmail': 'teacher@school.kr',
      }).formValues,
      sidecars: overlayKvToIndependentApplicationInput({
        'application.institution.teacherEmail': 'teacher@school.kr',
      }).sidecars,
    })
    expect(application.sink).toBe('form-version-overlay')
    expect(buildIndependentApplicationFormVersionPutOverlay(application.overlay).overlay).toEqual(
      application.overlay
    )

    const mediaAdapted = overlayKvToIndependentMediaInput({
      'recruit.detailInfo.thumbFileObjectId': 77,
    })
    const media = buildIndependentMediaSidecar({
      formValues: mediaAdapted.formValues,
      sidecars: {
        ...mediaAdapted.sidecars,
        created: { id: '186234', programRecruitments: [{ id: 9, recruitmentType: 'PARTICIPANT' }] },
      },
    })
    expect(media.bindCalls).toEqual([])
    const createBody = mapGeneralProgramToCreateRequest({
      ...baseProgram(),
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      registrationOverlay: { 'recruit.detailInfo.thumbFileObjectId': 77 },
    })
    expect(
      createBody.recruitments?.some(
        row => 'thumbnailFileObjectId' in row && (row as { thumbnailFileObjectId?: number }).thumbnailFileObjectId === 77
      )
    ).toBe(true)
  })

  it('Independent extras는 nested 0을 허용하고 Legacy extras는 overlay 맵을 따른다', () => {
    const emptyNested: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        announcementTitle: '기존 공고',
        venueKind: 'inside',
        curriculumSessions: [],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: 'stale',
          2: 'stale2',
        },
      },
    }
    expect(deriveIndependentEditorExtrasFromProgram(emptyNested).curriculumSessionCount).toBe(0)
    expect(extrasFromGeneralProgram(emptyNested).curriculumSessionCount).toBeGreaterThan(0)
  })

  it('계약 정렬 판정은 COMPLETE다', () => {
    expect(GENERAL_RHF_CONTRACT_ALIGNMENT_STATUS).toBe(
      'GENERAL_RHF_CONTRACT_ALIGNMENT_COMPLETE'
    )
  })
})
