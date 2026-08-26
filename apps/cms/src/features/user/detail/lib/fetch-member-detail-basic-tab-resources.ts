import type { QueryClient } from '@tanstack/react-query'
import {
  fetchAffiliatedTeachersQuery,
  fetchMemberCommentsQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { fetchMemberConsentRecordsQuery } from '@/features/user/api/hooks/use-member-detail-query'
import {
  resolveAdminCommentResource,
} from '@/features/user/api/resolve-admin-comment-resource'
import { MEMBER_DETAIL_SCREEN_CODE } from '@/features/user/api/map-member-comments'
import { shouldShowAdminCommentSectionForViewer } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import type { User } from '@/types/user'

/** 관리자 계정은 admin-accounts 상세 `termsAgreements`가 SSOT. member consent-records API를 쓰지 않는다. */
export function shouldFetchMemberConsentRecords(params: {
  role: User['role']
  memberId?: number | null
  showConsentAgreement: boolean
}): boolean {
  return params.showConsentAgreement && params.role !== 'ADMIN' && params.memberId != null
}

/** 회원 상세 정보(detail-info) 탭 — 약관·동의·소속 교사 등 기본정보 전용 API */
export async function fetchMemberDetailBasicTabResources(
  queryClient: QueryClient,
  params: {
    detailTabActive: boolean
    membersRemote: boolean
    displayUser: Pick<User, 'role' | 'memberId' | 'organizationId' | 'id'> | null | undefined
    mode: 'default' | 'permission'
    showConsentAgreement: boolean
    showSchoolAffiliatedTeachers: boolean
    organizationId?: number
    currentUser?: Pick<User, 'role'> | null
  }
): Promise<void> {
  const {
    detailTabActive,
    membersRemote,
    displayUser,
    mode,
    showConsentAgreement,
    showSchoolAffiliatedTeachers,
    organizationId,
    currentUser,
  } = params
  if (!detailTabActive || !membersRemote || mode === 'permission' || !displayUser) return

  const memberId = displayUser.memberId
  const tasks: Promise<unknown>[] = []

  if (
    shouldFetchMemberConsentRecords({
      role: displayUser.role,
      memberId,
      showConsentAgreement,
    }) &&
    memberId != null
  ) {
    tasks.push(fetchMemberConsentRecordsQuery(queryClient, memberId))
  }

  if (showSchoolAffiliatedTeachers) {
    tasks.push(
      fetchAffiliatedTeachersQuery(queryClient, {
        memberId: memberId ?? undefined,
        organizationId,
      })
    )
  }

  if (
    currentUser &&
    shouldShowAdminCommentSectionForViewer(currentUser, displayUser)
  ) {
    const commentResource = resolveAdminCommentResource(displayUser)
    if (commentResource) {
      tasks.push(
        fetchMemberCommentsQuery(
          queryClient,
          commentResource.resourceId,
          MEMBER_DETAIL_SCREEN_CODE,
          commentResource.target
        )
      )
    }
  }

  await Promise.all(tasks)
}
