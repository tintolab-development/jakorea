/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'

const customInstanceMock = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/orval-mutator', () => ({ customInstance: customInstanceMock }))
vi.mock('@/features/sponsor/api/admin-sponsors-service', () => ({
  shouldUseSponsorsRemoteApi: () => false,
  getSponsorOptionsList: vi.fn(),
  getSponsorContacts: vi.fn(),
}))

import { applyUjatDevAutofillCase, UjatDevAutofillError, type UjatDevAutofillResult } from './apply-dev-autofill'
import type { UjatBasicInfoFormValues } from './ujat-basic-info-form'
import { UJAT_DEV_AUTOFILL_CASE_IDS, type UjatDevAutofillCaseId } from './dev-autofill-cases'
import type { ResolvedUjatDevDependencies } from './dev-autofill-fixture'
import { listFridaysInRange, buildUjatDevDatePlan } from './dev-autofill-fixture'
import { listUjatEducationRegionsActive } from './ujat-education-regions'
import { listIncompleteUjatProgramRegistrationWizardRequiredFields } from './ujat-program-registration-required-fields'
import {
  buildUjatProgramListRowFromRegistrationSnapshot,
  collectUjatRegistrationCreateOverlay,
} from './ujat-registration-local-save'
import { toCreateRequest } from '@/features/program/ujat/api/adapters'
import { applyUjatRecruitFormValuesToProgram } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { toProgramRecruitmentWindows } from '@/features/program/shared/lib/program-edit-window'
import {
  clearRegistrationStepTemplateSelections,
  setRegistrationStepTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'
import {
  clearRegistrationWizardSessionDrafts,
  peekRegistrationWizardSessionDrafts,
} from '@/features/program/general/lib/registration-wizard-session-drafts'
import {
  getUjatProgramRegistrationOverlayRecord,
  patchUjatProgramRegistrationOverlay,
  resetUjatProgramRegistrationOverlayStoreForTests,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  peekUjatRecruitInstitutionOverlayRecord,
  resetUjatRecruitInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  peekUjatRecruitVolunteerOverlayRecord,
  resetUjatRecruitVolunteerOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { resetGeneralRecruitOverlayStoreForTests } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  peekUjatApplicationInstitutionOverlayRecord,
  resetUjatApplicationInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  peekUjatApplicationVolunteerOverlayRecord,
  resetUjatApplicationVolunteerOverlayStoreForTests,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import { resetGeneralApplicationOverlayStoreForTests } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'

const YEAR = 2026
const VOLUNTEER_CODE = 'recruitment-ujat-volunteer'
const INSTITUTION_CODE = 'recruitment-ujat-school'

function deps(overrides: Partial<ResolvedUjatDevDependencies> = {}): ResolvedUjatDevDependencies {
  return {
    regions: listUjatEducationRegionsActive(),
    /** 등록 필수 — 「전체」(__all__)는 더 이상 허용하지 않는다 */
    sponsor: { sponsorId: '1001', contactId: '2001' },
    instructorId: '501',
    paymentItemValues: ['p-1'],
    holidayDateKeys: new Set(),
    ...overrides,
  }
}

function apply(caseId: UjatDevAutofillCaseId, overrides?: Partial<ResolvedUjatDevDependencies>) {
  return applyUjatDevAutofillCase({ caseId, businessYear: YEAR, dependencies: deps(overrides) })
}

function createRequest(result: UjatDevAutofillResult) {
  const overlay = collectUjatRegistrationCreateOverlay(getUjatProgramRegistrationOverlayRecord())
  let program = buildUjatProgramListRowFromRegistrationSnapshot({
    id: 'p',
    overlay,
    basicInfo: result.typedBasicInfo as Partial<UjatBasicInfoFormValues>,
  })
  program = applyUjatRecruitFormValuesToProgram(
    program,
    'institution',
    result.typedRecruitment.institution as ProgramDetailEditFormValues,
    { createMissing: true }
  )
  program = applyUjatRecruitFormValuesToProgram(
    program,
    'volunteer_h1',
    result.typedRecruitment.volunteerH1 as ProgramDetailEditFormValues,
    { createMissing: true }
  )
  program = applyUjatRecruitFormValuesToProgram(
    program,
    'volunteer_h2',
    result.typedRecruitment.volunteerH2 as ProgramDetailEditFormValues,
    { createMissing: true }
  )
  return toCreateRequest(program, { draft: undefined as never, overlay })
}

afterEach(() => {
  vi.unstubAllEnvs()
  customInstanceMock.mockReset()
  resetUjatProgramRegistrationOverlayStoreForTests()
  resetUjatRecruitInstitutionOverlayStoreForTests()
  resetUjatRecruitVolunteerOverlayStoreForTests()
  resetGeneralRecruitOverlayStoreForTests()
  resetUjatApplicationInstitutionOverlayStoreForTests()
  resetUjatApplicationVolunteerOverlayStoreForTests()
  resetGeneralApplicationOverlayStoreForTests()
  clearRegistrationWizardSessionDrafts()
  clearRegistrationStepTemplateSelections()
})

describe.each(UJAT_DEV_AUTOFILL_CASE_IDS)('%s — 6단계 적용', caseId => {
  it('공통정보·기관/H1/H2 모집·기관/봉사자 신청을 모두 채우고 필수값 누락이 없다', async () => {
    const result = await apply(caseId)

    expect(result.incompleteRequiredFields).toEqual([])
    expect(
      listIncompleteUjatProgramRegistrationWizardRequiredFields(
        result.typedBasicInfo,
        result.typedEducationSchedule,
        result.typedRecruitment
      )
    ).toEqual([])
    expect(Object.keys(getUjatProgramRegistrationOverlayRecord()).some(key => key.startsWith('ujat.h1.') || key.startsWith('ujat.h2.') || key.startsWith('ujat.basicInfo.') || key.startsWith('ujat.kpi.') || key.startsWith('ujat.recruit.'))).toBe(false)
    expect(result.manualInputRequired).toEqual([])

    expect(result.typedBasicInfo.title).toBe(result.programManagementName)
    expect(Object.keys(peekUjatRecruitInstitutionOverlayRecord(INSTITUTION_CODE))).toEqual([])
    expect(Object.keys(peekUjatRecruitVolunteerOverlayRecord(VOLUNTEER_CODE))).toEqual([])
    expect(result.typedRecruitment.institution.applicationMethod).toBeTruthy()
    expect(result.typedRecruitment.volunteerH1.interviewStartDate).not.toBe(
      result.typedRecruitment.volunteerH2.interviewStartDate
    )
    expect(result.typedRecruitment.volunteerH1.volunteerInterviewConfig).not.toEqual(
      result.typedRecruitment.volunteerH2.volunteerInterviewConfig
    )
    expect(peekUjatApplicationInstitutionOverlayRecord('application-ujat-school')['ujatApplication.applicationRegion']).toBeTruthy()
    expect(peekUjatApplicationVolunteerOverlayRecord('application-ujat-volunteer')['ujatVolunteerApplication.universityName']).toBe('한국대학교')
    const sessionCodes = peekRegistrationWizardSessionDrafts().map(entry => entry.templateCode).sort()
    expect(sessionCodes).toEqual(['application-ujat-school', 'application-ujat-volunteer'])
  })

  it('자동입력 경로에서 서버 요청(Mutation 포함)이 0건이다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await apply(caseId)
    expect(customInstanceMock).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('Request — 기관 행은 면접 정책이 없고, H1 봉사자 행은 면접 필수·FIRST_HALF, sentinel ID가 식별자로 가지 않는다', async () => {
    const result = await apply(caseId)
    const body = createRequest(result)
    const institution = body.recruitments?.find(row => row.recruitmentType === 'PARTICIPANT')
    const h1 = body.recruitments?.find(row => row.recruitTerm === 'FIRST_HALF')
    expect(institution?.interviewEnabled).toBeUndefined()
    expect(h1).toMatchObject({ recruitmentType: 'VOLUNTEER', interviewEnabled: true, status: 'ACTIVE' })
    expect(body.sponsorId).not.toBe('__all__')
    expect(body.detailedProgramId == null || typeof body.detailedProgramId === 'number').toBe(true)
    expect(JSON.stringify(body.recruitments)).not.toContain('__')
  })

  it('Request — 기관 1 + H1 1 + H2 1 행을 만들고 각 반기 모집·면접 기간은 해당 반기 값만 쓴다', async () => {
    const result = await apply(caseId)
    const plan = buildUjatDevDatePlan(caseId, YEAR)
    /** BE LocalDate 계약 — Asia/Seoul 달력일 YYYY-MM-DD */
    const calendar = (key: string) => key
    const rows = createRequest(result).recruitments ?? []

    expect(rows).toHaveLength(3)
    expect(rows.map(row => [row.recruitmentType, row.recruitTerm ?? null])).toEqual([
      ['PARTICIPANT', null],
      ['VOLUNTEER', 'FIRST_HALF'],
      ['VOLUNTEER', 'SECOND_HALF'],
    ])
    const [institution, h1, h2] = rows
    expect(institution).not.toHaveProperty('interviewEnabled')
    expect(institution).not.toHaveProperty('interviewStartAt')
    expect(institution).not.toHaveProperty('interviewEndAt')

    for (const [row, half] of [
      [h1, 'h1'],
      [h2, 'h2'],
    ] as const) {
      expect(row).toMatchObject({
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        applicationType: 'VOLUNTEER',
        status: 'ACTIVE',
        selectionMethod: 'ADMIN_REVIEW',
        interviewEnabled: true,
        startAt: calendar(plan.halves[half].recruit.start),
        endAt: calendar(plan.halves[half].recruit.end),
        interviewStartAt: calendar(plan.halves[half].interview.start),
        interviewEndAt: calendar(plan.halves[half].interview.end),
      })
    }
    expect(h2?.interviewStartAt).not.toBe(h1?.interviewStartAt)
    expect(h2?.startAt).not.toBe(h1?.startAt)
    expect(h2?.announcementTitle).toContain('하반기')
    expect(h1?.announcementTitle).toContain('상반기')
  })
})

describe('케이스 전환 잔류값', () => {
  it('REG-06 → REG-01: 추가 학년/수업시간 블록·강사 ID·불가일·추가 일정 행이 남지 않는다', async () => {
    await apply('REG-06')
    const result = await apply('REG-01')
    const registration = getUjatProgramRegistrationOverlayRecord()
    expect(Object.keys(registration).some(key => key.startsWith('ujat.h1.') || key.startsWith('ujat.h2.'))).toBe(false)
    const h1Pre = result.typedEducationSchedule.halfPlans
      ?.find(plan => plan.semesterType === 'FIRST_HALF')
      ?.stages?.find(stage => stage.stage === 'PRE_EDUCATION')?.rows ?? []
    const h2Pre = result.typedEducationSchedule.halfPlans
      ?.find(plan => plan.semesterType === 'SECOND_HALF')
      ?.stages?.find(stage => stage.stage === 'PRE_EDUCATION')?.rows ?? []
    expect(h2Pre[0]?.textbook?.provisionMethod).toBe('ja')
    expect(h1Pre).toHaveLength(1)
    expect(h1Pre[0]?.excludedDates).toEqual([])

    const institutionApp = peekUjatApplicationInstitutionOverlayRecord('application-ujat-school')
    expect(Object.keys(institutionApp['ujatApplication.gradeDetailByBlock'] as object)).toEqual(['ujat-dev-grade-1'])
    const session = peekRegistrationWizardSessionDrafts().find(entry => entry.templateCode === 'application-ujat-school')
    expect(session?.editorState?.ujatGradeApplicationBlockIds).toEqual(['ujat-dev-grade-1'])
    const volunteerSession = peekRegistrationWizardSessionDrafts().find(
      entry => entry.templateCode === 'application-ujat-volunteer'
    )
    expect(volunteerSession?.editorState).toEqual({ ujatVolunteerApplicationType: 'ujat-graduate' })
  })

  it('REG-03 → REG-02: H2 D-7 노출 옵션이 남지 않는다', async () => {
    const first = await apply('REG-03')
    expect(first.typedRecruitment.volunteerH2.volunteerRecruitmentNoticeExposure).toBe('one-week-before')
    const second = await apply('REG-02')
    expect(second.typedRecruitment.volunteerH2.volunteerRecruitmentNoticeExposure).toBe('start-day')
  })

  it('같은 케이스를 두 번 적용해도 결과가 같다', async () => {
    await apply('REG-04')
    const first = structuredClone(getUjatProgramRegistrationOverlayRecord())
    await apply('REG-04')
    expect(getUjatProgramRegistrationOverlayRecord()).toEqual(first)
  })

  it('UJAT 소유가 아닌 키와 다른 반기 store 밖 값은 보존한다', async () => {
    patchUjatProgramRegistrationOverlay({ 'other.devNote': 'keep' })
    await apply('REG-01')
    expect(getUjatProgramRegistrationOverlayRecord()['other.devNote']).toBe('keep')
  })
})

describe('선택된 운영 양식 버킷', () => {
  it('모집·신청 모두 사용자가 고른 양식 코드에 쓰고 기본 코드 버킷은 건드리지 않는다', async () => {
    setRegistrationStepTemplateSelection('UJAT', 'recruit-volunteer-h1', 'recruitment-ujat-volunteer-copy-dev')
    setRegistrationStepTemplateSelection('UJAT', 'application-ujat-school', 'application-ujat-school-copy-dev')
    const result = await apply('REG-01')

    expect(result.targets.recruitVolunteer).toEqual(['recruitment-ujat-volunteer-copy-dev'])
    expect(result.targets.applicationInstitution).toBe('application-ujat-school-copy-dev')
    expect(result.typedRecruitment.volunteerH2.interviewStartDate).toBeTruthy()
    expect(Object.keys(peekUjatRecruitVolunteerOverlayRecord('recruitment-ujat-volunteer-copy-dev'))).toEqual([])
    expect(Object.keys(peekUjatRecruitVolunteerOverlayRecord(VOLUNTEER_CODE))).toEqual([])
    expect(
      peekUjatApplicationInstitutionOverlayRecord('application-ujat-school-copy-dev')[
        'ujatApplication.applicationRegion'
      ]
    ).toBeTruthy()
    expect(Object.keys(peekUjatApplicationInstitutionOverlayRecord('application-ujat-school'))).toEqual([])
    // 고른 양식의 세션 draft가 없으면 기본 seed로 덮지 않고 직접 확인을 요구한다.
    expect(result.manualInputRequired).toContain('application.institution.draft')
    expect(
      listIncompleteUjatProgramRegistrationWizardRequiredFields(
        result.typedBasicInfo,
        result.typedEducationSchedule,
        result.typedRecruitment
      )
    ).toEqual([])
  })
})

describe('안전 장치', () => {
  it('DEV가 아니면 실행하지 않고 store를 바꾸지 않는다', async () => {
    vi.stubEnv('DEV', false)
    await expect(apply('REG-01')).rejects.toMatchObject({ code: 'NOT_DEV' })
    expect(getUjatProgramRegistrationOverlayRecord()).toEqual({})
  })

  it('Fixture 검증이 실패하면 6단계 어디에도 쓰지 않는다', async () => {
    await apply('REG-01')
    const before = structuredClone(getUjatProgramRegistrationOverlayRecord())
    const h2Event = buildUjatDevDatePlan('REG-04', YEAR).halves.h2.event
    const allHolidays = new Set(listFridaysInRange(h2Event))
    const error = await apply('REG-04', { holidayDateKeys: allHolidays }).catch(e => e)
    expect(error).toBeInstanceOf(UjatDevAutofillError)
    expect((error as UjatDevAutofillError).code).toBe('FIXTURE_INVALID')
    expect((error as UjatDevAutofillError).issues.map(issue => issue.code)).toContain('NO_AVAILABLE_FRIDAY')
    expect(getUjatProgramRegistrationOverlayRecord()).toEqual(before)
  })

  it('활성 지역이 없으면 실패하고 store를 바꾸지 않는다', async () => {
    await expect(apply('REG-01', { regions: [] })).rejects.toThrow(/교육 지역/)
    expect(getUjatProgramRegistrationOverlayRecord()).toEqual({})
  })

  it('강사 섭외 케이스에서 강사 조회가 안 되면 직접 입력 필요로 알린다', async () => {
    const result = await apply('REG-05', { instructorId: null })
    expect(result.manualInputRequired).toEqual(['h2.pre.textbookInstructorId'])
  })

  it('유효한 지급 항목이 없으면 빈 값으로 두어 필수 검증에 걸리게 한다', async () => {
    const result = await apply('REG-01', { paymentItemValues: [] })
    expect(result.manualInputRequired).toContain('wage.paymentItemValues')
    expect(result.incompleteRequiredFields).not.toContain('wage.paymentItemValues')
  })

  it('참조 데이터 조회 중 다시 누르면 막는다', async () => {
    let releaseDependencies!: (value: ResolvedUjatDevDependencies) => void
    const deferredDependencies = new Promise<ResolvedUjatDevDependencies>(resolve => {
      releaseDependencies = resolve
    })
    const first = applyUjatDevAutofillCase({
      caseId: 'REG-01',
      businessYear: YEAR,
      dependencies: deferredDependencies,
    })
    await expect(apply('REG-02')).rejects.toMatchObject({ code: 'ALREADY_RUNNING' })
    releaseDependencies(deps())
    const result = await first
    expect(result.caseId).toBe('REG-01')
    expect(customInstanceMock).not.toHaveBeenCalled()
  })
})

describe('Negative — 제품 검증 대조', () => {
  it('NEG-01 — 반기 면접 기간을 지우면 제품 필수값 검증이 해당 반기를 막는다', async () => {
    const result = await apply('REG-01')
    const typedRecruitment = {
      ...result.typedRecruitment,
      volunteerH2: {
        ...result.typedRecruitment.volunteerH2,
        interviewStartDate: '',
        interviewEndDate: '',
      },
    }
    expect(listIncompleteUjatProgramRegistrationWizardRequiredFields(result.typedBasicInfo, result.typedEducationSchedule, typedRecruitment)).toContain(
      'recruit.volunteer.h2.interviewRangeSeal'
    )
  })

  it('NEG-02 — 현행 제품 FE 필수값 검증은 면접 시작 > 종료를 막지 않는다 (NEEDS_DECISION)', async () => {
    const result = await apply('REG-01')
    const typedRecruitment = {
      ...result.typedRecruitment,
      volunteerH1: {
        ...result.typedRecruitment.volunteerH1,
        interviewStartDate: '2027-02-07T00:00:00.000Z',
        interviewEndDate: '2027-02-05T00:00:00.000Z',
      },
    }
    expect(listIncompleteUjatProgramRegistrationWizardRequiredFields(result.typedBasicInfo, result.typedEducationSchedule, typedRecruitment)).toEqual([])
  })

  it('NEG-03 — 현행 제품 FE 필수값 검증은 사업 기간 연도 불일치를 막지 않는다 (NEEDS_DECISION)', async () => {
    const result = await apply('REG-01')
    patchUjatProgramRegistrationOverlay({
      'ujat.basicInfo.operationRangeSeal': {
        start: '2027-03-01T00:00:00.000Z',
        end: '2028-02-28T00:00:00.000Z',
      },
    })
    expect(listIncompleteUjatProgramRegistrationWizardRequiredFields(result.typedBasicInfo, result.typedEducationSchedule, result.typedRecruitment)).toEqual([])
  })
})

describe('GET recruitments[] 재수화', () => {
  it('H1/H2 면접 시작·종료를 각 반기 행에 그대로 보존한다', () => {
    const plan = buildUjatDevDatePlan('REG-02', YEAR)
    const rows = toProgramRecruitmentWindows([
      { id: 1, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
      {
        id: 2,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        recruitTerm: 'FIRST_HALF',
        interviewEnabled: true,
        interviewStartAt: `${plan.halves.h1.interview.start}T00:00:00+09:00`,
        interviewEndAt: `${plan.halves.h1.interview.end}T00:00:00+09:00`,
      },
      {
        id: 3,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        recruitTerm: 'SECOND_HALF',
        interviewEnabled: true,
        interviewStartAt: `${plan.halves.h2.interview.start}T00:00:00+09:00`,
        interviewEndAt: `${plan.halves.h2.interview.end}T00:00:00+09:00`,
      },
    ] as never)
    const h1 = rows?.find(row => row.recruitTerm === 'FIRST_HALF')
    const h2 = rows?.find(row => row.recruitTerm === 'SECOND_HALF')
    expect(h1?.interviewStartAt).toBe(`${plan.halves.h1.interview.start}T00:00:00+09:00`)
    expect(h2?.interviewStartAt).toBe(`${plan.halves.h2.interview.start}T00:00:00+09:00`)
    expect(h2?.interviewEndAt).toBe(`${plan.halves.h2.interview.end}T00:00:00+09:00`)
  })
})
