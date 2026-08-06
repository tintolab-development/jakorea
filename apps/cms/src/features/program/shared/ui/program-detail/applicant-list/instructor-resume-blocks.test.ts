import { describe, expect, it } from 'vitest'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  getEducationSchoolTypeLabel,
  instructorAwardsSectionDescription,
  instructorCareerSectionDescription,
  instructorEducationSectionDescription,
  instructorQualificationsSectionDescription,
  resolveFinalEducationDisplay,
} from './instructor-resume-blocks'

function baseRow(
  partial: Partial<ApplicantInstructorRow> = {}
): ApplicantInstructorRow {
  return {
    id: '1',
    no: 1,
    instructorName: '테스트',
    lectureExperienceYears: 3,
    educationLevel: '',
    educationSchoolName: '',
    contact: '',
    email: '',
    address: '',
    approvalStatus: 'approved',
    schoolName: '-',
    nameEnglish: '-',
    birthDate: '-',
    gender: '-',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    evaluationGrade: 'A',
    teachingExperience: '3년',
    oneLineIntro: '-',
    businessIncomeEarnerStatus: '해당 없음',
    lectureFeeBasisDisplay: '-',
    freeWriting1: '',
    freeWriting2: '',
    freeWriting3: '',
    freeWriting4: '',
    careerDetails: [],
    qualifications: [],
    awards: [],
    ...partial,
  }
}

describe('instructor resume education display', () => {
  it('헤더 요약 — 학교 구분만 노출하고 졸업·재학 상태는 제외한다', () => {
    expect(
      instructorEducationSectionDescription(
        baseRow({
          educationLevel: '대학교 4년제 / 졸업',
          educationSchoolName: '한국대학교',
        })
      )
    ).toBe('대학교 4년제')

    expect(getEducationSchoolTypeLabel('college4 / graduated')).toBe('대학교 4년제')
    expect(getEducationSchoolTypeLabel('college4 / enrolled')).toBe('대학교 4년제')
  })

  it('본문 — 최종 학교 1건만 노출하고 상태는 표시하지 않는다', () => {
    expect(
      resolveFinalEducationDisplay(
        baseRow({
          educationLevel: '대학교 4년제 / 졸업',
          educationSchoolName: '한국대학교',
          educations: [
            { schoolType: 'high', schoolName: '서울고등학교', enrollmentYear: '2010', graduationYear: '2013' },
            {
              schoolType: 'college4',
              schoolName: '한국대학교',
              major: '경제학',
              enrollmentYear: '2014',
              graduationYear: '2018',
            },
          ],
        })
      )
    ).toEqual({
      period: '2014 ~ 2018',
      schoolName: '한국대학교',
      major: '경제학',
    })
  })

  it('구조화 rows 없을 때 educationSchoolName만 본문에 노출한다', () => {
    expect(
      resolveFinalEducationDisplay(
        baseRow({
          educationLevel: '대학교 4년제 / 재학',
          educationSchoolName: '연세대학교',
        })
      )
    ).toEqual({ schoolName: '연세대학교' })
  })

  it('데이터 없을 때 타이틀 요약은 빈 문자열을 반환한다', () => {
    expect(instructorEducationSectionDescription(baseRow())).toBe('')
    expect(instructorCareerSectionDescription(baseRow())).toBe('')
    expect(instructorQualificationsSectionDescription(baseRow())).toBe('')
    expect(instructorAwardsSectionDescription(baseRow())).toBe('')
  })
})
