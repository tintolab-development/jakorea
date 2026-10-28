import { describe, expect, it } from 'vitest'
import {
  countOrganizationsWithAssignedSessions,
  instructorFeePolicyAssignmentCountForApproval,
  resolveInstructorLectureAssignLayout,
  resolveOrganizationInstructorApprovalStart,
  shouldBlockInstructorApprovalWithoutAssignments,
} from './use-instructor-lecture-assign-modal'

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

describe('countOrganizationsWithAssignedSessions', () => {
  it('배정 일정이 있는 승인 신청만 센다', () => {
    const rows = [
      { confirmedListAssignmentSessions: [{}] },
      { confirmedListAssignmentSessions: [] },
      {},
    ] as unknown as Parameters<typeof countOrganizationsWithAssignedSessions>[0]
    expect(countOrganizationsWithAssignedSessions(rows)).toBe(1)
    expect(countOrganizationsWithAssignedSessions(undefined)).toBe(0)
  })
})

describe('resolveOrganizationInstructorApprovalStart', () => {
  it('배정 가능한 기관 일정이 없으면 강사비 스텝으로 건너뛴다', () => {
    expect(resolveOrganizationInstructorApprovalStart(0)).toEqual({
      step: 'fee',
      assignments: [],
      skipLectureAssign: true,
    })
  })

  it('배정 가능한 기관 일정이 있으면 배정 모달을 연다', () => {
    expect(resolveOrganizationInstructorApprovalStart(1)).toEqual({ step: 'assign' })
    expect(resolveOrganizationInstructorApprovalStart(3)).toEqual({ step: 'assign' })
  })
})

describe('shouldBlockInstructorApprovalWithoutAssignments', () => {
  it('skip이면 빈 배정을 허용한다', () => {
    expect(
      shouldBlockInstructorApprovalWithoutAssignments({
        useInstructorAssignFlow: true,
        assignmentCount: 0,
        skipLectureAssign: true,
      })
    ).toBe(false)
  })

  it('배정 플로우에서 skip이 아니면 빈 배정을 막는다', () => {
    expect(
      shouldBlockInstructorApprovalWithoutAssignments({
        useInstructorAssignFlow: true,
        assignmentCount: 0,
        skipLectureAssign: false,
      })
    ).toBe(true)
  })
})

describe('instructorFeePolicyAssignmentCountForApproval', () => {
  it('skip이면 검증용 assignmentCount를 1로 둔다', () => {
    expect(
      instructorFeePolicyAssignmentCountForApproval({
        skipLectureAssign: true,
        assignmentCount: 0,
        useInstructorAssignFlow: true,
      })
    ).toBe(1)
  })

  it('배정 플로우에서 skip이 아니면 실제 건수를 쓴다', () => {
    expect(
      instructorFeePolicyAssignmentCountForApproval({
        skipLectureAssign: false,
        assignmentCount: 2,
        useInstructorAssignFlow: true,
      })
    ).toBe(2)
  })
})
