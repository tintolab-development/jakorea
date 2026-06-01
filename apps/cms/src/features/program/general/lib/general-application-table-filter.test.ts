import { describe, expect, it } from 'vitest'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import {
  filterGeneralIndividualApplications,
  filterGeneralOrganizationApplications,
} from './general-application-table-filter'

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
})
