import { describe, expect, it, beforeEach } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { resolveGeneralApplicationFormHiddenParagraphIds } from './application-form-preview-options'
import { getInstitutionApplicationFormHiddenParagraphIds } from './institution-application-program-bridge'
import {
  patchInstitutionSexOffenseConsentInquiryMethod,
  patchInstitutionSexOffenseConsentSiteSubmission,
  patchInstitutionSexOffenseConsentSubmissionRequest,
  resetInstitutionApplicationFormVisibility,
  shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph,
} from './institution-application-form-visibility'

describe('institution-application-form-visibility', () => {
  beforeEach(() => {
    resetInstitutionApplicationFormVisibility()
  })

  it('기본값은 동의서 제출 요청이며 조회 방식 단락을 노출한다', () => {
    expect(shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()).toBe(true)
  })

  it('동의서 미제출 선택 시 조회 방식 단락을 숨긴다', () => {
    patchInstitutionSexOffenseConsentSubmissionRequest('no_submit')
    expect(shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()).toBe(false)

    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      preEducationNoticeRequired: true,
      educationScheduleMode: 'date',
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod)).toBe(
      true
    )
  })

  it('강사 신청 성범죄경력 조회 동의서 제출 방법 안내 단락은 기관 선택과 무관하게 항상 노출한다', () => {
    patchInstitutionSexOffenseConsentSubmissionRequest('no_submit')
    patchInstitutionSexOffenseConsentInquiryMethod('ja_system')
    patchInstitutionSexOffenseConsentSiteSubmission('direct')
    expect(
      resolveGeneralApplicationFormHiddenParagraphIds('instructor', { paragraphs: [] })
    ).toBeUndefined()
  })
})
