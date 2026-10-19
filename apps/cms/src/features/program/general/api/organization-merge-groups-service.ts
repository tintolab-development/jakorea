import {
  cancelOrganizationMergeGroupRemote,
  createOrganizationMergeGroupRemote,
  fetchOrganizationMergeGroupsRemote,
  patchOrganizationMergeGroupRemote,
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
import { isGeneralOrganizationProgramType } from '@/features/program/general/lib/organization-merge-program-type'
import type { MergeGroupResponse } from '@/shared/api/generated/dashboard/schemas/mergeGroupResponse'

function assertOrganizationMergeGroupsRemoteReady(): void {
  if (!shouldUseOrganizationMergeGroupsRemoteApi()) {
    throw new Error(
      '기관 합반 API가 활성화되지 않았습니다. programs·applications/programProgress 모듈과 API 로그인을 확인해 주세요.'
    )
  }
}

export async function fetchOrganizationMergeGroups(
  programId: string,
  programType: string | null | undefined
): Promise<MergeGroupResponse[]> {
  if (!isGeneralOrganizationProgramType(programType)) return []
  assertOrganizationMergeGroupsRemoteReady()
  return fetchOrganizationMergeGroupsRemote(programId)
}

export interface SaveOrganizationCombinedClassParams {
  programId: string
  programType: string | null | undefined
  leadRow: OrganizationApplicationRowRef
  allRows: OrganizationApplicationRowRef[]
  combinedClassApplication: '신청' | '미신청'
  partnerRowIds: string[]
  existingMergeGroups?: MergeGroupResponse[]
  changeReason?: string
  leadTeacherMemberId?: number
}

export async function saveOrganizationCombinedClassRemote(
  params: SaveOrganizationCombinedClassParams
): Promise<MergeGroupResponse | null> {
  if (!isGeneralOrganizationProgramType(params.programType)) {
    throw new Error('합반 API는 GENERAL_ORGANIZATION 프로그램에서만 호출합니다.')
  }
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

  const leadGrade = params.leadRow.educationGrade?.trim() ?? ''
  if (!leadGrade) {
    throw new Error('합반 기준 학년 정보가 없어 합반을 저장할 수 없습니다.')
  }

  const partnerMembers = buildMergeMemberRequestsFromPartnerRows(
    params.partnerRowIds,
    params.allRows
  )
  if (partnerMembers.length === 0) {
    throw new Error('합반 대상 학년의 기관 신청 ID 또는 학년 정보가 없습니다.')
  }

  const partnersUnchanged =
    existingLeadGroup != null &&
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
  const leadTeacherChanged =
    params.leadTeacherMemberId != null &&
    params.leadTeacherMemberId !== existingLeadGroup?.leadTeacherMemberId

  if (existingLeadGroup && partnersUnchanged && !leadTeacherChanged) {
    return existingLeadGroup
  }

  if (
    existingLeadGroup?.id != null &&
    existingLeadGroup.status?.trim().toUpperCase() === 'EFFECTIVE' &&
    partnersUnchanged &&
    leadTeacherChanged &&
    params.leadTeacherMemberId != null
  ) {
    return patchOrganizationMergeGroupRemote(params.programId, existingLeadGroup.id, {
      leadTeacherMemberId: params.leadTeacherMemberId,
    })
  }

  if (existingLeadGroup?.id != null) {
    await cancelOrganizationMergeGroupRemote(params.programId, existingLeadGroup.id)
  }

  const rowTeacherMemberId = params.leadRow.teacherMemberId
  const leadTeacherMemberId =
    params.leadTeacherMemberId ??
    (rowTeacherMemberId != null && Number.isFinite(rowTeacherMemberId) && rowTeacherMemberId > 0
      ? rowTeacherMemberId
      : undefined)

  return createOrganizationMergeGroupRemote(
    params.programId,
    buildCreateMergeRequest({
      leadOrganizationApplicationId: leadOrgAppId,
      leadGrade,
      partnerMembers,
      changeReason: params.changeReason,
      leadTeacherMemberId,
    })
  )
}
