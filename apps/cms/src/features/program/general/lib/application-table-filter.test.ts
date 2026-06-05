import { describe, expect, it } from 'vitest'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import {
  filterGeneralIndividualApplications,
  filterGeneralInstructorApplications,
  filterGeneralInstructorCalendarApplications,
  filterGeneralOrganizationApplications,
} from './application-table-filter'

function schoolRow(overrides: Partial<ApplicantSchoolRow>): ApplicantSchoolRow {
  return {
    id: 's1',
    no: 1,
    schoolName: '강서초등학교',
    region: '서울특별시 강서구 화곡동',
    educationGrade: '5학년',
    classCount: 6,
    studentCount: 176,
    teacherName: '홍길동',
    approvalStatus: 'pending',
    ...overrides,
  }
}

function individualRow(
  overrides: Partial<GeneralIndividualApplicantRow>
): GeneralIndividualApplicantRow {
  return {
    id: 'i1',
    no: 1,
    applicantName: '고종욱',
    affiliation: '강서초등학교',
    educationGrade: '5학년',
    homeAddress: '서울특별시 강서구',
    approvalStatus: 'pending',
    ...overrides,
  }
}

describe('general application table filters', () => {
  it('기관 신청 목록 — 기관명·시도 필터', () => {
    const rows = [
      schoolRow({ id: 'a', schoolName: '강서초등학교', region: '서울특별시 강서구' }),
      schoolRow({ id: 'b', schoolName: '마포초등학교', region: '서울특별시 마포구' }),
    ]
    const filtered = filterGeneralOrganizationApplications(rows, {
      organizationName: '강서',
      institutionSido: '서울특별시',
      institutionSigungu: '강서구',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('a')
  })

  it('개인 신청 목록 — 신청자명·소속 필터', () => {
    const rows = [
      individualRow({ id: 'a', applicantName: '고종욱', affiliation: '강서초등학교' }),
      individualRow({ id: 'b', applicantName: '김규성', affiliation: '마포초등학교' }),
    ]
    const filtered = filterGeneralIndividualApplications(rows, {
      applicantName: '고종',
      affiliation: '강서',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.applicantName).toBe('고종욱')
  })

  it('강사 신청 목록 — 강사명·경력·등급·승인 필터', () => {
    const rows: ApplicantInstructorRow[] = [
      {
        id: 'a',
        no: 1,
        instructorName: '김서연',
        lectureExperienceYears: 3,
        educationLevel: '대학교',
        educationSchoolName: '서울대',
        contact: '010-0000-0000',
        email: 'a@example.com',
        address: '서울특별시 강서구 화곡동',
        approvalStatus: 'pending',
        schoolName: '강서초',
        evaluationGrade: 'A',
      },
      {
        id: 'b',
        no: 2,
        instructorName: '이준혁',
        lectureExperienceYears: 6,
        educationLevel: '대학교',
        educationSchoolName: '연세대',
        contact: '010-1111-1111',
        email: 'b@example.com',
        address: '경기도 수원시',
        approvalStatus: 'approved',
        schoolName: '마포초',
        evaluationGrade: 'B',
      },
    ]
    const filtered = filterGeneralInstructorApplications(rows, {
      instructorName: '김',
      experienceYears: '3',
      evaluationGrade: 'A',
      approvalStatus: 'pending',
      homeSido: '서울특별시',
      homeSigungu: '강서구',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.instructorName).toBe('김서연')
  })

  it('강사 신청 목록 — 6년 이상 경력 필터', () => {
    const rows: ApplicantInstructorRow[] = [
      {
        id: 'a',
        no: 1,
        instructorName: 'A',
        lectureExperienceYears: 5,
        educationLevel: '',
        educationSchoolName: '',
        contact: '',
        email: '',
        address: '',
        approvalStatus: 'pending',
        schoolName: '',
      },
      {
        id: 'b',
        no: 2,
        instructorName: 'B',
        lectureExperienceYears: 7,
        educationLevel: '',
        educationSchoolName: '',
        contact: '',
        email: '',
        address: '',
        approvalStatus: 'pending',
        schoolName: '',
      },
    ]
    const filtered = filterGeneralInstructorApplications(rows, { experienceYears: '6+' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.instructorName).toBe('B')
  })

  it('강사 캘린더 — 기관명·학년·강사명 필터', () => {
    const rows: ApplicantInstructorRow[] = [
      {
        id: 'a',
        no: 1,
        instructorName: '김서연',
        lectureExperienceYears: 3,
        educationLevel: '대학교',
        educationSchoolName: '서울대',
        contact: '010-0000-0000',
        email: 'a@example.com',
        address: '서울특별시 강서구',
        approvalStatus: 'pending',
        schoolName: '강서초등학교',
        preferredSchools: [
          {
            schoolId: 's1',
            schoolName: '강서초등학교',
            rank: 1,
            assignable: true,
            grade: '5학년',
          },
        ],
      },
      {
        id: 'b',
        no: 2,
        instructorName: '이준혁',
        lectureExperienceYears: 5,
        educationLevel: '대학교',
        educationSchoolName: '연세대',
        contact: '010-1111-1111',
        email: 'b@example.com',
        address: '경기도 수원시',
        approvalStatus: 'approved',
        schoolName: '마포초등학교',
        preferredSchools: [
          {
            schoolId: 's2',
            schoolName: '마포초등학교',
            rank: 1,
            assignable: true,
            grade: '3학년',
          },
        ],
      },
    ]
    const filtered = filterGeneralInstructorCalendarApplications(rows, {
      organizationName: '강서',
      grade: '5학년',
      instructorName: '김',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.schoolName).toBe('강서초등학교')
  })
})
