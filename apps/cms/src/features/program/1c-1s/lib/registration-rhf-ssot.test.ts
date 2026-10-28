/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import { mapCompanySchoolToCreateRequest } from '@/features/program/1c-1s/api/adapters'
import {
  parseCompanySchoolServiceDetailJson,
  serializeCompanySchoolServiceDetailJson,
} from '@/features/program/1c-1s/api/service-detail-json'
import {
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
  resetProgramRegistrationOverlayStoreForTests,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { collectCompanySchoolRegistrationCommonState } from './collect-registration-common-info-state'
import { importLegacyOverlayToCompanySchoolCanonical } from './import-legacy-registration-overlay'
import {
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from './registration-rhf-api'
import { listIncompleteCompanySchoolRegistrationRhfRequiredFields } from './registration-rhf-required-fields'
import {
  applyCompanySchoolRhfOverlayRecord,
  createDefaultCompanySchoolRegistrationRhfValues,
  omitCompanySchoolCommonInfoOverlayKeys,
  projectCompanySchoolRhfToOverlayRecord,
  rhfValuesFromCompanySchoolCanonical,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'
import {
  serializeCompanySchoolCompatibilityOverlay,
  serializeCompanySchoolRegistrationForFormVersion,
} from './serialize-registration-overlay-from-canonical'

function filledRhf(
  patch: Partial<CompanySchoolRegistrationRhfValues> = {}
): CompanySchoolRegistrationRhfValues {
  return {
    ...createDefaultCompanySchoolRegistrationRhfValues(),
    publicProgramTitle: 'RHF 공고명',
    detailedProgramId: '163006',
    detailedProgramName: 'RHF 세부',
    operationRange: { start: '2026-03-01', end: '2026-11-30' },
    sponsorId: 'sponsor-rhf',
    managerContactIds: ['contact-rhf'],
    educationCourse: 'ja',
    participantCount: 20,
    instructor: 4,
    dispatchedSchool: 3,
    dispatchedClass: 6,
    grade1Fee: 100000,
    grade1DistanceFee: 110000,
    grade2Fee: 120000,
    grade2DistanceFee: 130000,
    grade3Fee: 140000,
    grade3DistanceFee: 150000,
    paymentItemValues: ['p-new'],
    educationScheduleRange: { start: '2026-04-01', end: '2026-04-30' },
    ...patch,
  }
}

function mockRhfApi(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationRhfApi {
  let current = values
  return {
    getValues: () => current,
    getPath: () => undefined,
    setPath: () => undefined,
    reset: next => {
      current = next
    },
    applyOverlayRecord: overlay => {
      current = applyCompanySchoolRhfOverlayRecord(current, overlay)
    },
    isDirty: () => false,
    markBaseline: () => undefined,
  }
}

describe('1사1교 등록 공통정보 RHF SSOT', () => {
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetProgramRegistrationOverlayStoreForTests()
  })

  it('RHF와 stale Overlay가 달라도 UI·검증·CREATE·Form Version은 RHF를 쓴다', () => {
    const values = filledRhf({
      publicProgramTitle: 'B',
      participantCount: 20,
      paymentItemValues: ['p-new'],
    })
    patchProgramRegistrationOverlay({
      'economyRegistration.basicInfo.publicProgramTitle': 'A',
      'economyRegistration.kpi.participantCount': 50,
      'economyRegistration.wageInfo.paymentItemValues': ['p-old'],
    })
    registerCompanySchoolRegistrationRhf(mockRhfApi(values))

    expect(getProgramRegistrationOverlayRecord()['economyRegistration.basicInfo.publicProgramTitle']).toBe(
      'B'
    )
    expect(getProgramRegistrationOverlayRecord()['economyRegistration.kpi.participantCount']).toBe(20)
    expect(getProgramRegistrationOverlayRecord()['economyRegistration.wageInfo.paymentItemValues']).toEqual(
      ['p-new']
    )

    const collected = collectCompanySchoolRegistrationCommonState(values)
    expect(collected.publicProgramTitle).toBe('B')
    expect(collected.participantCount).toBe(20)
    expect(collected.paymentItemValues).toEqual(['p-new'])

    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-rhf', values })
    expect(program.generalCommonInfo?.announcementTitle).toBe('B')
    expect(program.generalCommonInfo?.kpi?.finalParticipants).toBe(20)
    expect(program.registrationOverlay?.['economyRegistration.wageInfo.paymentItemValues']).toEqual([
      'p-new',
    ])

    const formVersion = serializeCompanySchoolRegistrationForFormVersion(values)
    expect(formVersion['economyRegistration.basicInfo.publicProgramTitle']).toBe('B')
    expect(formVersion['economyRegistration.wageInfo.paymentItemValues']).toEqual(['p-new'])
  })

  it('명시적 빈 값은 이전값을 되살리지 않는다', () => {
    const values = filledRhf({
      publicProgramTitle: '',
      sponsorId: '',
      managerContactIds: [],
      generalSurveyMenuKeys: [],
      curriculumSessions: [
        { sessionLabel: '1차시', title: '', description: '' },
        { sessionLabel: '2차시', title: '', description: '' },
      ],
      paymentItemValues: [],
      participantCount: null,
    })
    const stale = applyCompanySchoolRhfOverlayRecord(
      createDefaultCompanySchoolRegistrationRhfValues(),
      {
        'economyRegistration.basicInfo.publicProgramTitle': '옛 공고',
        'economyRegistration.basicInfo.sponsorId': 'old-sponsor',
        'economyRegistration.basicInfo.managerContactIds': ['old-contact'],
        'economyRegistration.educationCurriculum.session1.title': '1단원 나를 알리는 기술',
        'economyRegistration.wageInfo.paymentItemValues': ['p-old'],
        'economyRegistration.kpi.participantCount': 50,
      }
    )
    expect(stale.publicProgramTitle).toBe('옛 공고')

    const collected = collectCompanySchoolRegistrationCommonState(values)
    expect(collected.publicProgramTitle).toBe('')
    expect(collected.sponsorId).toBe('')
    expect(collected.managerContactIds).toEqual([])
    expect(collected.generalSurveyMenuKeys).toEqual([])
    expect(collected.curriculumSessions[0]?.title).toBe('')
    expect(collected.paymentItemValues).toEqual([])
    expect(collected.participantCount).toBeNull()

    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-empty', values })
    expect(program.generalCommonInfo?.announcementTitle).toBe('')
    expect(program.sponsorId).toBe('')
    expect(program.generalCommonInfo?.sponsorManagementIds).toEqual([])
    expect(program.generalCommonInfo?.sponsorManagerContactIds).toEqual([])
    expect(program.generalSurveyMenuKeys).toEqual([])
    expect(program.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('')
    expect(program.approvedStudentCount).toBeUndefined()

    const reasons = listIncompleteCompanySchoolRegistrationRhfRequiredFields(values)
    expect(reasons).toContain('basicInfo.publicProgramTitle')
    expect(reasons).toContain('basicInfo.sponsorId')
    expect(reasons).toContain('basicInfo.managerContact')
    expect(reasons).toContain('curriculum.session1.title')
    expect(reasons).toContain('wage.paymentItemValues')
    expect(reasons).toContain('kpi.participantCount')
  })

  it('KPI 0과 null을 구분하고 0을 미입력으로 바꾸지 않는다', () => {
    const zero = collectCompanySchoolRegistrationCommonState(filledRhf({ participantCount: 0 }))
    const empty = collectCompanySchoolRegistrationCommonState(filledRhf({ participantCount: null }))
    expect(zero.participantCount).toBe(0)
    expect(empty.participantCount).toBeNull()

    const zeroProgram = buildCompanySchoolProgramFromRhf({
      id: 'cs-kpi-0',
      values: filledRhf({ participantCount: 0 }),
    })
    const emptyProgram = buildCompanySchoolProgramFromRhf({
      id: 'cs-kpi-null',
      values: filledRhf({ participantCount: null }),
    })
    expect(zeroProgram.approvedStudentCount).toBe(0)
    expect(zeroProgram.generalCommonInfo?.kpi?.finalParticipants).toBe(0)
    expect(emptyProgram.approvedStudentCount).toBeUndefined()
    expect(emptyProgram.registrationOverlay?.['economyRegistration.kpi.participantCount']).toBeNull()
  })

  it('강사비 6개 원숫자와 지급항목 ID를 보존한다', () => {
    const values = filledRhf({
      grade1Fee: 111,
      grade1DistanceFee: 222,
      grade2Fee: 333,
      grade2DistanceFee: 444,
      grade3Fee: 555,
      grade3DistanceFee: 666,
      paymentItemValues: ['p-166201', 'p-166202'],
    })
    const overlay = serializeCompanySchoolCompatibilityOverlay(
      collectCompanySchoolRegistrationCommonState(values)
    )
    expect(overlay['economyRegistration.wageInfo.grade1Fee']).toBe(111)
    expect(overlay['economyRegistration.wageInfo.grade1DistanceFee']).toBe(222)
    expect(overlay['economyRegistration.wageInfo.grade2Fee']).toBe(333)
    expect(overlay['economyRegistration.wageInfo.grade2DistanceFee']).toBe(444)
    expect(overlay['economyRegistration.wageInfo.grade3Fee']).toBe(555)
    expect(overlay['economyRegistration.wageInfo.grade3DistanceFee']).toBe(666)
    expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual([
      'p-166201',
      'p-166202',
    ])
  })

  it('설문 3/2/1/0종 CREATE → 직렬화 → 복원이 같다', () => {
    const cases = [
      ['survey', 'satisfaction', 'lecture_evaluation'],
      ['survey', 'satisfaction'],
      ['survey'],
      [],
    ] as const
    for (const keys of cases) {
      const values = filledRhf({ generalSurveyMenuKeys: [...keys] })
      const program = buildCompanySchoolProgramFromRhf({ id: `cs-survey-${keys.length}`, values })
      expect(program.generalSurveyMenuKeys).toEqual([...keys])
      const serialized = serializeCompanySchoolServiceDetailJson(program)
      const parsed = parseCompanySchoolServiceDetailJson(serialized)
      expect(parsed.generalSurveyMenuKeys).toEqual([...keys])
    }
  })

  it('CREATE serializer는 COMPANY_SCHOOL과 공통정보·모집 leftover를 유지한다', () => {
    const values = filledRhf()
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-create', values })
    expect(program.backendProgramType).toBe('COMPANY_SCHOOL')
    expect(program.generalCommonInfo?.announcementTitle).toBe('RHF 공고명')
    expect(program.detailedProgramId).toBe('163006')
    expect(program.generalCommonInfo?.sponsorManagementIds).toEqual(['sponsor-rhf'])
    expect(program.generalCommonInfo?.sponsorManagerContactIds).toEqual(['contact-rhf'])
    expect(program.generalCommonInfo?.kpi?.finalParticipants).toBe(20)
    expect(program.generalCommonInfo?.wageGradeRows).toHaveLength(3)
    expect(program.generalCommonInfo?.educationScheduleMode).toBe('period')
    expect(program.generalCommonInfo?.educationScheduleLines?.[0]).toMatch(
      /2026\.04\.01.*2026\.04\.30/
    )
    expect(program.registrationOverlay?.['economyRegistration.wageInfo.paymentItemValues']).toEqual([
      'p-new',
    ])

    const request = mapCompanySchoolToCreateRequest(program)
    expect(request.programType).toBe('COMPANY_SCHOOL')
    const overlay = JSON.parse(String(request.serviceDetailJson)).registration?.overlay
    expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual(['p-new'])
    expect(overlay['economyRegistration.wageInfo.grade1Fee']).toBe(100000)
    expect(overlay['economyRegistration.kpi.participantCount']).toBe(20)
  })

  it('serviceDetailJson 왕복에서 지급항목 ID·강사비 원숫자·KPI 0/null을 유지한다', () => {
    const values = filledRhf({
      participantCount: 0,
      instructor: null,
      paymentItemValues: ['p-keep'],
      grade1Fee: 101,
    })
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-roundtrip', values })
    const serialized = serializeCompanySchoolServiceDetailJson(program)
    const parsed = parseCompanySchoolServiceDetailJson(serialized)
    expect(parsed.registrationOverlay?.['economyRegistration.wageInfo.paymentItemValues']).toEqual([
      'p-keep',
    ])
    expect(parsed.registrationOverlay?.['economyRegistration.wageInfo.grade1Fee']).toBe(101)
    expect(parsed.registrationOverlay?.['economyRegistration.kpi.participantCount']).toBe(0)
    expect(parsed.registrationOverlay?.['economyRegistration.kpi.instructor']).toBeNull()
  })

  it('Legacy overlay는 키가 있을 때만 import하고 명시적 빈 값을 덮지 않는다', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({
      overlay: {
        'economyRegistration.basicInfo.publicProgramTitle': '',
        'economyRegistration.basicInfo.sponsorId': '__all__',
        'economyRegistration.basicInfo.managerContactIds': [],
        'economyRegistration.kpi.participantCount': 0,
        'economyRegistration.educationCurriculum.session1.title': '',
      },
    })
    expect(imported.common.publicProgramTitle).toBe('')
    expect(imported.common.sponsorId).toBe('')
    expect(imported.common.managerContactIds).toEqual([])
    expect(imported.common.participantCount).toBe(0)
    expect(imported.common.curriculumSessions[0]?.title).toBe('')
    expect(imported.common.repKo).toBe('')

    const typed = rhfValuesFromCompanySchoolCanonical({
      ...collectCompanySchoolRegistrationCommonState(filledRhf()),
      publicProgramTitle: '',
    })
    expect(typed.publicProgramTitle).toBe('')
  })

  it('임시저장 overlay에서 공통정보 키를 제거하고 typed snapshot만 남긴다', () => {
    const values = filledRhf()
    const merged = {
      ...projectCompanySchoolRhfToOverlayRecord(values),
      'economyRecruit.detailInfo.title': '모집 leftover',
    }
    const omitted = omitCompanySchoolCommonInfoOverlayKeys(merged)
    expect(omitted['economyRegistration.basicInfo.publicProgramTitle']).toBeUndefined()
    expect(omitted['economyRecruit.detailInfo.title']).toBe('모집 leftover')
  })
})
