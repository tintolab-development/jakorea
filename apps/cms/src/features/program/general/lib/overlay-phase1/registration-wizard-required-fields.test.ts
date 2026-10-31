/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { GeneralProgramRegistrationRequiredFieldContext } from '@/features/program/general/lib/registration-required-fields'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'
import {
  compareWizardRequiredFieldsWithOverlayInspector,
  hasRegistrationWizardCurriculumScheduleCountMismatch,
  listIncompleteRegistrationWizardRequiredFields,
  registrationWizardCommonInfoZodSchema,
} from './registration-wizard-required-fields'

const orgCtx: GeneralProgramRegistrationRequiredFieldContext = {
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
  curriculumChartSessionCount: 1,
  scheduleCurriculumDetailCount: 1,
  scheduleCurriculumGroupCount: 1,
  scheduleCurriculumPreEducation: false,
  educationScheduleMode: 'date',
  sponsorId: '',
  sponsorContactId: '',
  programTitleKo: '',
}

describe('registration-wizard-required-fields', () => {
  it('빈 기본값은 공통정보 필수 키를 내고 Zod도 실패한다', () => {
    const values = createDefaultRegistrationWizardUiValues()
    const keys = listIncompleteRegistrationWizardRequiredFields(values, orgCtx)
    expect(keys).toEqual(
      expect.arrayContaining(['basicInfo.programTitleKo', 'basicInfo.programTitleEn'])
    )
    expect(registrationWizardCommonInfoZodSchema.safeParse(values).success).toBe(false)
  })

  it('빈 공고용 프로그램명은 기존값으로 채우지 않고 필수 오류로 남긴다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      participant: orgCtx.participant,
    })
    values.publicProgramTitle = ''
    const keys = listIncompleteRegistrationWizardRequiredFields(values, orgCtx)
    expect(keys).toContain('basicInfo.publicProgramTitle')
  })

  it('숨겨진 일정형 값은 커리큘럼 검증을 오염시키지 않는다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'curriculum',
      participant: orgCtx.participant,
    })
    values.schedule.eventNameByDetail = {}
    const keys = listIncompleteRegistrationWizardRequiredFields(values, orgCtx)
    expect(keys.some(key => key.startsWith('scheduleCurriculum.'))).toBe(false)
  })

  it('커리큘럼 복수 날짜 줄 수와 회차 수가 다르면 mismatch', () => {
    const values = createDefaultRegistrationWizardUiValues()
    values.scheduleLines = ['2026-06-10 10:00', '2026-06-11 10:00']
    expect(
      hasRegistrationWizardCurriculumScheduleCountMismatch(values, {
        ...orgCtx,
        sessionRoundType: 'multi',
        curriculumSessionCount: 1,
        educationScheduleMode: 'date',
      })
    ).toBe(true)
  })

  it('테스트 비교용 overlay inspector와 빈 폼 키가 같다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      participant: orgCtx.participant,
    })
    const compared = compareWizardRequiredFieldsWithOverlayInspector(values, {
      ...orgCtx,
      participant: orgCtx.participant,
    })
    expect(compared.rhf).toEqual(compared.overlay)
  })

  it('일정형 복수 — 여러 날+시각 진행 일정은 필수 키를 내지 않는다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'schedule',
      sessionRoundType: 'multi',
      participant: orgCtx.participant,
    })
    values.schedule.eventNameByDetail = { 1: '세부 01' }
    values.schedule.scheduleDateByDetailIso = {
      1: '2026.11.05(목) 11:00 ~ 2026.11.06(금) 18:00',
    }
    const keys = listIncompleteRegistrationWizardRequiredFields(values, {
      ...orgCtx,
      programType: 'schedule',
      sessionRoundType: 'multi',
      scheduleCurriculumDetailCount: 1,
    })
    expect(keys).not.toContain('scheduleCurriculum.scheduleDate[1]')
  })
})
