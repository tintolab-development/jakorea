import { describe, expect, it, beforeEach } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { getInstitutionApplicationFormHiddenParagraphIds } from './institution-application-program-bridge'
import {
  getInstructorApplicationFormHiddenParagraphIds,
  patchInstitutionSexOffenseConsentInquiryMethod,
  patchInstitutionSexOffenseConsentSiteSubmission,
  patchInstitutionSexOffenseConsentSubmissionRequest,
  resetInstitutionApplicationFormVisibility,
  shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph,
  shouldShowInstructorApplicationCrimeRecordParagraph,
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
    expect(shouldShowInstructorApplicationCrimeRecordParagraph()).toBe(false)

    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      preEducationNoticeRequired: true,
      educationScheduleMode: 'date',
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod)).toBe(
      true
    )

    const instructorHidden = getInstructorApplicationFormHiddenParagraphIds()
    expect(instructorHidden?.has(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord)).toBe(true)
  })

  it('동의서 제출 요청 + 사이트 온라인 제출 선택 시 강사 성범죄 경력 조회서 단락을 노출한다', () => {
    expect(getInstructorApplicationFormHiddenParagraphIds()).toBeUndefined()
  })

  it('JA 시스템 내 확인 선택 시 강사 성범죄 경력 조회서 단락을 숨긴다', () => {
    patchInstitutionSexOffenseConsentInquiryMethod('ja_system')
    expect(shouldShowInstructorApplicationCrimeRecordParagraph()).toBe(false)
    const instructorHidden = getInstructorApplicationFormHiddenParagraphIds()
    expect(instructorHidden?.has(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord)).toBe(true)
  })

  it('직접 제출 선택 시 강사 성범죄 경력 조회서 단락을 숨긴다', () => {
    patchInstitutionSexOffenseConsentSiteSubmission('direct')
    expect(shouldShowInstructorApplicationCrimeRecordParagraph()).toBe(false)
    const instructorHidden = getInstructorApplicationFormHiddenParagraphIds()
    expect(instructorHidden?.has(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord)).toBe(true)
  })
})
