/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { ProgramRegistrationEditorState } from '@/features/template/lib/program-registration-editor-state'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import {
  hydrateRegistrationWizardUiValues,
  parseRegistrationWizardRhfSettings,
} from './registration-wizard-legacy-hydrate'
import { REGISTRATION_WIZARD_RHF_SETTINGS_KEY } from './registration-wizard-ui-values'

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
})
