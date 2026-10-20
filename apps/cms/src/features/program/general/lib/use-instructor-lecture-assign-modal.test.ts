import { describe, expect, it } from 'vitest'
import { resolveInstructorLectureAssignLayout } from './use-instructor-lecture-assign-modal'

describe('resolveInstructorLectureAssignLayout', () => {
  it('기관 배정은 강사 상세가 성공해도 캘린더 레이아웃을 유지한다', () => {
    expect(
      resolveInstructorLectureAssignLayout({
        isIndividual: false,
        organizationRemoteEnabled: true,
        organizationApplicationsSuccess: true,
        approvedOrganizationCount: 2,
        instructorDetailReady: true,
      })
    ).toEqual({
      showNoApprovedOrganizationBanner: false,
      useSlotListLayout: false,
    })
  })

  it('승인 기관이 없고 강사 가능 일정이 있을 때만 슬롯 목록으로 대체한다', () => {
    expect(
      resolveInstructorLectureAssignLayout({
        isIndividual: false,
        organizationRemoteEnabled: true,
        organizationApplicationsSuccess: true,
        approvedOrganizationCount: 0,
        instructorDetailReady: true,
      })
    ).toEqual({
      showNoApprovedOrganizationBanner: true,
      useSlotListLayout: true,
    })
  })

  it('개인 배정은 슬롯 목록 레이아웃을 사용한다', () => {
    expect(
      resolveInstructorLectureAssignLayout({
        isIndividual: true,
        organizationRemoteEnabled: true,
        organizationApplicationsSuccess: false,
        approvedOrganizationCount: 0,
        instructorDetailReady: true,
      })
    ).toEqual({
      showNoApprovedOrganizationBanner: false,
      useSlotListLayout: true,
    })
  })
})
