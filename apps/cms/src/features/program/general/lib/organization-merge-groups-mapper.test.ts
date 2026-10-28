import { describe, expect, it } from 'vitest'
import {
  assertOrganizationMergeMembers,
  buildCreateMergeRequest,
  buildMergeMemberRequestsFromPartnerRows,
  findActiveMergeGroupForOrganizationApplication,
  isActiveMergeGroup,
  isCombinedClassNonLeadMember,
  resolveCombinedClassMergeViewState,
} from './organization-merge-groups-mapper'
import type { MergeGroupResponse } from '@/shared/api/generated/dashboard/schemas/mergeGroupResponse'

const activeGroup: MergeGroupResponse = {
  id: 10,
  leadApplicationId: 100,
  status: 'ACTIVE',
  members: [
    { organizationApplicationId: 100, grade: '5학년', lead: true },
    { organizationApplicationId: 101, grade: '6학년', lead: false },
  ],
}

describe('organization-merge-groups-mapper', () => {
  it('isActiveMergeGroup returns false when cancelled', () => {
    expect(isActiveMergeGroup({ ...activeGroup, cancelledAt: '2026-01-01T00:00:00Z' })).toBe(false)
    expect(isActiveMergeGroup(activeGroup)).toBe(true)
  })

  it('resolveCombinedClassMergeViewState for lead row', () => {
    const rows = [
      { id: 'p-100', organizationApplicationId: '100', educationGrade: '5학년' },
      { id: 'p-101', organizationApplicationId: '101', educationGrade: '6학년' },
    ]
    const state = resolveCombinedClassMergeViewState([activeGroup], rows[0], rows)
    expect(state.combinedClassApplication).toBe('신청')
    expect(state.combinedClassPartnerIds).toEqual(['p-101'])
    expect(state.combinedClassPartnerGrades).toEqual(['6학년'])
    expect(state.isLead).toBe(true)
  })

  it('resolveCombinedClassMergeViewState for member row', () => {
    const rows = [
      { id: 'p-100', organizationApplicationId: '100', educationGrade: '5학년' },
      { id: 'p-101', organizationApplicationId: '101', educationGrade: '6학년' },
    ]
    const state = resolveCombinedClassMergeViewState([activeGroup], rows[1], rows)
    expect(state.combinedClassApplication).toBe('신청')
    expect(state.combinedClassPartnerIds).toEqual(['p-100'])
    expect(state.combinedClassPartnerGrades).toEqual(['5학년'])
    expect(state.isLead).toBe(false)
  })

  it('미신청은 합반 라디오를 다시 열 수 있고, 비리드 멤버만 잠근다', () => {
    expect(
      isCombinedClassNonLeadMember({
        combinedClassApplication: '미신청',
        isLead: false,
      })
    ).toBe(false)
    expect(isCombinedClassNonLeadMember(null)).toBe(false)
    expect(
      isCombinedClassNonLeadMember({
        combinedClassApplication: '신청',
        isLead: true,
      })
    ).toBe(false)
    expect(
      isCombinedClassNonLeadMember({
        combinedClassApplication: '신청',
        isLead: false,
      })
    ).toBe(true)
  })

  it('findActiveMergeGroupForOrganizationApplication finds member group', () => {
    expect(findActiveMergeGroupForOrganizationApplication([activeGroup], 101)?.id).toBe(10)
  })

  it('buildCreateMergeRequest includes lead and partner applications', () => {
    expect(
      buildCreateMergeRequest({
        leadOrganizationApplicationId: 100,
        leadGrade: '5학년',
        partnerMembers: [{ organizationApplicationId: 101, grade: '6학년' }],
        leadTeacherMemberId: 2001,
      })
    ).toEqual({
      leadApplicationId: 100,
      members: [
        { organizationApplicationId: 100, grade: '5학년' },
        { organizationApplicationId: 101, grade: '6학년' },
      ],
      changeReason: '합반 신청',
      leadTeacherMemberId: 2001,
    })
  })

  it('buildCreateMergeRequest does not duplicate the lead already listed as a partner', () => {
    expect(
      buildCreateMergeRequest({
        leadOrganizationApplicationId: 100,
        leadGrade: ' 5학년 ',
        partnerMembers: [
          { organizationApplicationId: 100, grade: '5학년' },
          { organizationApplicationId: 101, grade: '6학년' },
        ],
      }).members
    ).toEqual([
      { organizationApplicationId: 100, grade: '5학년' },
      { organizationApplicationId: 101, grade: '6학년' },
    ])
  })

  it('assertOrganizationMergeMembers blocks fewer than two applications and the same grade', () => {
    expect(() =>
      assertOrganizationMergeMembers({
        leadOrganizationApplicationId: 100,
        leadGrade: '1학년',
        partnerMembers: [],
      })
    ).toThrow('합반에는 리드 신청을 포함해 승인된 신청 2건 이상이 필요합니다.')

    expect(() =>
      assertOrganizationMergeMembers({
        leadOrganizationApplicationId: 100,
        leadGrade: '1학년',
        partnerMembers: [{ organizationApplicationId: 101, grade: '1학년' }],
      })
    ).toThrow('합반 대상 신청은 서로 다른 학년이어야 합니다.')

    expect(() =>
      assertOrganizationMergeMembers({
        leadOrganizationApplicationId: 100,
        leadGrade: '',
        partnerMembers: [{ organizationApplicationId: 101, grade: '2학년' }],
      })
    ).toThrow('리드 신청의 학년 정보를 확인할 수 없습니다.')
  })

  it('buildMergeMemberRequestsFromPartnerRows maps grade and org app id', () => {
    const rows = [
      { id: 'a', organizationApplicationId: '201', educationGrade: '4학년' },
      { id: 'b', organizationApplicationId: '202', educationGrade: '5학년' },
    ]
    expect(buildMergeMemberRequestsFromPartnerRows(['b'], rows)).toEqual([
      { organizationApplicationId: 202, grade: '5학년' },
    ])
  })
})
