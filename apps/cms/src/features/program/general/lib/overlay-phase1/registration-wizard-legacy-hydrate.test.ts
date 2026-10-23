/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { ProgramRegistrationEditorState } from '@/features/template/lib/program-registration-editor-state'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import {
  hydrateRegistrationWizardUiValues,
  parseRegistrationWizardRhfSettings,
} from './registration-wizard-legacy-hydrate'
import { projectRegistrationWizardUiValuesToOverlay } from './registration-wizard-overlay-path-map'
import {
  createDefaultRegistrationWizardUiValues,
  REGISTRATION_WIZARD_RHF_SETTINGS_KEY,
} from './registration-wizard-ui-values'

describe('registration-wizard-legacy-hydrate', () => {
  it('settingsJson RHF가 있으면 overlay보다 우선한다', () => {
    const settings = parseRegistrationWizardRhfSettings({
      [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
        programTitleKo: 'RHF 제목',
        extras: {
          programType: 'schedule',
          participant: { organization: true },
        },
      },
    })
    expect(settings?.programTitleKo).toBe('RHF 제목')
    expect(settings?.extras.programType).toBe('schedule')
    expect(settings?.extras.participant.organization).toBe(true)

    const hydrated = hydrateRegistrationWizardUiValues({
      overlay: { [K.programTitleKo]: 'overlay 제목' },
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
          programTitleKo: 'RHF 제목',
          extras: { programType: 'curriculum' },
        },
      },
    })
    expect(hydrated.programTitleKo).toBe('RHF 제목')
  })

  it('구버전 overlay+editorState는 최초 hydrate 1회용으로만 복원한다', () => {
    const editorState: ProgramRegistrationEditorState = {
      participant: {
        individual: false,
        organization: true,
        teacherInstructor: false,
        volunteer: false,
      },
      programType: 'curriculum',
      sessionRoundType: 'single',
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      curriculumSessionCount: 1,
      curriculumChartSessionCount: 2,
      scheduleCurriculumDetailCount: 1,
      scheduleCurriculumGroupCount: 1,
      scheduleCurriculumPreEducation: false,
      trainedTeachersTeacherTrainingEnabled: false,
      educationScheduleMode: 'date',
      programTitleKo: '에디터 제목',
    }
    const hydrated = hydrateRegistrationWizardUiValues({
      overlay: {
        [K.programTitleKo]: '레거시 제목',
        [K.programTitleEn]: 'Legacy',
        [K.unitNameBySession]: { 1: '단원1' },
      },
      editorState: {
        ...editorState,
        programTitleKo: '에디터 제목',
        programType: 'curriculum',
        curriculumChartSessionCount: 2,
      },
    })
    expect(hydrated.programTitleKo).toBe('에디터 제목')
    expect(hydrated.programTitleEn).toBe('Legacy')
    expect(hydrated.curriculum.unitNameBySession).toEqual({ 1: '단원1' })
    expect(hydrated.extras.curriculumChartSessionCount).toBe(2)
    expect(hydrated.recruitmentKv['recruit.inquiryTel']).toBeUndefined()
  })

  it('settingsJson 모집 kv가 있으면 overlay 모집을 덮지 않는다', () => {
    const hydrated = hydrateRegistrationWizardUiValues({
      overlay: { 'recruit.inquiryTel': 'overlay-tel' },
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
          extras: { programType: 'curriculum' },
          recruitmentKv: { 'recruit.inquiryTel': 'rhf-tel' },
        },
      },
    })
    expect(hydrated.recruitmentKv['recruit.inquiryTel']).toBe('rhf-tel')
  })

  it('settingsJson 신청 kv가 있으면 overlay 신청을 덮지 않는다', () => {
    const hydrated = hydrateRegistrationWizardUiValues({
      overlay: { 'application.institution.teacherTel': 'overlay-tel' },
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
          extras: {
            programType: 'curriculum',
            participant: { organization: true },
          },
          applicationKv: { 'application.institution.teacherTel': 'rhf-tel' },
        },
      },
    })
    expect(hydrated.applicationKv['application.institution.teacherTel']).toBe('rhf-tel')
  })

  it('settingsJson에 신청이 없으면 overlay 신청을 복원한다', () => {
    const hydrated = hydrateRegistrationWizardUiValues({
      overlay: {
        'application.individual.teamInfo.teamName': '팀A',
        'application.institution.fixedScheduleSelected': ['legacy-slot'],
      },
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
          extras: {
            programType: 'curriculum',
            participant: { individual: true, organization: false },
          },
        },
      },
    })
    expect(hydrated.applicationKv['application.individual.teamInfo.teamName']).toBe('팀A')
    expect(hydrated.applicationKv['application.individual.fixedScheduleSelected']).toEqual([
      'legacy-slot',
    ])
    expect(hydrated.applicationKv['application.institution.fixedScheduleSelected']).toBeUndefined()
  })

  it('settingsJson에 모집이 없으면 overlay 모집을 복원한다', () => {
    const hydrated = hydrateRegistrationWizardUiValues({
      overlay: {
        'recruit.inquiryTel': 'legacy-tel',
        'recruit.detailInfo.programDescription': '<p>복원</p>',
      },
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
          extras: { programType: 'curriculum' },
        },
      },
    })
    expect(hydrated.recruitmentKv['recruit.inquiryTel']).toBe('legacy-tel')
    expect(hydrated.recruitment.institution?.inquiryTel).toBe('legacy-tel')
  })

  it('공통정보 전 필드가 settingsJson RHF로 persist·복원된다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      programType: 'schedule',
      sessionRoundType: 'multi',
      educationScheduleMode: 'period',
      educationFormScheduleDetail: 'perSchedule',
      participationScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'perSchedule',
      curriculumSessionCount: 2,
      curriculumChartSessionCount: 3,
      scheduleCurriculumDetailCount: 2,
      scheduleCurriculumGroupCount: 2,
      scheduleCurriculumPreEducation: true,
      participant: {
        individual: true,
        organization: false,
        teacherInstructor: true,
        volunteer: true,
      },
    })
    ui.programTitleKo = '국문 대표명'
    ui.programTitleEn = 'English title'
    ui.publicProgramTitle = '공고용 프로그램명'
    ui.detailedProgramId = '없음'
    ui.detailedProgramName = '해당없음'
    ui.businessField = 'economy_finance'
    ui.partnerInvolvement = 'no'
    ui.educationVenueKind = 'outside'
    ui.educationVenueDetail = '외부 강의실'
    ui.educationCourse = 'regular'
    ui.ipOwned = 'ja'
    ui.courseDeliveredBy = 'ja'
    ui.operationRangeSeal = { start: '2026-03-01T00:00:00.000Z', end: '2026-06-30T00:00:00.000Z' }
    ui.operationAnchorIso = '2026-03-01T00:00:00.000Z'
    ui.surveyItems = { survey: true, satisfaction: true, lecture_evaluation: false }
    ui.sponsorIds = ['163001', '163002']
    ui.sponsorId = '163001'
    ui.managerContactIds = ['163001::c1']
    ui.managerContactId = '163001::c1'
    ui.sponsorManagerLine = '담당 홍길동 | 010-0000-0000'
    ui.kpiParticipantCount = 30
    ui.kpiInstructor = 2
    ui.kpiVolunteer = 4
    ui.kpiDispatchedSchool = 1
    ui.kpiDispatchedClass = 3
    ui.wageGrade1Fee = 180000
    ui.wageGrade2Fee = 150000
    ui.wageGrade3Fee = 120000
    ui.paymentItemValues = ['traffic', 'meal']
    ui.paymentItemLabels = '교통비, 식비'
    ui.singleEducationForm = 'offline'
    ui.multiCommonEducationForm = 'blended'
    ui.singleParticipation = 'team'
    ui.multiCommonParticipation = 'team'
    ui.ipsType = { category: 'prepare', detail: 'slide' }
    ui.scheduleLines = ['2026-03-01 10:00~11:00']
    ui.singleDateIso = '2026-03-01T00:00:00.000Z'
    ui.periodDateIso = '2026-03-01T00:00:00.000Z/2026-03-02T00:00:00.000Z'
    ui.footerIpsType = { category: 'prepare', detail: 'none' }
    ui.curriculum.unitNameBySession = { 1: '단원1' }
    ui.curriculum.unitContentBySession = { 1: '내용1' }
    ui.curriculum.progressSessionByRound = { 1: '1' }
    ui.curriculum.roundContentByRound = { 1: '회차내용' }
    ui.curriculum.educationFormBySession = { 1: 'offline' }
    ui.curriculum.participationBySession = { 1: 'team' }
    ui.curriculum.ipsBySession = { 1: { category: 'prepare', detail: 'slide' } }
    ui.curriculum.assignmentByRound = { 1: { enabled: true, period: '1주' } }
    ui.schedule.eventNameByDetail = { 1: '행사1' }
    ui.schedule.scheduleDateByDetailIso = { 1: '2026-03-01T00:00:00.000Z' }
    ui.schedule.groupTimesByDetail = { 1: [{ startTime: '10:00', endTime: '11:00' }] }
    ui.schedule.educationFormByDetail = { 1: 'offline' }
    ui.schedule.participationByDetail = { 1: 'team' }
    ui.schedule.ipsByDetailIndex = { 1: { category: 'prepare', detail: 'slide' } }
    ui.schedule.preEducationName = '사전 교육'

    const projected = projectRegistrationWizardUiValuesToOverlay(ui)
    expect(projected[K.programTitleKo]).toBe('국문 대표명')
    expect(projected[K.publicProgramTitle]).toBe('공고용 프로그램명')
    expect(projected[K.sponsorIds]).toEqual(['163001', '163002'])
    expect(projected[K.kpiParticipantCount]).toBe(30)
    expect(projected[K.wageGrade1Fee]).toBe(180000)
    expect(projected[K.paymentItemValues]).toEqual(['traffic', 'meal'])
    expect(projected[K.multiCommonEducationForm]).toBe('blended')
    expect(projected[K.scheduleLines]).toEqual(['2026-03-01 10:00~11:00'])
    expect(projected[K.unitNameBySession]).toEqual({ 1: '단원1' })
    expect(projected[K.eventNameByDetail]).toEqual({ 1: '행사1' })

    const restored = hydrateRegistrationWizardUiValues({
      overlay: {
        [K.programTitleKo]: '',
        [K.sponsorId]: '',
        [K.unitNameBySession]: {},
        [K.eventNameByDetail]: {},
      },
      editorState: { programTitleKo: '', sponsorId: '' } as ProgramRegistrationEditorState,
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: ui,
      },
    })
    expect(restored.programTitleKo).toBe('국문 대표명')
    expect(restored.programTitleEn).toBe('English title')
    expect(restored.publicProgramTitle).toBe('공고용 프로그램명')
    expect(restored.businessField).toBe('economy_finance')
    expect(restored.educationVenueDetail).toBe('외부 강의실')
    expect(restored.operationRangeSeal).toEqual(ui.operationRangeSeal)
    expect(restored.surveyItems).toEqual(ui.surveyItems)
    expect(restored.sponsorIds).toEqual(['163001', '163002'])
    expect(restored.managerContactId).toBe('163001::c1')
    expect(restored.kpiVolunteer).toBe(4)
    expect(restored.wageGrade2Fee).toBe(150000)
    expect(restored.paymentItemValues).toEqual(['traffic', 'meal'])
    expect(restored.multiCommonEducationForm).toBe('blended')
    expect(restored.ipsType).toEqual({ category: 'prepare', detail: 'slide' })
    expect(restored.scheduleLines).toEqual(['2026-03-01 10:00~11:00'])
    expect(restored.curriculum.unitNameBySession).toEqual({ 1: '단원1' })
    expect(restored.schedule.eventNameByDetail).toEqual({ 1: '행사1' })
    expect(restored.extras.programType).toBe('schedule')
    expect(restored.extras.sessionRoundType).toBe('multi')
    expect(restored.extras.scheduleCurriculumDetailCount).toBe(2)
    expect(restored.extras.participant.volunteer).toBe(true)
  })

  it('overlay store가 비어도 RHF 국문 대표명을 persist·복원한다', () => {
    const ui = createDefaultRegistrationWizardUiValues()
    ui.programTitleKo = '임시저장 국문 대표명'
    const projected = projectRegistrationWizardUiValuesToOverlay(ui)
    expect(projected[K.programTitleKo]).toBe('임시저장 국문 대표명')

    const restored = hydrateRegistrationWizardUiValues({
      overlay: { [K.programTitleKo]: '' },
      editorState: { programTitleKo: '' } as ProgramRegistrationEditorState,
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: ui,
      },
    })
    expect(restored.programTitleKo).toBe('임시저장 국문 대표명')
  })
})
