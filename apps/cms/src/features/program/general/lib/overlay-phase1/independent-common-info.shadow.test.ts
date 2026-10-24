/** @vitest-environment node */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  buildGeneralRegistrationOverlayFromProgram,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/registration-overlay-sync'
import { omitUnchangedWageFieldsFromProgramForServiceDetail } from '@/features/program/general/lib/general-program-service-detail-json'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  EDITOR_EXTRAS_CURRICULUM_MULTI,
  EDITOR_EXTRAS_CURRICULUM_SINGLE,
  EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM,
  EDITOR_EXTRAS_SCHEDULE_MULTI,
  EDITOR_EXTRAS_SCHEDULE_SINGLE,
} from '@/features/program/general/lib/overlay-phase0/editor-extras-fixtures'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { overlayKvToIndependentCommonInfoInput } from './overlay-kv-to-common-info-form-values'
import {
  buildIndependentCommonInfo,
  seedIndependentCommonInfoOverlayFromProgram,
} from './build-independent-common-info'

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
    generalProgramSessionRound: 'single',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      venueKind: 'inside',
      kpi: {
        finalParticipants: 40,
        instructorCount: 3,
        volunteerCount: 2,
        finalSchools: 6,
        finalClasses: 9,
      },
      wageGradeRows: [{ grade: '1급 강사비', pricing: '1시간 당 | 기본 : 100,000원' }],
      paymentItems: '교통비',
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

const createOverlay: Record<string, unknown> = {
  'generalRegistration.basicInfo.localProgramTitleKo': '신규 프로그램',
  'generalRegistration.basicInfo.publicProgramTitle': '공고용 신규',
  'generalRegistration.basicInfo.programTitleEn': 'New Program',
  'generalRegistration.basicInfo.localSponsorIds': ['163001'],
  'generalRegistration.basicInfo.localSponsorId': '163001',
  'generalRegistration.basicInfo.localManagerContactIds': [SPONSOR_CONTACT_UNSELECTED_VALUE],
  'generalRegistration.basicInfo.localManagerContactId': SPONSOR_CONTACT_UNSELECTED_VALUE,
  'generalRegistration.basicInfo.businessField': 'career_employment',
  'generalRegistration.basicInfo.partnerInvolvement': 'yes',
  'generalRegistration.basicInfo.operationRangeSeal': {
    start: '2026-06-01',
    end: '2026-08-31',
  },
  'generalRegistration.kpi.participantCount': 10,
  'generalRegistration.kpi.instructor': 2,
  'generalRegistration.kpi.volunteer': 1,
  'generalRegistration.wageInfo.grade1Fee': 180000,
  'generalRegistration.wageInfo.paymentItemValues': ['traffic'],
  'generalRegistration.wageInfo.paymentItemLabels': '교통비',
  'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-06-10 10:00'],
}

function omitRegistrationOverlay(program: Program): Omit<Program, 'registrationOverlay'> {
  const { registrationOverlay: _ignored, ...rest } = program
  void _ignored
  return rest
}

function stripSessionNo(program: Program): Program {
  return {
    ...program,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      curriculumSessions: program.generalCommonInfo?.curriculumSessions?.map(row => {
        const { sessionNo: _ignored, ...rest } = row
        void _ignored
        return rest
      }),
    },
  }
}

/** Legacy는 상대 nested를 `[]`로 지우고 Independent는 보존한다. 그 필드는 비교에서 제외한다. */
function omitEducationStructureSibling(
  program: Program,
  extras: { programType: 'curriculum' | 'schedule' }
): Program {
  const common = { ...program.generalCommonInfo }
  if (extras.programType === 'curriculum') {
    delete common.scheduleDetails
  } else {
    delete common.curriculumSessions
  }
  return { ...program, generalCommonInfo: common }
}

function shadowComparable(program: Program, extras: { programType: 'curriculum' | 'schedule' }) {
  return omitRegistrationOverlay(omitEducationStructureSibling(stripSessionNo(program), extras))
}

function independentFromOverlay(
  overlay: Record<string, unknown>,
  extras: typeof EDITOR_EXTRAS_CURRICULUM_SINGLE,
  baseline: Program,
  mode: 'create' | 'update'
) {
  const adapted = overlayKvToIndependentCommonInfoInput(overlay)
  return buildIndependentCommonInfo({
    formValues: adapted.formValues,
    sidecars: adapted.sidecars,
    editorExtras: extras,
    baseline,
    mode,
  })
}

describe('Phase 1-B independent builder import guard', () => {
  it('공통정보 Builder가 overlay store·apply/resync·RHF를 호출하지 않는다', () => {
    const dir = path.dirname(new URL(import.meta.url).pathname)
    const files = [
      'build-independent-common-info.ts',
      'common-info-domain.ts',
      'common-info-form-values.ts',
      'common-info-persist-keys.ts',
    ]
    const forbiddenImport = [
      /from ['"]react['"]/,
      /from ['"]react-hook-form['"]/,
      /getProgramRegistrationOverlayRecord/,
      /peekProgramRegistrationOverlay/,
      /applyGeneralRegistrationOverlayToProgram/,
      /resyncGeneralRegistrationOverlayFromProgram/,
      /(?:import|from).*buildGeneralRegistrationOverlayFromProgram/,
    ]
    for (const file of files) {
      const source = readFileSync(path.join(dir, file), 'utf8')
      for (const token of forbiddenImport) {
        expect(token.test(source), `${file} matches ${token}`).toBe(false)
      }
    }
  })

  it('known-diff 2건은 수정 후 keep_current 이다', () => {
    const protectedIds = ['recruit-detailinfo-reseed-gap', 'empty-public-title-apply-fallback']
    for (const id of protectedIds) {
      const item = OVERLAY_PHASE0_KNOWN_DIFFS.find(diff => diff.id === id)
      expect(item, id).toBeDefined()
      expect(item?.change).toBe('keep_current')
    }
  })
})

describe('1. 일반 신규 등록 shadow', () => {
  it('Program draft·create body가 apply+mapCreate와 같다', () => {
    const extras = EDITOR_EXTRAS_CURRICULUM_SINGLE
    const legacyApplied = applyGeneralRegistrationOverlayToProgram(baseProgram(), createOverlay, extras)
    const independent = independentFromOverlay(createOverlay, extras, baseProgram(), 'create')

    expect(shadowComparable(independent.applied, extras)).toEqual(
      shadowComparable(legacyApplied, extras)
    )
    expect(independent.applied.generalCommonInfo?.scheduleDetails).toEqual(
      baseProgram().generalCommonInfo?.scheduleDetails
    )
    expect(legacyApplied.generalCommonInfo?.scheduleDetails).toEqual([])
    expect(independent.persistOverlay).toEqual(createOverlay)

    const legacyProgram: Program = {
      ...legacyApplied,
      generalProgramEducationStructure: extras.programType,
      generalProgramSessionRound: extras.sessionRoundType,
      registrationOverlay: { ...createOverlay },
    }
    const independentProgram: Program = {
      ...independent.programDraft,
      registrationOverlay: independent.persistOverlay,
    }
    expect(
      mapGeneralProgramToCreateRequest(omitEducationStructureSibling(stripSessionNo(independentProgram), extras))
    ).toEqual(
      mapGeneralProgramToCreateRequest(omitEducationStructureSibling(legacyProgram, extras))
    )
  })
})

describe('2. 기존 프로그램 상세 수정 shadow', () => {
  it('Program draft·update body가 apply+resync+mapUpdate와 같다', () => {
    const existing = baseProgram()
    const overlay = {
      ...createOverlay,
      'generalRegistration.basicInfo.publicProgramTitle': '수정 공고',
    }
    const extras = EDITOR_EXTRAS_CURRICULUM_SINGLE
    const legacyApplied = applyGeneralRegistrationOverlayToProgram(existing, overlay, extras)
    const withType: Program = {
      ...legacyApplied,
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
    }
    const synced = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
    const independent = independentFromOverlay(overlay, extras, existing, 'update')

    expect(shadowComparable(independent.applied, extras)).toEqual(
      shadowComparable(legacyApplied, extras)
    )
    expect(independent.applied.generalCommonInfo?.scheduleDetails).toEqual(
      existing.generalCommonInfo?.scheduleDetails
    )
    expect(legacyApplied.generalCommonInfo?.scheduleDetails).toEqual([])
    for (const key of Object.keys(overlay)) {
      expect(independent.persistOverlay).toHaveProperty(key)
    }
    expect(independent.persistOverlay['generalRegistration.basicInfo.publicProgramTitle']).toBe(
      '수정 공고'
    )

    const baselineRequest = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: legacyApplied.title,
        mainTitle: legacyApplied.mainTitle,
        startDate: legacyApplied.startDate,
        endDate: legacyApplied.endDate,
        generalCommonInfo: legacyApplied.generalCommonInfo,
        registrationOverlay: synced,
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'single',
      },
      existing
    )
    const independentRequest = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: independent.programDraft.title,
        mainTitle: independent.programDraft.mainTitle,
        startDate: independent.programDraft.startDate,
        endDate: independent.programDraft.endDate,
        generalCommonInfo: independent.programDraft.generalCommonInfo,
        registrationOverlay: independent.persistOverlay,
        generalProgramEducationStructure: independent.programDraft.generalProgramEducationStructure,
        generalProgramSessionRound: independent.programDraft.generalProgramSessionRound,
      },
      existing
    )
    expect(independentRequest.title).toEqual(baselineRequest.title)
    expect(independentRequest.mainTitle).toEqual(baselineRequest.mainTitle)
    expect(independent.programDraft.generalCommonInfo?.announcementTitle).toBe('수정 공고')
  })
})

describe('3. 커리큘럼형/일정형 · 단일/복수 회차 shadow', () => {
  it.each([
    ['curriculum-single', EDITOR_EXTRAS_CURRICULUM_SINGLE],
    ['curriculum-multi', EDITOR_EXTRAS_CURRICULUM_MULTI],
    ['schedule-single', EDITOR_EXTRAS_SCHEDULE_SINGLE],
    ['schedule-multi', EDITOR_EXTRAS_SCHEDULE_MULTI],
  ] as const)('%s extras 컬럼은 같고 구조 변경 시에만 상대 nested를 초기화한다', (_label, extras) => {
    const overlay = {
      ...createOverlay,
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원1', 2: '단원2' },
      'generalRegistration.educationCurriculum.unitContentBySession': { 1: '본문1', 2: '본문2' },
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail': { 1: '행사A', 2: '행사B' },
    }
    const legacy = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, extras)
    const independent = independentFromOverlay(overlay, extras, baseProgram(), 'create')
    expect(independent.programDraft.generalProgramEducationStructure).toBe(extras.programType)
    expect(independent.programDraft.generalProgramSessionRound).toBe(extras.sessionRoundType)
    if (extras.programType === 'curriculum') {
      expect(independent.applied.generalCommonInfo?.scheduleDetails).toEqual(
        baseProgram().generalCommonInfo?.scheduleDetails
      )
      expect(legacy.generalCommonInfo?.scheduleDetails).toEqual([])
    } else {
      expect(independent.applied.generalCommonInfo?.curriculumSessions).toEqual([])
      expect(legacy.generalCommonInfo?.curriculumSessions).toEqual([])
    }
  })
})

describe('4. 일정 라인 추가·삭제 shadow', () => {
  it('라인을 추가하면 educationScheduleLines가 같다', () => {
    const overlay = {
      ...createOverlay,
      'generalRegistration.educationScheduleSettings.scheduleLines': [
        '2026-06-10 10:00',
        '2026-06-17 10:00',
      ],
    }
    const legacy = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const independent = independentFromOverlay(
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseProgram(),
      'create'
    )
    expect(independent.applied.generalCommonInfo?.educationScheduleLines).toEqual(
      legacy.generalCommonInfo?.educationScheduleLines
    )
  })

  it('라인을 비우면 기존 nested 값을 유지한다', () => {
    const existing: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        educationScheduleLines: ['기존 일정'],
      },
    }
    const overlay = {
      ...createOverlay,
      'generalRegistration.educationScheduleSettings.scheduleLines': [],
    }
    const legacy = applyGeneralRegistrationOverlayToProgram(
      existing,
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const independent = independentFromOverlay(
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE,
      existing,
      'update'
    )
    expect(independent.applied.generalCommonInfo?.educationScheduleLines).toEqual(
      legacy.generalCommonInfo?.educationScheduleLines
    )
    expect(independent.applied.generalCommonInfo?.educationScheduleLines).toEqual(['기존 일정'])
  })
})

describe('5. 공고용명 빈값 · 후원 담당자 미선택 · KPI null', () => {
  it('빈 공고용명 apply는 Independent와 Legacy 모두 명시적 빈 값을 유지한다', () => {
    const overlay = { 'generalRegistration.basicInfo.publicProgramTitle': '' }
    const legacy = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const independent = independentFromOverlay(
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseProgram(),
      'update'
    )
    expect(independent.applied.generalCommonInfo?.announcementTitle).toBe(
      legacy.generalCommonInfo?.announcementTitle
    )
    expect(independent.applied.generalCommonInfo?.announcementTitle).toBe('')
  })

  it('후원 담당자 미선택은 contact id를 비운다', () => {
    const overlay = {
      ...createOverlay,
      'generalRegistration.basicInfo.localManagerContactIds': [SPONSOR_CONTACT_UNSELECTED_VALUE],
      'generalRegistration.basicInfo.localManagerContactId': SPONSOR_CONTACT_UNSELECTED_VALUE,
    }
    const legacy = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const independent = independentFromOverlay(
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseProgram(),
      'create'
    )
    expect(independent.applied.generalCommonInfo?.sponsorManagerContactIds).toEqual(
      legacy.generalCommonInfo?.sponsorManagerContactIds
    )
  })

  it('KPI null은 draft에서 0, update persist에서 null을 유지한다', () => {
    const overlay = {
      ...createOverlay,
      'generalRegistration.kpi.participantCount': null,
      'generalRegistration.kpi.instructor': null,
      'generalRegistration.kpi.volunteer': null,
    }
    const extras = EDITOR_EXTRAS_CURRICULUM_SINGLE
    const legacyApplied = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, extras)
    const withType: Program = {
      ...legacyApplied,
      generalProgramEducationStructure: extras.programType,
      generalProgramSessionRound: extras.sessionRoundType,
    }
    const synced = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
    const independent = independentFromOverlay(overlay, extras, baseProgram(), 'update')
    expect(independent.applied.generalCommonInfo?.kpi).toEqual(legacyApplied.generalCommonInfo?.kpi)
    expect(independent.applied.generalCommonInfo?.kpi?.finalParticipants).toBe(0)
    expect(independent.persistOverlay['generalRegistration.kpi.participantCount']).toBeNull()
    expect(independent.persistOverlay['generalRegistration.kpi.instructor']).toBeNull()
    expect(independent.persistOverlay['generalRegistration.kpi.volunteer']).toBeNull()
    expect(independent.persistOverlay['generalRegistration.kpi.participantCount']).toEqual(
      synced['generalRegistration.kpi.participantCount']
    )
  })
})

describe('6. 강사비 미변경 PATCH 제외', () => {
  it('omitUnchangedWage 결과가 legacy와 같다', () => {
    const existing = baseProgram()
    const overlay = {
      ...createOverlay,
      'generalRegistration.wageInfo.grade1Fee': 100000,
      'generalRegistration.wageInfo.paymentItemLabels': '교통비',
    }
    const extras = EDITOR_EXTRAS_CURRICULUM_SINGLE
    const legacyApplied = applyGeneralRegistrationOverlayToProgram(existing, overlay, extras)
    const independent = independentFromOverlay(overlay, extras, existing, 'update')
    const legacyStripped = omitUnchangedWageFieldsFromProgramForServiceDetail(
      {
        ...legacyApplied,
        registrationOverlay: resyncGeneralRegistrationOverlayFromProgram(
          {
            ...legacyApplied,
            generalProgramEducationStructure: extras.programType,
            generalProgramSessionRound: extras.sessionRoundType,
          },
          overlay
        ),
      },
      existing
    )
    const independentStripped = omitUnchangedWageFieldsFromProgramForServiceDetail(
      { ...independent.programDraft, registrationOverlay: independent.persistOverlay },
      existing
    )
    expect(independentStripped.generalCommonInfo?.wageGradeRows).toEqual(
      legacyStripped.generalCommonInfo?.wageGradeRows
    )
    expect(independentStripped.registrationOverlay?.['generalRegistration.wageInfo.grade1Fee']).toEqual(
      legacyStripped.registrationOverlay?.['generalRegistration.wageInfo.grade1Fee']
    )
  })
})

describe('7. 유형 전환 시 반대쪽 맵 초기화', () => {
  it('일정형 persist overlay는 커리큘럼 맵을 비운다', () => {
    const overlay = {
      ...createOverlay,
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원1' },
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail': { 1: '행사' },
    }
    const independent = independentFromOverlay(
      overlay,
      EDITOR_EXTRAS_SCHEDULE_SINGLE,
      baseProgram(),
      'update'
    )
    const legacy = resyncGeneralRegistrationOverlayFromProgram(
      {
        ...applyGeneralRegistrationOverlayToProgram(
          baseProgram(),
          overlay,
          EDITOR_EXTRAS_SCHEDULE_SINGLE
        ),
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'single',
      },
      overlay
    )
    expect(independent.persistOverlay['generalRegistration.educationCurriculum.unitNameBySession']).toEqual(
      {}
    )
    expect(independent.persistOverlay).toEqual(legacy)
  })

  it('커리큘럼형 persist overlay는 일정 맵을 비운다', () => {
    const overlay = {
      ...createOverlay,
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원1' },
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail': { 1: '행사' },
    }
    const independent = independentFromOverlay(
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseProgram(),
      'update'
    )
    expect(
      independent.persistOverlay['generalRegistration.educationScheduleCurriculum.eventNameByDetail']
    ).toEqual({})
  })
})

describe('8. 기존 GET 데이터 재구성', () => {
  it('nested Program seed overlay가 기존 seed와 같다', () => {
    const curriculumProgram: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '단원1', description: '본문', educationFormLabel: '온라인' },
        ],
      },
    }
    expect(seedIndependentCommonInfoOverlayFromProgram(curriculumProgram)).toEqual(
      buildGeneralRegistrationOverlayFromProgram(curriculumProgram)
    )

    const scheduleProgram: Program = {
      ...baseProgram(),
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        scheduleDetails: [
          {
            scheduleLabel: '1회',
            name: '행사',
            scheduleDateLabel: '2026-06-01',
            progressTimeSummary: '10:00-12:00',
          },
        ],
      },
    }
    expect(seedIndependentCommonInfoOverlayFromProgram(scheduleProgram)).toEqual(
      buildGeneralRegistrationOverlayFromProgram(scheduleProgram)
    )
  })
})

describe('9. PATCH 미변경 필드 · serviceDetailJson', () => {
  it('update request 키가 legacy와 같다', () => {
    const existing = baseProgram()
    const overlay = { ...createOverlay, 'generalRegistration.basicInfo.publicProgramTitle': '수정 공고' }
    const extras = EDITOR_EXTRAS_CURRICULUM_SINGLE
    const independent = independentFromOverlay(overlay, extras, existing, 'update')
    const legacyApplied = applyGeneralRegistrationOverlayToProgram(existing, overlay, extras)
    const synced = resyncGeneralRegistrationOverlayFromProgram(
      {
        ...legacyApplied,
        generalProgramEducationStructure: extras.programType,
        generalProgramSessionRound: extras.sessionRoundType,
      },
      overlay
    )
    const legacyRequest = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: legacyApplied.title,
        mainTitle: legacyApplied.mainTitle,
        startDate: legacyApplied.startDate,
        endDate: legacyApplied.endDate,
        generalCommonInfo: legacyApplied.generalCommonInfo,
        registrationOverlay: synced,
        generalProgramEducationStructure: extras.programType,
        generalProgramSessionRound: extras.sessionRoundType,
      },
      existing
    )
    const independentRequest = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: independent.programDraft.title,
        mainTitle: independent.programDraft.mainTitle,
        startDate: independent.programDraft.startDate,
        endDate: independent.programDraft.endDate,
        generalCommonInfo: independent.programDraft.generalCommonInfo,
        registrationOverlay: independent.persistOverlay,
        generalProgramEducationStructure: extras.programType,
        generalProgramSessionRound: extras.sessionRoundType,
      },
      existing
    )
    expect(Object.keys(independentRequest).sort()).toEqual(Object.keys(legacyRequest).sort())
    expect(independentRequest.title).toEqual(legacyRequest.title)
    expect(independent.programDraft.generalCommonInfo?.announcementTitle).toBe('수정 공고')
  })

  it('개인 참여자 extras도 apply와 같다', () => {
    const legacy = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      createOverlay,
      EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM
    )
    const independent = independentFromOverlay(
      createOverlay,
      EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM,
      baseProgram(),
      'create'
    )
    expect(shadowComparable(independent.applied, EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM)).toEqual(
      shadowComparable(legacy, EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM)
    )
    expect(independent.applied.generalCommonInfo?.scheduleDetails).toEqual(
      baseProgram().generalCommonInfo?.scheduleDetails
    )
    expect(legacy.generalCommonInfo?.scheduleDetails).toEqual([])
  })
})
