/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { createDefaultCompanySchoolRegistrationRhfValues } from './registration-rhf-values'

/**
 * 1사1교 등록 — 강사 탭 「공고 게시 여부」 미조작(undefined)은 화면 기본 게시.
 * 기관 탭(RHF 기본 '')은 채우지 않는다. Overlay store를 읽지 않는다.
 */
describe('1사1교 create — 모집 라디오 화면 기본값', () => {
  it('강사 탭 공고 게시 미조작 → 게시(true)로 저장, 기관 탭 빈 값은 채우지 않는다', () => {
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    values.instructorRecruit.recruitTargetDetail = '초등 교사'
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-radio-default', values })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(true)
    expect(program.registrationOverlay?.['recruit.instructor.announcementPublished']).toBe(
      'published'
    )
    expect(program.registrationOverlay?.['recruit.announcementPublished']).toBe('')
  })

  it('강사 탭에서 미게시를 고르면 유지', () => {
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    values.instructorRecruit.recruitTargetDetail = '초등 교사'
    values.instructorRecruit.announcementPublished = 'unpublished'
    const program = buildCompanySchoolProgramFromRhf({
      id: 'cs-radio-unpublished',
      values,
    })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(false)
  })
})
