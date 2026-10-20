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
  teacherMemberId?: number
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

function sameApplicationId(
  left: number | string | null | undefined,
  right: number | string | null | undefined
): boolean {
  if (left == null || right == null || left === '' || right === '') return false
  const leftId = Number(left)
  const rightId = Number(right)
  return Number.isFinite(leftId) && leftId === rightId
}

export function findActiveMergeGroupForOrganizationApplication(
  groups: MergeGroupResponse[],
  organizationApplicationId: number
): MergeGroupResponse | undefined {
  return groups.find(group => {
    if (!isActiveMergeGroup(group)) return false
    if (sameApplicationId(group.leadApplicationId, organizationApplicationId)) return true
    return group.members?.some(member =>
      sameApplicationId(member.organizationApplicationId, organizationApplicationId)
    )
  })
}

export function findActiveLeadMergeGroup(
  groups: MergeGroupResponse[],
  leadOrganizationApplicationId: number
): MergeGroupResponse | undefined {
  return groups.find(
    group =>
      isActiveMergeGroup(group) &&
      sameApplicationId(group.leadApplicationId, leadOrganizationApplicationId)
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
  const isLead = sameApplicationId(group.leadApplicationId, orgAppId)
  const members = group.members ?? []

  if (isLead) {
    const partnerMembers = members.filter(
      member =>
        !sameApplicationId(member.organizationApplicationId, group.leadApplicationId) &&
        member.lead !== true
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

/** 활성 합반의 비리드 멤버만 편집 잠금. 미신청(그룹 없음)은 라디오로 다시 신청할 수 있다. */
export function isCombinedClassNonLeadMember(
  view: Pick<CombinedClassMergeViewState, 'combinedClassApplication' | 'isLead'> | null | undefined
): boolean {
  return view?.combinedClassApplication === '신청' && view.isLead === false
}

export function assertOrganizationMergeMembers(params: {
  leadOrganizationApplicationId: number
  leadGrade: string
  partnerMembers: MergeMemberRequest[]
}): void {
  const leadGrade = params.leadGrade.trim()
  if (!leadGrade) {
    throw new Error('리드 신청의 학년 정보를 확인할 수 없습니다.')
  }

  const grades = new Set<string>([leadGrade])
  const applicationIds = new Set<number>([params.leadOrganizationApplicationId])

  for (const member of params.partnerMembers) {
    const grade = member.grade.trim()
    if (!grade) {
      throw new Error('합반 대상 신청의 학년 정보를 확인해 주세요.')
    }
    if (grades.has(grade)) {
      throw new Error('합반 대상 신청은 서로 다른 학년이어야 합니다.')
    }
    if (applicationIds.has(member.organizationApplicationId)) {
      throw new Error('동일한 신청이 중복 선택되었습니다.')
    }
    grades.add(grade)
    applicationIds.add(member.organizationApplicationId)
  }

  if (applicationIds.size < 2) {
    throw new Error('합반에는 리드 신청을 포함해 승인된 신청 2건 이상이 필요합니다.')
  }
}

export function buildCreateMergeRequest(params: {
  leadOrganizationApplicationId: number
  leadGrade: string
  partnerMembers: MergeMemberRequest[]
  changeReason?: string
  leadTeacherMemberId?: number
}): CreateMergeRequest {
  const leadGrade = params.leadGrade.trim()
  const partnerMembers = params.partnerMembers.filter(
    member => member.organizationApplicationId !== params.leadOrganizationApplicationId
  )
  const changeReason = params.changeReason?.trim() || '합반 신청'
  return {
    leadApplicationId: params.leadOrganizationApplicationId,
    members: [
      {
        organizationApplicationId: params.leadOrganizationApplicationId,
        grade: leadGrade,
      },
      ...partnerMembers,
    ],
    changeReason,
    ...(params.leadTeacherMemberId != null
      ? { leadTeacherMemberId: params.leadTeacherMemberId }
      : {}),
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
