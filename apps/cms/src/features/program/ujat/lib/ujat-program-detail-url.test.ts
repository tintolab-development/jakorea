import { describe, expect, it } from 'vitest'
import {
  buildUjatProgramDetailUrl,
  buildUjatVolunteerApplicantDetailUrl,
  isUjatEducationProgressInstitutionDetailTab,
  isUjatEducationProgressVolunteerDetailTab,
  isUjatVolunteerApplicantDetailTab,
  parseUjatEduInstTab,
  parseUjatEduVolTab,
  parseUjatVolAddMemberIdParam,
  resolveUjatDetailLnbFromSearchParams,
} from './ujat-program-detail-url'

describe('UJAT 프로그램 상세 URL 계약', () => {
  it('상·하반기 교육 진행 탭을 동일한 규칙으로 생성한다', () => {
    expect(buildUjatProgramDetailUrl('186101', 'education_progress', 'edu_h1_attendance')).toBe(
      '/programs/ujat?programId=186101&lnb=education_progress&tab=edu_h1_attendance'
    )
    expect(buildUjatProgramDetailUrl('186101', 'education_progress', 'edu_h2_attendance')).toBe(
      '/programs/ujat?programId=186101&lnb=education_progress&tab=edu_h2_attendance'
    )
  })

  it('봉사자 지원자 상세 URL이 반기와 지원자 식별자를 함께 유지한다', () => {
    const url = buildUjatVolunteerApplicantDetailUrl(
      '186101',
      'volunteer_h2',
      'vh2_interview2',
      '1691498'
    )
    const params = new URL(url, 'http://localhost').searchParams

    expect(params.get('programId')).toBe('186101')
    expect(params.get('lnb')).toBe('volunteer_h2')
    expect(params.get('tab')).toBe('vh2_interview2')
    expect(params.get('applicantId')).toBe('1691498')
  })

  it('레거시 봉사자 URL은 탭 prefix 기준으로 반기를 복원한다', () => {
    expect(
      resolveUjatDetailLnbFromSearchParams(
        new URLSearchParams('lnb=volunteer_applications&tab=vh1_doc1')
      )
    ).toBe('volunteer_h1')
    expect(
      resolveUjatDetailLnbFromSearchParams(
        new URLSearchParams('lnb=volunteer_applications&tab=vh2_doc1')
      )
    ).toBe('volunteer_h2')
  })

  it('기관·봉사자 상세 하위 탭은 허용 목록 밖의 값을 기본 탭으로 정규화한다', () => {
    expect(isUjatEducationProgressInstitutionDetailTab('application')).toBe(true)
    expect(isUjatEducationProgressInstitutionDetailTab('unknown')).toBe(false)
    expect(isUjatEducationProgressVolunteerDetailTab('assignment_progress')).toBe(true)
    expect(isUjatEducationProgressVolunteerDetailTab('settlement')).toBe(true)
    expect(isUjatEducationProgressVolunteerDetailTab('unknown')).toBe(false)
    expect(isUjatVolunteerApplicantDetailTab('vh2_interview2')).toBe(true)
    expect(isUjatVolunteerApplicantDetailTab('interview2')).toBe(false)

    expect(parseUjatEduInstTab(new URLSearchParams('eduInstTab=unknown'))).toBe('application')
    expect(parseUjatEduVolTab(new URLSearchParams('eduVolTab=unknown'))).toBe('application')
  })

  it('volAddMemberId는 양의 정수만 허용한다', () => {
    expect(parseUjatVolAddMemberIdParam('190094')).toBe('190094')
    expect(parseUjatVolAddMemberIdParam('550e8400-e29b-41d4-a716-446655440000')).toBeNull()
    expect(parseUjatVolAddMemberIdParam('0')).toBeNull()
    expect(parseUjatVolAddMemberIdParam('-1')).toBeNull()
    expect(parseUjatVolAddMemberIdParam(null)).toBeNull()
  })
})
