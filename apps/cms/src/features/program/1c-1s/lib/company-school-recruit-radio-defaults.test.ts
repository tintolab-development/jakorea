/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { createDefaultCompanySchoolRegistrationRhfValues } from './registration-rhf-values'

/**
 * 1사1교 등록 — 강사 탭 「공고 게시 여부」 미조작(undefined)은 화면 미선택(QA-0121, 일반 강사 단락과 같은 상수).
 * 등록은 필수 검사가 막고, create 빌더는 게시로 채우지 않는다.
 * 기관 탭(RHF 기본 '')은 채우지 않는다. Overlay store를 읽지 않는다.
 */
describe('1사1교 create — 모집 라디오 화면 기본값', () => {
  it('강사 탭 공고 게시 미조작 → 게시로 채우지 않는다(미선택 유지), 기관 탭 빈 값도 그대로', () => {
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    values.instructorRecruit.recruitTargetDetail = '초등 교사'
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-radio-default', values })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).not.toBe(true)
    expect(program.registrationOverlay?.['recruit.instructor.announcementPublished'] ?? '').toBe('')
    expect(program.registrationOverlay?.['recruit.announcementPublished']).toBe('')
  })

  it('강사 탭에서 게시를 고르면 유지', () => {
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    values.instructorRecruit.recruitTargetDetail = '초등 교사'
    values.instructorRecruit.announcementPublished = 'published'
    const program = buildCompanySchoolProgramFromRhf({
      id: 'cs-radio-published',
      values,
    })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(true)
  })
})
