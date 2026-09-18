import type { MergeGroupResponse } from '@/shared/api/generated/dashboard/schemas/mergeGroupResponse'
import type { MergeMemberRequest } from '@/shared/api/generated/dashboard/schemas/mergeMemberRequest'
import type { CreateMergeRequest } from '@/shared/api/generated/dashboard/schemas/createMergeRequest'

export interface CombinedClassMergeViewState {
  combinedClassApplication: '신청' | '미신청'
  combinedClassPartnerIds: string[]
  combinedClassPartnerGrades: string[]
  mergeGroupId?: number
  isLead: boolean
}

export interface OrganizationApplicationRowRef {
  id: string
  organizationApplicationId?: string
  educationGrade?: string
}

export function isActiveMergeGroup(group: MergeGroupResponse): boolean {
  if (group.cancelledAt) return false
  const status = group.status?.trim().toUpperCase()
  return status !== 'CANCELLED'
}

export function resolveOrganizationApplicationId(row: OrganizationApplicationRowRef): number | null {
  const raw = row.organizationApplicationId?.trim() || row.id.trim()
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : null
}

export function buildOrganizationApplicationIdToRowIdMap(
  rows: OrganizationApplicationRowRef[]
): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of rows) {
    const orgAppId = resolveOrganizationApplicationId(row)
    if (orgAppId != null) {
      map.set(orgAppId, row.id)
    }
  }
  return map
}

export function findActiveMergeGroupForOrganizationApplication(
  groups: MergeGroupResponse[],
  organizationApplicationId: number
): MergeGroupResponse | undefined {
  return groups.find(group => {
    if (!isActiveMergeGroup(group)) return false
    if (group.leadApplicationId === organizationApplicationId) return true
    return group.members?.some(
      member => member.organizationApplicationId === organizationApplicationId
    )
  })
}

export function findActiveLeadMergeGroup(
  groups: MergeGroupResponse[],
  leadOrganizationApplicationId: number
): MergeGroupResponse | undefined {
  return groups.find(
    group =>
      isActiveMergeGroup(group) && group.leadApplicationId === leadOrganizationApplicationId
  )
}

export function resolveCombinedClassMergeViewState(
  groups: MergeGroupResponse[],
  row: OrganizationApplicationRowRef,
  allRows: OrganizationApplicationRowRef[]
): CombinedClassMergeViewState {
  const orgAppId = resolveOrganizationApplicationId(row)
  if (orgAppId == null) {
    return {
      combinedClassApplication: '미신청',
      combinedClassPartnerIds: [],
      combinedClassPartnerGrades: [],
      isLead: false,
    }
  }

  const group = findActiveMergeGroupForOrganizationApplication(groups, orgAppId)
  if (!group) {
    return {
      combinedClassApplication: '미신청',
      combinedClassPartnerIds: [],
      combinedClassPartnerGrades: [],
      isLead: false,
    }
  }

  const rowIdByOrgAppId = buildOrganizationApplicationIdToRowIdMap(allRows)
  const isLead = group.leadApplicationId === orgAppId
  const members = group.members ?? []

  if (isLead) {
    const partnerMembers = members.filter(
      member => member.organizationApplicationId !== group.leadApplicationId && member.lead !== true
    )
    const partnerIds: string[] = []
    const partnerGrades: string[] = []
    for (const member of partnerMembers) {
      const memberOrgAppId = member.organizationApplicationId
      if (memberOrgAppId == null) continue
      const partnerRowId = rowIdByOrgAppId.get(memberOrgAppId)
      if (partnerRowId) partnerIds.push(partnerRowId)
      if (member.grade?.trim()) partnerGrades.push(member.grade.trim())
    }
    return {
      combinedClassApplication: '신청',
      combinedClassPartnerIds: partnerIds,
      combinedClassPartnerGrades: partnerGrades,
      mergeGroupId: group.id,
      isLead: true,
    }
  }

  const leadOrgAppId = group.leadApplicationId
  const leadRowId = leadOrgAppId != null ? rowIdByOrgAppId.get(leadOrgAppId) : undefined
  const leadGrade =
    members.find(member => member.organizationApplicationId === leadOrgAppId)?.grade?.trim() ||
    allRows.find(item => resolveOrganizationApplicationId(item) === leadOrgAppId)?.educationGrade?.trim() ||
    ''

  return {
    combinedClassApplication: '신청',
    combinedClassPartnerIds: leadRowId ? [leadRowId] : [],
    combinedClassPartnerGrades: leadGrade ? [leadGrade] : [],
    mergeGroupId: group.id,
    isLead: false,
  }
}

export function buildCreateMergeRequest(params: {
  leadOrganizationApplicationId: number
  partnerMembers: MergeMemberRequest[]
  changeReason?: string
}): CreateMergeRequest {
  return {
    leadApplicationId: params.leadOrganizationApplicationId,
    members: params.partnerMembers,
    changeReason: params.changeReason,
  }
}

export function buildMergeMemberRequestsFromPartnerRows(
  partnerRowIds: string[],
  allRows: OrganizationApplicationRowRef[]
): MergeMemberRequest[] {
  const rowById = new Map(allRows.map(row => [row.id, row]))
  const members: MergeMemberRequest[] = []

  for (const partnerRowId of partnerRowIds) {
    const partnerRow = rowById.get(partnerRowId)
    if (!partnerRow) continue
    const orgAppId = resolveOrganizationApplicationId(partnerRow)
    const grade = partnerRow.educationGrade?.trim()
    if (orgAppId == null || !grade) continue
    members.push({
      organizationApplicationId: orgAppId,
      grade,
    })
  }

  return members
}

export function areMergeMemberRequestsEqual(
  left: MergeMemberRequest[],
  right: MergeMemberRequest[]
): boolean {
  if (left.length !== right.length) return false
  const normalize = (items: MergeMemberRequest[]) =>
    [...items]
      .map(item => `${item.organizationApplicationId}:${item.grade}`)
      .sort()
      .join('|')
  return normalize(left) === normalize(right)
}
