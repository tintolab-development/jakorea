/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyDevProgramRegistrationAutofill } from './apply-dev-program-registration-autofill'
import {
  hasIncompleteGeneralProgramRecruitmentRequiredFields,
  type GeneralProgramRecruitmentRequiredFieldContext,
} from '@/features/program/general/lib/registration-recruitment-required-fields'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetGeneralRecruitOverlayStoreForTests } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetApplicantRecruitInstitutionOverlayStoreForTests } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { clearRegistrationWizardSessionDrafts } from '@/features/program/general/lib/registration-wizard-session-drafts'

vi.mock('@/features/sponsor/api/admin-sponsors-service', () => ({
  shouldUseSponsorsRemoteApi: () => false,
  getSponsorOptionsList: vi.fn(),
  getSponsorContacts: vi.fn(),
}))

vi.mock('@/features/detailed-program/api/admin-detailed-programs-service', () => ({
  getDetailedProgramOptionsList: vi.fn(async () => [
    { id: '163001', name: '테스트 세부 프로그램' },
  ]),
}))

vi.mock('@/features/template/lib/template-registration-payment-item-options', () => ({
  ensurePaymentItemCatalog: vi.fn(async () => undefined),
  getActivePaymentItemCatalogOptions: vi.fn(() => [
    { value: 'instructor_fee', label: '강사비' },
  ]),
}))

afterEach(() => {
  resetProgramRegistrationOverlay()
  resetApplicantRecruitInstitutionOverlayStoreForTests()
  resetGeneralRecruitOverlayStoreForTests()
  clearRegistrationWizardSessionDrafts()
})

describe('applyDevProgramRegistrationAutofill — staff participant merge', () => {
  it('케이스1 + 에디터 강사 체크 시 강사 모집 overlay를 채우고 필수 검사를 통과한다', async () => {
    const patch = await applyDevProgramRegistrationAutofill(
      'general',
      {
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 1,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
        participantOrganization: true,
        programType: 'curriculum',
        sessionRoundType: 'single',
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: true,
          volunteer: false,
        },
      },
      { caseId: 1 }
    )

    expect(patch.participantFlags?.teacherInstructor).toBe(true)
    expect(patch.participantFlags?.volunteer).toBe(false)
    expect(patch.participantFlags?.organization).toBe(true)

    const volunteerOverlay = peekGeneralRecruitOverlayRecord('recruitment-volunteer')
    expect(volunteerOverlay['recruit.volunteer.announcementPublished']).toBeUndefined()

    const instructorOverlay = peekGeneralRecruitOverlayRecord('recruitment-instructor')
    expect(instructorOverlay['recruit.instructor.announcementPublished']).toBe('published')

    const recruitmentCtx: GeneralProgramRecruitmentRequiredFieldContext = {
      participant: patch.participantFlags!,
      programType: patch.typeSettings!.programType,
      sessionRoundType: patch.typeSettings!.sessionRoundType,
      educationScheduleMode: patch.typeSettings!.educationScheduleMode,
      volunteerExceptionScheduleCount: 0,
    }
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(recruitmentCtx)).toBe(false)
  })
})
