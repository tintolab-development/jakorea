import { useSearchParams } from 'react-router-dom'
import { CmsButton } from '@/shared/ui/cms-button'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { isInstructorPermissionRevoked } from '@/features/user/shared/lib/member-list-display'
import { hasProgramAssignmentHistory } from '@/features/user/shared/lib/has-program-assignment-history'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  canAccessAdminCommentInAdminDetail,
  shouldShowAdminCommentForAdminPermissionApplicationDetail,
  shouldShowAdminCommentSectionForViewer,
} from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  parseUserBasicInfoEntryQuery,
  resolveUserBasicInfoBodyKey,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
} from '@/features/user/detail/ui/user-basic-info-section'
import { useUserDetailFullpageShell } from './user-detail-fullpage-shell-context'
import type { PermissionHeaderActionsProps } from './user-detail-fullpage-header-actions'

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'

function normalizeApprovalStatus(
  status: string | undefined,
  isRevoked: boolean
): ApprovalStatus {
  if (isRevoked) return 'REVOKED'
  const raw = status?.trim()
  if (!raw) return 'PENDING'
  const upper = raw.toUpperCase()
  if (upper === 'APPROVED' || raw === '승인 완료') return 'APPROVED'
  if (upper === 'REJECTED' || raw === '신청 반려' || raw === '반려') return 'REJECTED'
  if (upper === 'PENDING' || raw === '승인 대기') return 'PENDING'
  return 'PENDING'
}

export function PermissionHeaderActions({
  permissionRole,
  displayUser,
  personalInfoButton,
  personalInfoRevealed,
  onPermissionApprove,
  onPermissionReject,
  onPermissionResetToPending,
}: PermissionHeaderActionsProps) {
  const pageShell = useUserDetailFullpageShell()
  const [searchParams] = useSearchParams()
  const currentUser = useAuthStore(state => state.user)

  if (!permissionRole) {
    return null
  }

  const approvalStatus = normalizeApprovalStatus(
    displayUser.permissionApprovalStatus,
    permissionRole === 'instructor' && isInstructorPermissionRevoked(displayUser)
  )
  const approvalCancelBlocked =
    permissionRole === 'admin' && hasProgramAssignmentHistory(displayUser)

  const isCommentEditing =
    pageShell.basicInfoEditing && pageShell.basicInfoEditScope === 'comment'

  const entryFromQuery = parseUserBasicInfoEntryQuery(
    searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY)
  )
  const basicBodyKey = resolveUserBasicInfoBodyKey(
    pageShell.basicInfoEntrySource,
    entryFromQuery,
    displayUser.role
  )
  const canEditCommentBody =
    basicBodyKey === 'all_users' ||
    basicBodyKey === 'institution' ||
    basicBodyKey === 'instructor' ||
    (basicBodyKey === 'admin' && canAccessAdminCommentInAdminDetail(currentUser))

  const showCommentEditStart =
    approvalStatus === 'APPROVED' &&
    shouldShowAdminCommentSectionForViewer(currentUser, displayUser) &&
    shouldShowAdminCommentForAdminPermissionApplicationDetail('permission', displayUser) &&
    canEditCommentBody

  return (
    <div className="info-section-buttons--wrapper">
      {approvalStatus === 'PENDING' ? (
        <>
          <CmsButton
            variant="delete"
            onClick={() => {
              onPermissionReject?.({ userId: displayUser.id, permissionRole })
            }} >
            신청 반려
          </CmsButton>
          <CmsButton
            variant="secondary"
            onClick={() => {
              onPermissionApprove?.({ userId: displayUser.id, permissionRole })
            }} >
            신청 승인
          </CmsButton>
        </>
      ) : null}
      {approvalStatus === 'REJECTED' && permissionRole !== 'instructor' ? (
        <CmsButton
          variant="delete"
          onClick={() => {
            onPermissionResetToPending?.({
              userId: displayUser.id,
              permissionRole,
              fromStatus: 'REJECTED',
            })
          }} >
          반려 취소
        </CmsButton>
      ) : null}
      {approvalStatus === 'APPROVED' ? (
        <CmsButton
          variant="delete"
          disabled={approvalCancelBlocked}
          title={
            approvalCancelBlocked
              ? '프로그램 담당 이력이 있어 승인을 취소할 수 없습니다.'
              : undefined
          }
          onClick={() => {
            if (approvalCancelBlocked) return
            onPermissionResetToPending?.({
              userId: displayUser.id,
              permissionRole,
              fromStatus: 'APPROVED',
            })
          }} >
          승인 취소
        </CmsButton>
      ) : null}
      {showCommentEditStart ? (
        <CmsButton
          key="admin-comment-edit"
          size="large"
          variant="primary"
          disabled={isCommentEditing}
          onClick={pageShell.onStartAdminCommentEdit} >
          코멘트 작성
        </CmsButton>
      ) : null}
      {personalInfoButton ? (
        <PersonalInfoRevealButton
          labelMode="stickyReveal"
          revealed={personalInfoRevealed}
          cmsVariant={personalInfoButton.variant}
          cmsSize="large"
          onClick={personalInfoButton.onClick} />
      ) : null}
    </div>
  )
}
