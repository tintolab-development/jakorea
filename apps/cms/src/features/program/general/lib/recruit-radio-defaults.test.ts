/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import {
  RECRUIT_INSTRUCTOR_TARGETS_DEFAULT,
  RECRUIT_INSTRUCTOR_TARGETS_KEY,
  withGeneralRecruitRadioDefaults,
} from './recruit-radio-defaults'
import { prefillDetailEditRecruitRadioDefaults } from './recruit-radio-edit-prefill'
import { buildGeneralProgramCreateFromWizardRhf } from './overlay-phase1/build-registration-create-from-rhf'
import { createDefaultRegistrationWizardUiValues } from './overlay-phase1/registration-wizard-ui-values'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { listIncompleteGeneralProgramRecruitmentRequiredFields } from './registration-recruitment-required-fields'
import {
  registerGeneralRegistrationWizardRhf,
  type GeneralRegistrationWizardRhfApi,
} from './overlay-phase1/registration-wizard-rhf-api'
import {
  clearOperationalSeedDefaultSuppression,
  suppressOperationalSeedDefaults,
} from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'

type EditRadioValues = Parameters<typeof prefillDetailEditRecruitRadioDefaults>[1]

const ALL = { individual: true, organization: true, teacherInstructor: true, volunteer: true }
const NONE = { individual: false, organization: false, teacherInstructor: false, volunteer: false }

afterEach(() => clearOperationalSeedDefaultSuppression())

describe('withGeneralRecruitRadioDefaults', () => {
  it('선택된 탭의 미기록 라디오를 화면 기본값으로 채운다', () => {
    expect(withGeneralRecruitRadioDefaults({}, ALL, { wizardKv: true })).toEqual({
      'recruit.announcementPublished': 'published',
      'recruit.studentListRequired': 'need',
      'recruit.preguidanceRequired': 'need',
      'recruit.individual.announcementPublished': 'published',
      'recruit.individual.interviewRequired': 'yes',
      'recruit.instructor.announcementPublished': 'published',
      [RECRUIT_INSTRUCTOR_TARGETS_KEY]: [...RECRUIT_INSTRUCTOR_TARGETS_DEFAULT],
      'recruit.volunteer.announcementPublished': 'published',
      'recruit.volunteer.interviewRequired': 'yes',
    })
  })

  it('사용자가 고른 값은 유지한다', () => {
    const kv = {
      'recruit.individual.announcementPublished': 'unpublished',
      'recruit.individual.interviewRequired': 'no',
    }
    expect(withGeneralRecruitRadioDefaults(kv, { ...NONE, individual: true })).toEqual(kv)
  })

  it("공고 게시 '' 은 화면 미선택이라 유지, 면접 유무 '' 는 화면이 면접 있음이라 yes", () => {
    const out = withGeneralRecruitRadioDefaults(
      { 'recruit.volunteer.announcementPublished': '', 'recruit.volunteer.interviewRequired': '' },
      { ...NONE, volunteer: true }
    )
    expect(out['recruit.volunteer.announcementPublished']).toBe('')
    expect(out['recruit.volunteer.interviewRequired']).toBe('yes')
  })

  it('선택하지 않은 탭은 건드리지 않고 같은 객체를 돌려준다', () => {
    const kv = { foo: 1 }
    expect(withGeneralRecruitRadioDefaults(kv, NONE)).toBe(kv)
  })

  it('기관 limitDefaults 를 따른다', () => {
    expect(
      withGeneralRecruitRadioDefaults(
        {},
        { ...NONE, organization: true },
        { institutionDefaults: { studentListRequired: 'none' } }
      )['recruit.studentListRequired']
    ).toBe('none')
  })

  it('필드 폼 경로에서 시드 억제된 키(화면도 비어 있음)는 채우지 않고, 위저드 경로는 채운다', () => {
    suppressOperationalSeedDefaults('general-recruit', ['recruit.instructor'])
    const tab = { ...NONE, teacherInstructor: true }
    expect(withGeneralRecruitRadioDefaults({}, tab)).toEqual({})
    expect(withGeneralRecruitRadioDefaults({}, tab, { wizardKv: true })).toEqual({
      'recruit.instructor.announcementPublished': 'published',
      [RECRUIT_INSTRUCTOR_TARGETS_KEY]: [...RECRUIT_INSTRUCTOR_TARGETS_DEFAULT],
    })
  })

  it('강사 모집 대상: teacherInstructor이고 키가 없으면 성인으로 채운다', () => {
    expect(
      withGeneralRecruitRadioDefaults({}, { ...NONE, teacherInstructor: true }, { wizardKv: true })[
        RECRUIT_INSTRUCTOR_TARGETS_KEY
      ]
    ).toEqual(['adult'])
  })

  it("강사 모집 대상: 사용자 값 ['high']는 유지한다", () => {
    const kv = { [RECRUIT_INSTRUCTOR_TARGETS_KEY]: ['high'] }
    expect(
      withGeneralRecruitRadioDefaults(kv, { ...NONE, teacherInstructor: true }, { wizardKv: true })[
        RECRUIT_INSTRUCTOR_TARGETS_KEY
      ]
    ).toEqual(['high'])
  })

  it('강사 모집 대상: 명시적 []는 유지한다', () => {
    const kv = { [RECRUIT_INSTRUCTOR_TARGETS_KEY]: [] }
    expect(
      withGeneralRecruitRadioDefaults(kv, { ...NONE, teacherInstructor: true }, { wizardKv: true })[
        RECRUIT_INSTRUCTOR_TARGETS_KEY
      ]
    ).toEqual([])
  })

  it('강사 모집 대상: teacherInstructor=false면 채우지 않는다', () => {
    expect(
      withGeneralRecruitRadioDefaults({}, { ...NONE, organization: true }, { wizardKv: true })[
        RECRUIT_INSTRUCTOR_TARGETS_KEY
      ]
    ).toBeUndefined()
  })

  it('강사 모집 대상: wizardKv=false이고 억제된 경우 채우지 않는다', () => {
    suppressOperationalSeedDefaults('general-recruit', ['recruit.instructor'])
    expect(
      withGeneralRecruitRadioDefaults({}, { ...NONE, teacherInstructor: true })[
        RECRUIT_INSTRUCTOR_TARGETS_KEY
      ]
    ).toBeUndefined()
  })
})

const INSTRUCTOR_TAB = { ...NONE, teacherInstructor: true }

function registerWizardKv(
  kv: Record<string, unknown>,
  participant: typeof ALL = INSTRUCTOR_TAB
) {
  const values = {
    ...createDefaultRegistrationWizardUiValues({ participant }),
    recruitmentKv: kv,
  }
  const api: GeneralRegistrationWizardRhfApi = {
    getValues: () => values as never,
    getPath: () => undefined,
    setPath: vi.fn(),
    reset: vi.fn(),
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
  }
  registerGeneralRegistrationWizardRhf(api)
  return values
}

describe('강사 모집 대상 — 필수 검사와 CREATE가 같은 기본값을 읽는다', () => {
  afterEach(() => {
    registerGeneralRegistrationWizardRhf(null)
  })

  it('키가 없으면 필수 검사는 미입력으로 보지 않고 CREATE에 성인을 싣는다', () => {
    const kv: Record<string, unknown> = {}
    registerWizardKv(kv)
    const missing = listIncompleteGeneralProgramRecruitmentRequiredFields({
      participant: INSTRUCTOR_TAB,
      programType: 'curriculum',
      sessionRoundType: 'single',
      educationScheduleMode: 'date',
      volunteerExceptionScheduleCount: 0,
    })
    expect(missing).not.toContain('recruit.instructor.recruitTargets')

    const values = createDefaultRegistrationWizardUiValues({
      programType: 'curriculum',
      sessionRoundType: 'single',
      curriculumChartSessionCount: 1,
      participant: INSTRUCTOR_TAB,
    })
    const built = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-instructor-targets-default',
      uiValues: {
        ...values,
        programTitleKo: '[BOT-TEST] instructor targets default',
        recruitmentKv: kv,
      } as typeof values,
    })
    expect(built.persistOverlay[RECRUIT_INSTRUCTOR_TARGETS_KEY]).toEqual(['adult'])
    expect(built.program.instructorTargets).toEqual(['adult'])
    const detail = JSON.parse(built.createRequest.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: { instructorRecruitmentInfo?: { recruitmentTarget?: string } }
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(detail.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentTarget).toBe('성인')
    expect(detail.registration?.overlay?.[RECRUIT_INSTRUCTOR_TARGETS_KEY]).toEqual(['adult'])
  })

  it('명시적 []이면 필수 검사가 막는다', () => {
    registerWizardKv({ [RECRUIT_INSTRUCTOR_TARGETS_KEY]: [] })
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields({
        participant: INSTRUCTOR_TAB,
        programType: 'curriculum',
        sessionRoundType: 'single',
        educationScheduleMode: 'date',
        volunteerExceptionScheduleCount: 0,
      })
    ).toContain('recruit.instructor.recruitTargets')
  })

  it('기관 targetLevels와 봉사자 volunteerTargets는 그대로 직렬화한다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'curriculum',
      sessionRoundType: 'single',
      curriculumChartSessionCount: 1,
      participant: ALL,
    })
    const built = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-target-regression',
      uiValues: {
        ...values,
        programTitleKo: '[BOT-TEST] target regression',
        recruitmentKv: {
          'recruit.targetLevels': ['high'],
          'recruit.volunteer.volunteerTargets': ['university'],
        },
      } as typeof values,
    })
    expect(built.persistOverlay['recruit.targetLevels']).toEqual(['high'])
    expect(built.persistOverlay['recruit.volunteer.volunteerTargets']).toEqual(['university'])
    expect(built.persistOverlay[RECRUIT_INSTRUCTOR_TARGETS_KEY]).toEqual(['adult'])
  })
})

describe('위저드 RHF 생성 — 공고 게시 라디오 미조작', () => {
  it('개인·강사 공고 게시 미조작 → create 에 게시(true)로 저장', () => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'curriculum',
      sessionRoundType: 'single',
      curriculumChartSessionCount: 1,
      participant: { individual: true, organization: false, teacherInstructor: true, volunteer: false },
    })
    const ui = {
      ...values,
      programTitleKo: '[BOT-TEST] radio default',
      recruitmentKv: { 'recruit.instructor.recruitTargetDetail': '교사' },
    } as typeof values
    const built = buildGeneralProgramCreateFromWizardRhf({ id: 'local-wizard', uiValues: ui })
    const info = built.program.generalCommonInfo
    expect(info?.participantRecruitmentInfo?.announcementPublished).toBe(true)
    expect(info?.instructorRecruitmentInfo?.announcementPublished).toBe(true)
  })
})

describe('prefillDetailEditRecruitRadioDefaults — 유형별 상세 수정 초기값', () => {
  const base = (patch: Partial<Program>): Program =>
    ({ id: '186999', title: '[BOT-TEST]', ...patch }) as Program

  it('일반 기관: 서버 값이 비면 공고 게시·사전 안내 기본값', () => {
    const v = programToDetailEditValues(
      base({ backendProgramType: 'GENERAL', generalParticipantTypes: ['school_institution'] })
    )
    expect(v.participantRecruitmentAnnouncementPublished).toBe('published')
    expect(v.participantRecruitmentPreEducationRequired).toBe('required')
    expect(v.participantRecruitmentInterviewEnabled).toBeUndefined()
  })

  it('일반 개인: 공고 게시·면접 있음 기본값', () => {
    const v = programToDetailEditValues(
      base({ backendProgramType: 'GENERAL_INDIVIDUAL', generalProgramAudience: 'individual' })
    )
    expect(v.participantRecruitmentAnnouncementPublished).toBe('published')
    expect(v.participantRecruitmentInterviewEnabled).toBe('yes')
  })

  it('일반 강사·봉사 탭: 공고 게시·면접 기본값, 서버 값은 유지', () => {
    const v = programToDetailEditValues(
      base({
        backendProgramType: 'GENERAL',
        generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
        generalVolunteerInterviewEnabled: false,
        generalCommonInfo: {
          participantRecruitmentInfo: { announcementPublished: false },
        } as Program['generalCommonInfo'],
      })
    )
    expect(v.participantRecruitmentAnnouncementPublished).toBe('unpublished')
    expect(v.instructorRecruitmentAnnouncementPublished).toBe('published')
    expect(v.volunteerRecruitmentAnnouncementPublished).toBe('published')
    expect(v.volunteerRecruitmentInterviewEnabled).toBe('no')
  })

  it('봉사 면접: 스칼라가 비어도 중첩 값(false)이 있으면 그 값', () => {
    const out = prefillDetailEditRecruitRadioDefaults(
      base({
        backendProgramType: 'GENERAL',
        generalParticipantTypes: ['volunteer'],
        generalCommonInfo: {
          volunteerRecruitmentInfo: { volunteerInterviewEnabled: false },
        } as unknown as Program['generalCommonInfo'],
      }),
      {} as EditRadioValues
    )
    expect(out.volunteerRecruitmentInterviewEnabled).toBe('no')
  })

  it('1사1교: 기관 탭은 그대로(미선택), 강사 탭만 기본값', () => {
    const out = prefillDetailEditRecruitRadioDefaults(
      base({
        id: 'company-school-local-1',
        backendProgramType: 'COMPANY_SCHOOL',
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      }),
      {} as EditRadioValues
    )
    expect(out.participantRecruitmentAnnouncementPublished).toBeUndefined()
    expect(out.participantRecruitmentPreEducationRequired).toBeUndefined()
    expect(out.instructorRecruitmentAnnouncementPublished).toBe('published')
  })

  it.each([
    ['교육받은 교사', { backendProgramType: 'TRAINED_TEACHER' }],
    ['UJAT', { backendProgramType: 'UJAT' }],
    ['UJAT overlay', { ujatRegistrationOverlay: {} }],
    ['Gemini', { backendProgramType: 'GEMINI_VISITING_TRAINING' }],
    ['알 수 없는 유형 문자열', { backendProgramType: 'SOMETHING_ELSE' }],
  ])('%s: 건드리지 않는다', (_label, patch) => {
    const values: EditRadioValues = {}
    const out = prefillDetailEditRecruitRadioDefaults(
      base({
        generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
        ...(patch as Partial<Program>),
      }),
      values
    )
    expect(out).toBe(values)
  })
})
