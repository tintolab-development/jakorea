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

  it('사전교육이 켜진 복수 회차는 사전교육 칸을 포함해 예정일 수와 맞춘다', () => {
    const values = createDefaultRegistrationWizardUiValues()
    values.scheduleLines = ['2026-06-10 10:00', '2026-06-11 10:00', '2026-06-12 10:00']
    const ctx = {
      ...orgCtx,
      sessionRoundType: 'multi' as const,
      curriculumSessionCount: 2,
      educationScheduleMode: 'date' as const,
      scheduleCurriculumPreEducation: true,
    }
    expect(hasRegistrationWizardCurriculumScheduleCountMismatch(values, ctx)).toBe(false)
    values.scheduleLines = ['2026-06-10 10:00', '2026-06-11 10:00']
    expect(hasRegistrationWizardCurriculumScheduleCountMismatch(values, ctx)).toBe(true)
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
})
