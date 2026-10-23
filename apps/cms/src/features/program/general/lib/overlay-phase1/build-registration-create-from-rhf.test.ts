/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { applyEducationStructureReset } from './registration-wizard-structure'
import {
  createDefaultRegistrationWizardUiValues,
  type RegistrationWizardUiValues,
} from './registration-wizard-ui-values'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'

function filledCurriculumValues(): RegistrationWizardUiValues {
  const values = createDefaultRegistrationWizardUiValues({
    programType: 'curriculum',
    sessionRoundType: 'single',
    curriculumChartSessionCount: 2,
    participant: {
      individual: false,
      organization: true,
      teacherInstructor: false,
      volunteer: false,
    },
  })
  return {
    ...values,
    programTitleKo: '신규 프로그램',
    programTitleEn: 'New Program',
    publicProgramTitle: '공고용 신규',
    detailedProgramId: '163006',
    detailedProgramName: '세부',
    businessField: 'career_employment',
    educationCourse: 'elementary',
    ipOwned: 'yes',
    courseDeliveredBy: 'ja',
    operationRangeSeal: { start: '2026-06-01', end: '2026-08-31' },
    sponsorId: '163001',
    sponsorIds: ['163001'],
    managerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
    managerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
    kpiParticipantCount: 10,
    wageGrade1Fee: 180000,
    wageGrade2Fee: 100000,
    wageGrade3Fee: 80000,
    paymentItemValues: ['traffic'],
    ipsType: { category: 'prepare', detail: 'none' },
    scheduleLines: ['2026-06-10 10:00'],
    singleDateIso: '2026-06-10',
    curriculum: {
      ...values.curriculum,
      unitNameBySession: { 1: '단원1', 2: '단원2', 3: 'ghost' },
      unitContentBySession: { 1: '본문1', 2: '본문2', 3: 'ghost-body' },
    },
    schedule: {
      ...values.schedule,
      eventNameByDetail: { 1: 'hidden-schedule' },
    },
  }
}

describe('buildGeneralProgramCreateFromWizardRhf', () => {
  it('CREATE request까지 순수 계산하고 fetch를 호출하지 않는다', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-general-1',
      uiValues: filledCurriculumValues(),
      overlay: {
        'application.thirdParty.recipient': 'should-not-copy',
        'recruit.detailInfo.thumbObjectUrl': 'blob:http://local/preview',
      },
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.createRequest.mainTitle ?? result.program.mainTitle).toBe('신규 프로그램')
    expect(result.program.generalProgramEducationStructure).toBe('curriculum')
    const sessions = result.program.generalCommonInfo?.curriculumSessions ?? []
    expect(sessions.map(row => row.title)).toEqual(['단원1', '단원2'])
    expect(result.program.generalCommonInfo?.scheduleDetails ?? []).toEqual([])
    expect(
      Object.keys(result.persistOverlay).some(key => key.startsWith('application.'))
    ).toBe(false)
    expect(result.program.registrationOverlay).toEqual(result.persistOverlay)
    expect(JSON.stringify(result.createRequest).includes('blob:')).toBe(false)
    expect(result.persistOverlay['recruit.detailInfo.thumbObjectUrl']).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('구조 전환 후 숨겨진 커리큘럼 값은 CREATE를 오염시키지 않는다', () => {
    const switched = applyEducationStructureReset(filledCurriculumValues(), 'schedule')
    switched.schedule.eventNameByDetail = { 1: '행사1' }
    switched.extras.scheduleCurriculumDetailCount = 1
    const result = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-general-2',
      uiValues: switched,
    })
    expect(result.program.generalProgramEducationStructure).toBe('schedule')
    expect(result.program.generalCommonInfo?.curriculumSessions ?? []).toEqual([])
    const details = result.program.generalCommonInfo?.scheduleDetails ?? []
    expect(details.some(row => row.name === '행사1')).toBe(true)
    expect(details.some(row => row.name === '단원1')).toBe(false)
  })

  it('extras count 0 + 빈 maps는 curriculumSessions []', () => {
    const values = filledCurriculumValues()
    values.extras.curriculumChartSessionCount = 0
    values.curriculum.unitNameBySession = {}
    values.curriculum.unitContentBySession = {}
    const result = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-general-0',
      uiValues: values,
    })
    expect(result.program.generalCommonInfo?.curriculumSessions ?? []).toEqual([])
  })
})
