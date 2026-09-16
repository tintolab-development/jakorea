import { describe, expect, it } from 'vitest'
import {
  buildMergeMemberRequestsFromPartnerRows,
  findActiveMergeGroupForOrganizationApplication,
  isActiveMergeGroup,
  resolveCombinedClassMergeViewState,
} from './organization-merge-groups-mapper'
import type { MergeGroupResponse } from '@/shared/api/generated/dashboard/schemas/mergeGroupResponse'

const activeGroup: MergeGroupResponse = {
  id: 10,
  leadApplicationId: 100,
  status: 'PENDING',
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

  it('findActiveMergeGroupForOrganizationApplication finds member group', () => {
    expect(findActiveMergeGroupForOrganizationApplication([activeGroup], 101)?.id).toBe(10)
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
