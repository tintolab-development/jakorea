import { describe, expect, it } from 'vitest'
import {
  buildTrainedTeacherOrganizationApplicationsListQuery,
  buildTrainedTeacherParticipatingInstitutionsListQuery,
} from './organization-applications-list-query'

describe('buildTrainedTeacherOrganizationApplicationsListQuery', () => {
  it('maps organizationName/teacherName to keyword and approvalStatus to API status', () => {
    expect(
      buildTrainedTeacherOrganizationApplicationsListQuery({
        organizationName: ' 강서초 ',
        approvalStatus: 'pending',
      })
    ).toEqual({
      keyword: '강서초',
      status: 'WAITING_REVIEW',
    })

    expect(
      buildTrainedTeacherOrganizationApplicationsListQuery({
        teacherName: '김교사',
        approvalStatus: 'approved',
      })
    ).toEqual({
      keyword: '김교사',
      status: 'APPROVED',
    })
  })

  it('prefers organizationName over teacherName for keyword', () => {
    expect(
      buildTrainedTeacherOrganizationApplicationsListQuery({
        organizationName: '학교',
        teacherName: '교사',
      })
    ).toEqual({ keyword: '학교' })
  })

  it('omits empty/all filters', () => {
    expect(
      buildTrainedTeacherOrganizationApplicationsListQuery({
        organizationName: '  ',
        approvalStatus: 'all',
      })
    ).toEqual({})
  })
})

describe('buildTrainedTeacherParticipatingInstitutionsListQuery', () => {
  it('always requests APPROVED and maps schoolName to keyword', () => {
    expect(
      buildTrainedTeacherParticipatingInstitutionsListQuery({
        schoolName: '서울초',
      })
    ).toEqual({
      status: 'APPROVED',
      keyword: '서울초',
    })

    expect(buildTrainedTeacherParticipatingInstitutionsListQuery({})).toEqual({
      status: 'APPROVED',
    })
  })
})
