import {
  cancelOrganizationMergeGroupRemote,
  createOrganizationMergeGroupRemote,
  fetchOrganizationMergeGroupsRemote,
} from '@/features/program/general/api/organization-merge-groups-api-client'
import { shouldUseOrganizationMergeGroupsRemoteApi } from '@/features/program/general/api/organization-merge-groups-remote-capabilities'
import {
  areMergeMemberRequestsEqual,
  buildCreateMergeRequest,
  buildMergeMemberRequestsFromPartnerRows,
  findActiveLeadMergeGroup,
  type OrganizationApplicationRowRef,
  resolveOrganizationApplicationId,
} from '@/features/program/general/lib/organization-merge-groups-mapper'
import type { MergeGroupResponse } from '@/shared/api/generated/dashboard/schemas/mergeGroupResponse'

function assertOrganizationMergeGroupsRemoteReady(): void {
  if (!shouldUseOrganizationMergeGroupsRemoteApi()) {
    throw new Error(
      '기관 합반 API가 활성화되지 않았습니다. programs·applications/programProgress 모듈과 API 로그인을 확인해 주세요.'
    )
  }
}

export async function fetchOrganizationMergeGroups(
  programId: string
): Promise<MergeGroupResponse[]> {
  assertOrganizationMergeGroupsRemoteReady()
  return fetchOrganizationMergeGroupsRemote(programId)
}

export interface SaveOrganizationCombinedClassParams {
  programId: string
  leadRow: OrganizationApplicationRowRef
  allRows: OrganizationApplicationRowRef[]
  combinedClassApplication: '신청' | '미신청'
  partnerRowIds: string[]
  existingMergeGroups?: MergeGroupResponse[]
  changeReason?: string
}

export async function saveOrganizationCombinedClassRemote(
  params: SaveOrganizationCombinedClassParams
): Promise<MergeGroupResponse | null> {
  assertOrganizationMergeGroupsRemoteReady()

  const leadOrgAppId = resolveOrganizationApplicationId(params.leadRow)
  if (leadOrgAppId == null) {
    throw new Error('기관 신청 ID가 없어 합반을 저장할 수 없습니다.')
  }

  const mergeGroups =
    params.existingMergeGroups ?? (await fetchOrganizationMergeGroupsRemote(params.programId))
  const existingLeadGroup = findActiveLeadMergeGroup(mergeGroups, leadOrgAppId)

  if (params.combinedClassApplication === '미신청') {
    if (existingLeadGroup?.id != null) {
      return cancelOrganizationMergeGroupRemote(params.programId, existingLeadGroup.id)
    }
    return null
  }

  const partnerMembers = buildMergeMemberRequestsFromPartnerRows(
    params.partnerRowIds,
    params.allRows
  )
  if (partnerMembers.length === 0) {
    throw new Error('합반 대상 학년의 기관 신청 ID 또는 학년 정보가 없습니다.')
  }

  if (
    existingLeadGroup &&
    areMergeMemberRequestsEqual(
      partnerMembers,
      (existingLeadGroup.members ?? [])
        .filter(member => member.lead !== true && member.organizationApplicationId !== leadOrgAppId)
        .map(member => ({
          organizationApplicationId: member.organizationApplicationId!,
          grade: member.grade?.trim() || '',
        }))
        .filter(member => member.grade)
    )
  ) {
    return existingLeadGroup
  }

  if (existingLeadGroup?.id != null) {
    await cancelOrganizationMergeGroupRemote(params.programId, existingLeadGroup.id)
  }

  return createOrganizationMergeGroupRemote(
    params.programId,
    buildCreateMergeRequest({
      leadOrganizationApplicationId: leadOrgAppId,
      partnerMembers,
      changeReason: params.changeReason,
    })
  )
}
