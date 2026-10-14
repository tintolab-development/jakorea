import { afterEach, describe, expect, it } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import {
  getInstitutionApplicationProgramBridge,
  getInstitutionApplicationFormHiddenParagraphIds,
  resetInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  subscribeInstitutionApplicationBridgeForRegistrationWizard,
  syncInstitutionApplicationBridgeForRegistrationWizard,
} from '@/features/program/general/lib/registration-institution-bridge-sync'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  replaceApplicantRecruitInstitutionOverlayForScope,
  resetApplicantRecruitInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
  getProgramRegistrationOverlayRecord,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { previewGeneralRegistrationDevAutofillForCase } from '@/features/program/shared/lib/apply-dev-program-registration-autofill'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { resetGeneralRecruitOverlayStoreForTests } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { clearRegistrationWizardSessionDrafts } from '@/features/program/general/lib/registration-wizard-session-drafts'

afterEach(() => {
  resetInstitutionApplicationProgramBridge()
  resetProgramRegistrationOverlay()
  resetApplicantRecruitInstitutionOverlayStoreForTests()
  resetGeneralRecruitOverlayStoreForTests()
  clearRegistrationWizardSessionDrafts()
})

describe('syncInstitutionApplicationBridgeForRegistrationWizard', () => {
  it('subscribe 진입 시 기존 schedule lines를 즉시 브리지에 반영한다', () => {
    replaceProgramRegistrationOverlay({
      [GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]: ['26년 4월 20일(월) 9:30 ~ 12:20'],
    })

    const unsub = subscribeInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'general',
      programType: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      recruitTemplateCode: 'recruitment-participant-school',
    })

    expect(getInstitutionApplicationProgramBridge().educationScheduleLines).toEqual([
      '26년 4월 20일(월) 9:30 ~ 12:20',
    ])
    unsub()
  })

  it('일반 — registration overlay schedule lines를 브리지에 반영한다', () => {
    replaceProgramRegistrationOverlay({
      [GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
    })

    syncInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'general',
      programType: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      recruitTemplateCode: 'recruitment-participant-school',
    })

    const bridge = getInstitutionApplicationProgramBridge()
    expect(bridge.educationScheduleLines).toHaveLength(2)
    expect(
      getInstitutionApplicationFormHiddenParagraphIds(bridge)?.has(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
      )
    ).toBeFalsy()
  })

  it('일반 — 모집 preguidance none이면 안내 사항 단락을 숨긴다', () => {
    replaceApplicantRecruitInstitutionOverlayForScope('recruitment-participant-school', {
      [APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired]: 'none',
    })

    syncInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'general',
      programType: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      recruitTemplateCode: 'recruitment-participant-school',
    })

    const hidden = getInstitutionApplicationFormHiddenParagraphIds(
      getInstitutionApplicationProgramBridge()
    )
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance)).toBe(true)
  })

  it('교육받은교사 — preEducationNoticeRequired를 false로 고정한다', () => {
    syncInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'trainedTeachers',
      programType: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      recruitTemplateCode: 'recruitment-trained-teachers',
    })
    expect(getInstitutionApplicationProgramBridge().preEducationNoticeRequired).toBe(false)
  })

  it('1사1교 — economy dateRangeSeal을 educationScheduleRange로 반영한다', () => {
    replaceProgramRegistrationOverlay({
      'economyRegistration.educationScheduleSettings.dateRangeSeal': {
        start: '2026-04-01T00:00:00.000Z',
        end: '2026-06-30T00:00:00.000Z',
      },
    })

    syncInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'economy',
      programType: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'period',
      recruitTemplateCode: 'recruitment-economy',
    })

    expect(getInstitutionApplicationProgramBridge().educationScheduleRange).toBeDefined()
    expect(getInstitutionApplicationProgramBridge().educationStructure).toBe('curriculum')
  })

  it('DEV 케이스3 — 커리큘럼 복수 기간 지정 overlay를 period 브리지로 반영한다', () => {
    previewGeneralRegistrationDevAutofillForCase(3, {
      sponsorId: 'sponsor-dev-1',
      contactId: 'contact-1',
      detailedProgramId: '163001',
      detailedProgramName: '테스트',
      paymentItemValues: ['instructor_fee'],
      paymentItemLabels: '강사비',
    })

    syncInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'general',
      programType: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'period',
      recruitTemplateCode: 'recruitment-participant-school',
    })

    const bridge = getInstitutionApplicationProgramBridge()
    expect(bridge.educationScheduleMode).toBe('period')
    expect(bridge.educationScheduleRange).toBeDefined()
    expect(getProgramRegistrationOverlayRecord()[GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]).toBeTruthy()
  })

  it('DEV 케이스5 — 일정형 복수는 진행 희망 일정 단락을 숨긴다', () => {
    previewGeneralRegistrationDevAutofillForCase(5, {
      sponsorId: 'sponsor-dev-1',
      contactId: 'contact-1',
      detailedProgramId: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
      detailedProgramName: '해당없음',
      paymentItemValues: ['instructor_fee'],
      paymentItemLabels: '강사비',
    })

    syncInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'general',
      programType: 'schedule',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      recruitTemplateCode: 'recruitment-participant-school',
    })

    const hidden = getInstitutionApplicationFormHiddenParagraphIds(
      getInstitutionApplicationProgramBridge()
    )
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)).toBe(true)
  })
})
