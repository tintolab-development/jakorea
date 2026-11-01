/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import {
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetApplicantRecruitInstitutionOverlayStoreForTests } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { createDefaultCompanySchoolRegistrationRhfValues } from './registration-rhf-values'

/**
 * 1사1교 등록 — 강사 탭(일반 강사 모집 단락) 「공고 게시 여부」 기본 게시를 건드리지 않으면
 * overlay 키가 비어 저장에서 빠지던 문제. 기관 탭(1사1교 RHF, 기본 '')은 그대로 둔다.
 */
describe('1사1교 create — 모집 라디오 화면 기본값', () => {
  afterEach(() => {
    resetGeneralRecruitOverlayStoreForTests()
    resetApplicantRecruitInstitutionOverlayStoreForTests()
  })

  it('강사 탭 공고 게시 미조작 → 게시(true)로 저장, 기관 탭 빈 값은 채우지 않는다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', { 'recruit.instructor.recruitTargetDetail': '초등 교사' })
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-radio-default', values })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(true)
    expect(program.registrationOverlay?.['recruit.instructor.announcementPublished']).toBe(
      'published'
    )
    expect(program.registrationOverlay?.['recruit.announcementPublished']).toBe('')
  })

  it('강사 탭에서 미게시를 고르면 유지', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      'recruit.instructor.recruitTargetDetail': '초등 교사',
      'recruit.instructor.announcementPublished': 'unpublished',
    })
    const program = buildCompanySchoolProgramFromRhf({
      id: 'cs-radio-unpublished',
      values: createDefaultCompanySchoolRegistrationRhfValues(),
    })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(false)
  })
})
