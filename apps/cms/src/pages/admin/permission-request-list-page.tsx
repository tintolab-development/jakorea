/**
 * 권한 승인 — 강사·관리자 탭, 회원 권한 신청 목록
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import '@/shared/ui/detail-fullpage-modal.css'
import type { User } from '@/types/user'
import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'
import {
  MembersPermissionList,
  type MembersPermissionListHandle,
} from '@/features/user/permission-management/members-permission-list'
import { mapPermissionApplicationRowToDetailUser } from '@/features/user/permission-management/lib/map-permission-application-row-to-detail-user'
import { mapInstructorRoleRequestDetailToUser } from '@/features/user/api/map-instructor-role-request-detail-to-user'
import { mapAdminAccountDetailToUser } from '@/features/user/api/map-admin-account-detail-to-user'
import { useInstructorRoleRequestDetailQuery } from '@/features/user/api/hooks/use-instructor-role-request-detail-query'
import { useAdminApprovalRequestDetailQuery } from '@/features/user/api/hooks/use-admin-approval-request-detail-query'
import {
  InstructorPermissionApproveModal,
  type InstructorPermissionApprovePayload,
} from '@/features/user/permission-management/instructor-permission-approve-modal'
import {
  InstructorPermissionRejectModal,
  type InstructorPermissionRejectPayload,
} from '@/features/user/permission-management/instructor-permission-reject-modal'
import { InstructorPermissionApprovedCompleteModal } from '@/features/user/permission-management/instructor-permission-approved-complete-modal'
import { InstructorPermissionStatusResetConfirmModal } from '@/features/user/permission-management/instructor-permission-status-reset-confirm-modal'
import { UserDetailFullPageModal } from '@/pages/users/user-detail-fullpage-modal'
import type { UserDetailPermissionRole } from '@/pages/users/user-detail-fullpage-modal'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import { updateMockUserById } from '@/data/mock/users'
import { applyInstructorPermissionRevokedToUser } from '@/features/user/shared/lib/apply-instructor-permission-revoked'
import {
  isInstructorPermissionRevoked,
} from '@/features/user/shared/lib/member-list-display'
import { markInstructorPermissionRevoked } from '@/features/user/shared/lib/revoked-instructor-overlay'
import {
  isAdminApprovalRequestsRemoteEnabled,
  isInstructorRoleRequestsRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'
import { useInstructorRoleRequestMutations } from '@/features/user/api/hooks/use-instructor-role-request-mutations'
import { useAdminApprovalRequestMutations } from '@/features/user/api/hooks/use-admin-approval-request-mutations'
import { handleError } from '@/shared/utils/error-handler'
import { guardAdminAction } from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import './permission-request-page.css'

const INSTRUCTOR_PERMISSION_APPROVE_MODAL_Z = 1150
/** 풀페이지 회원 상세(권한 모드) 위에도 반려 확인이 보이도록 여유 있게 */
const INSTRUCTOR_PERMISSION_REJECT_MODAL_Z = 2100
const INSTRUCTOR_PERMISSION_APPROVED_COMPLETE_MODAL_Z = 1160
const PERMISSION_STATUS_RESET_CONFIRM_MODAL_Z = 1160

/** 권한 승인 — 회원 풀페이지 상세 URL (`replace: false`로 열어 뒤로가기 복귀) */
const PR_DETAIL_USER = 'pr_detail_user'
const PR_DETAIL_ROLE = 'pr_detail_role'

type InstructorApproveModalState =
  | {
      variant: 'single'
      userId: string
      requestId?: number
      displayName: string
      source: 'list' | 'detail'
    }
  | {
      variant: 'bulk'
      userIds: string[]
      requestIds?: number[]
      memberCount: number
      source: 'list'
    }

type InstructorApprovedCompleteState =
  | { variant: 'single'; displayName: string; source: 'list' | 'detail' }
  | { variant: 'bulk'; memberCount: number; source: 'list' }

type InstructorRejectModalState =
  | {
      variant: 'single'
      userId: string
      requestId?: number
      displayName: string
      source: 'list' | 'detail'
    }
  | {
      variant: 'bulk'
      userIds: string[]
      requestIds?: number[]
      memberCount: number
      source: 'list'
    }

type AdminApproveModalState = InstructorApproveModalState
type AdminRejectModalState = InstructorRejectModalState
type AdminApprovedCompleteState =
  | {
      variant: 'single'
      displayName: string
      source: 'list' | 'detail'
      approvedPermissionVariant: AdminPermissionTagVariant
    }
  | {
      variant: 'bulk'
      memberCount: number
      source: 'list'
      approvedPermissionVariant: AdminPermissionTagVariant
    }
type PermissionStatusResetConfirmState = {
  userId: string
  displayName: string
  permissionRole: UserDetailPermissionRole
  fromStatus: 'APPROVED' | 'REJECTED'
}

type PermissionListTabKey = 'instructor' | 'admin'

function resolveInstructorMemberIdForRevoke(
  userId: string,
  detailUser: Omit<User, 'password'> | null,
  detailTargetRow: MemberPermissionApplicationRow | null,
  listRef: React.RefObject<MembersPermissionListHandle | null>
): number | undefined {
  return (
    detailUser?.memberId ??
    detailTargetRow?.memberId ??
    listRef.current?.getRowForUser(userId)?.memberId
  )
}
function resolvePermissionDetailRequestId(
  permissionRole: UserDetailPermissionRole,
  userId: string,
  detailUser: Omit<User, 'password'> | null,
  listRef: React.RefObject<MembersPermissionListHandle | null>
): number | undefined {
  if (permissionRole === 'instructor') {
    return detailUser?.instructorRoleRequestId ?? listRef.current?.getRequestIdForUser(userId)
  }
  if (permissionRole === 'admin') {
    return detailUser?.adminAccountId ?? listRef.current?.getRequestIdForUser(userId)
  }
  return undefined
}

export function PermissionRequestListPage() {
  const roleCode = useSessionAdminRoleCode()
  const [searchParams, setSearchParams] = useSearchParams()
  const instructorListRef = useRef<MembersPermissionListHandle>(null)
  const adminListRef = useRef<MembersPermissionListHandle>(null)
  const instructorRemote = isInstructorRoleRequestsRemoteEnabled()
  const adminRemote = isAdminApprovalRequestsRemoteEnabled()
  const {
    approveMutation,
    rejectMutation,
    resetPendingMutation,
    revokeMutation,
    resendNotificationMutation,
    getApproveError,
    getRejectError,
    getResetPendingError,
    getRevokeError,
    getResendNotificationError,
  } = useInstructorRoleRequestMutations()
  const {
    approveMutation: adminApproveMutation,
    rejectMutation: adminRejectMutation,
    resetPendingMutation: adminResetPendingMutation,
    resendNotificationMutation: adminResendNotificationMutation,
    getApproveError: getAdminApproveError,
    getRejectError: getAdminRejectError,
    getResetPendingError: getAdminResetPendingError,
    getResendNotificationError: getAdminResendNotificationError,
  } = useAdminApprovalRequestMutations()

  const urlPermissionRole = useMemo((): UserDetailPermissionRole | null => {
    const r = searchParams.get(PR_DETAIL_ROLE)
    return r === 'instructor' || r === 'admin' ? r : null
  }, [searchParams])

  const detailUserId = useMemo(() => {
    const id = searchParams.get(PR_DETAIL_USER)?.trim()
    return id && id.length > 0 ? id : null
  }, [searchParams])

  const detailOpen = detailUserId != null && urlPermissionRole != null
  const permissionRole = urlPermissionRole
  const [instructorApproveModal, setInstructorApproveModal] =
    useState<InstructorApproveModalState | null>(null)
  const [instructorApprovedComplete, setInstructorApprovedComplete] =
    useState<InstructorApprovedCompleteState | null>(null)
  const [instructorRejectModal, setInstructorRejectModal] =
    useState<InstructorRejectModalState | null>(null)
  const [adminApproveModal, setAdminApproveModal] = useState<AdminApproveModalState | null>(null)
  const [adminRejectModal, setAdminRejectModal] = useState<AdminRejectModalState | null>(null)
  const [adminApprovedComplete, setAdminApprovedComplete] =
    useState<AdminApprovedCompleteState | null>(null)
  const [permissionStatusResetConfirm, setPermissionStatusResetConfirm] =
    useState<PermissionStatusResetConfirmState | null>(null)
  const [activeListTab, setActiveListTab] = useState<PermissionListTabKey>('instructor')
  const [detailTargetRow, setDetailTargetRow] = useState<MemberPermissionApplicationRow | null>(
    null
  )
  /** revoke 직후 React 리렌더용 — BE 신청 row는 APPROVED 이력으로 남을 수 있음 */
  const [revokedInstructorSessionKeys, setRevokedInstructorSessionKeys] = useState(
    () => new Set<string>()
  )

  const detailInstructorRequestId =
    permissionRole === 'instructor' ? detailTargetRow?.requestId : undefined
  const detailAdminAccountId =
    permissionRole === 'admin'
      ? (detailTargetRow?.requestId ?? detailTargetRow?.adminId)
      : undefined

  const instructorDetailQuery = useInstructorRoleRequestDetailQuery(
    detailInstructorRequestId,
    detailOpen && permissionRole === 'instructor'
  )
  const adminDetailQuery = useAdminApprovalRequestDetailQuery(
    detailAdminAccountId,
    detailOpen && permissionRole === 'admin'
  )

  const detailUser = useMemo((): Omit<User, 'password'> | null => {
    if (!detailOpen || !detailTargetRow || !permissionRole) return null

    const withRevokedSession = (user: Omit<User, 'password'>): Omit<User, 'password'> => {
      const sessionRevoked =
        revokedInstructorSessionKeys.has(user.id) ||
        (user.memberId != null && revokedInstructorSessionKeys.has(String(user.memberId)))
      if (sessionRevoked || isInstructorPermissionRevoked(user)) {
        return applyInstructorPermissionRevokedToUser(user)
      }
      return user
    }

    if (permissionRole === 'instructor') {
      if (instructorRemote) {
        if (instructorDetailQuery.isLoading) return null
        if (instructorDetailQuery.data) {
          return withRevokedSession(
            mapInstructorRoleRequestDetailToUser(instructorDetailQuery.data, {
              fallbackId: detailTargetRow.userId,
            })
          )
        }
        if (instructorDetailQuery.isError) {
          return withRevokedSession(
            mapPermissionApplicationRowToDetailUser(detailTargetRow, 'instructor')
          )
        }
        return null
      }
      return withRevokedSession(
        mapPermissionApplicationRowToDetailUser(detailTargetRow, 'instructor')
      )
    }

    if (adminRemote) {
      if (adminDetailQuery.isLoading) return null
      if (adminDetailQuery.data) {
        return mapAdminAccountDetailToUser(adminDetailQuery.data, {
          fallbackId: detailTargetRow.userId,
        })
      }
      if (adminDetailQuery.isError) {
        return mapPermissionApplicationRowToDetailUser(detailTargetRow, 'admin')
      }
      return null
    }
    return mapPermissionApplicationRowToDetailUser(detailTargetRow, 'admin')
  }, [
    adminDetailQuery.data,
    adminDetailQuery.isError,
    adminDetailQuery.isLoading,
    adminRemote,
    detailOpen,
    detailTargetRow,
    instructorDetailQuery.data,
    instructorDetailQuery.isError,
    instructorDetailQuery.isLoading,
    instructorRemote,
    permissionRole,
    revokedInstructorSessionKeys,
  ])

  useEffect(() => {
    if (instructorDetailQuery.isError) {
      handleError(instructorDetailQuery.error, {
        defaultMessage: '권한 신청 상세를 불러오지 못했습니다. 목록 정보로 표시합니다.',
      })
    }
  }, [instructorDetailQuery.error, instructorDetailQuery.isError])

  useEffect(() => {
    if (adminDetailQuery.isError) {
      handleError(adminDetailQuery.error, {
        defaultMessage: '관리자 권한 신청 상세를 불러오지 못했습니다. 목록 정보로 표시합니다.',
      })
    }
  }, [adminDetailQuery.error, adminDetailQuery.isError])

  const basicInfoEntrySource = useMemo(() => {
    if (!permissionRole) return undefined
    return permissionRole === 'admin' ? ('admin' as const) : ('instructor' as const)
  }, [permissionRole])

  const applyDetailRow = useCallback((row: MemberPermissionApplicationRow) => {
    setDetailTargetRow(row)
  }, [])

  const handleOpenUserDetail = useCallback(
    (userId: string, role: UserDetailPermissionRole, row: MemberPermissionApplicationRow) => {
      applyDetailRow(row)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(PR_DETAIL_USER, userId)
          next.set(PR_DETAIL_ROLE, role)
          return next
        },
        { replace: false }
      )
    },
    [applyDetailRow, setSearchParams]
  )

  const handleResolveDetailRow = useCallback(
    (row: MemberPermissionApplicationRow) => {
      if (!urlPermissionRole) return
      applyDetailRow(row)
    },
    [applyDetailRow, urlPermissionRole]
  )

  const handleCloseDetail = useCallback(() => {
    setDetailTargetRow(null)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(PR_DETAIL_USER)
        next.delete(PR_DETAIL_ROLE)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const handlePermissionApprove = useCallback(
    (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      if (ctx.permissionRole === 'instructor') {
        if (!guardAdminAction({ roleCode, action: 'approve' })) return
        const name = detailUser?.name?.trim() || '회원'
        setAdminApproveModal(null)
        setAdminRejectModal(null)
        setInstructorRejectModal(null)
        setInstructorApproveModal({
          variant: 'single',
          userId: ctx.userId,
          requestId: resolvePermissionDetailRequestId(
            'instructor',
            ctx.userId,
            detailUser,
            instructorListRef
          ),
          displayName: name,
          source: 'detail',
        })
        return
      }
      if (ctx.permissionRole === 'admin') {
        if (
          !guardAdminAction({
            roleCode,
            action: 'approve',
            screen: 'admin-permission-approval',
          })
        ) {
          return
        }
        const name = detailUser?.name?.trim() || '회원'
        setInstructorApproveModal(null)
        setInstructorRejectModal(null)
        setAdminRejectModal(null)
        setAdminApproveModal({
          variant: 'single',
          userId: ctx.userId,
          requestId: resolvePermissionDetailRequestId(
            'admin',
            ctx.userId,
            detailUser,
            adminListRef
          ),
          displayName: name,
          source: 'detail',
        })
        return
      }
      const nowIso = new Date().toISOString()
      updateMockUserById(ctx.userId, {
        permissionApprovalStatus: 'APPROVED',
        permissionApprovalHandledAt: nowIso,
        permissionNotificationResentAt: undefined,
      })
      handleCloseDetail()
    },
    [detailUser, handleCloseDetail, roleCode]
  )

  const handleInstructorApproveModalConfirm = useCallback(
    async (payload: InstructorPermissionApprovePayload) => {
      if (!instructorApproveModal) return

      const finishSingle = (userId: string, displayName: string, source: 'list' | 'detail') => {
        if (!instructorRemote) {
          instructorListRef.current?.applyInstructorPermissionApproved(userId)
        }
        instructorListRef.current?.clearRowSelection()
        setInstructorApproveModal(null)
        setInstructorApprovedComplete({ variant: 'single', displayName, source })
      }

      const finishBulk = (userIds: string[], memberCount: number, source: 'list') => {
        if (!instructorRemote) {
          userIds.forEach(uid => {
            instructorListRef.current?.applyInstructorPermissionApproved(uid)
          })
        }
        instructorListRef.current?.clearRowSelection()
        setInstructorApproveModal(null)
        setInstructorApprovedComplete({ variant: 'bulk', memberCount, source })
      }

      if (instructorRemote) {
        try {
          if (instructorApproveModal.variant === 'single') {
            const { requestId, userId, source, displayName } = instructorApproveModal
            if (requestId == null) {
              throw new Error('승인 요청 ID를 찾을 수 없습니다.')
            }
            await approveMutation.mutateAsync({ requestIds: [requestId], payload })
            finishSingle(userId, displayName, source)
            return
          }
          const { requestIds, userIds, memberCount, source } = instructorApproveModal
          if (!requestIds?.length) {
            throw new Error('승인 요청 ID를 찾을 수 없습니다.')
          }
          await approveMutation.mutateAsync({ requestIds, payload })
          finishBulk(userIds, memberCount, source)
        } catch (error) {
          handleError(error, { defaultMessage: getApproveError(error) })
        }
        return
      }

      if (instructorApproveModal.variant === 'single') {
        const { userId, source, displayName } = instructorApproveModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'APPROVED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
        finishSingle(userId, displayName, source)
        return
      }
      const { userIds, memberCount, source } = instructorApproveModal
      const nowIso = new Date().toISOString()
      userIds.forEach(uid => {
        updateMockUserById(uid, {
          permissionApprovalStatus: 'APPROVED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
      })
      finishBulk(userIds, memberCount, source)
    },
    [instructorApproveModal, instructorRemote, approveMutation, getApproveError]
  )

  const handleAdminApproveModalConfirm = useCallback(
    async (payload: InstructorPermissionApprovePayload) => {
      if (!adminApproveModal) return
      const approvedPermissionVariant = (
        payload.feeGrade === 'partner' || payload.feeGrade === 'viewer'
          ? payload.feeGrade
          : 'manager'
      ) as AdminPermissionTagVariant

      const finishSingle = (userId: string, displayName: string, source: 'list' | 'detail') => {
        if (!adminRemote) {
          adminListRef.current?.applyInstructorPermissionApproved(userId)
        }
        adminListRef.current?.clearRowSelection()
        setAdminApproveModal(null)
        setAdminApprovedComplete({
          variant: 'single',
          displayName,
          source,
          approvedPermissionVariant,
        })
      }

      const finishBulk = (userIds: string[], memberCount: number, source: 'list') => {
        if (!adminRemote) {
          userIds.forEach(uid => {
            adminListRef.current?.applyInstructorPermissionApproved(uid)
          })
        }
        adminListRef.current?.clearRowSelection()
        setAdminApproveModal(null)
        setAdminApprovedComplete({
          variant: 'bulk',
          memberCount,
          source,
          approvedPermissionVariant,
        })
      }

      if (adminRemote) {
        try {
          if (adminApproveModal.variant === 'single') {
            const { requestId, userId, displayName, source } = adminApproveModal
            if (requestId == null) {
              throw new Error('승인 요청 ID를 찾을 수 없습니다.')
            }
            await adminApproveMutation.mutateAsync({
              adminIds: [requestId],
              payload,
            })
            finishSingle(userId, displayName, source)
            return
          }
          const { requestIds, userIds, memberCount, source } = adminApproveModal
          if (!requestIds?.length) {
            throw new Error('승인 요청 ID를 찾을 수 없습니다.')
          }
          await adminApproveMutation.mutateAsync({ adminIds: requestIds, payload })
          finishBulk(userIds, memberCount, source)
        } catch (error) {
          handleError(error, { defaultMessage: getAdminApproveError(error) })
        }
        return
      }

      if (adminApproveModal.variant === 'single') {
        const { userId, source, displayName } = adminApproveModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'APPROVED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
        finishSingle(userId, displayName, source)
        return
      }
      const { userIds, memberCount, source } = adminApproveModal
      const nowIso = new Date().toISOString()
      userIds.forEach(uid => {
        updateMockUserById(uid, {
          permissionApprovalStatus: 'APPROVED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
      })
      finishBulk(userIds, memberCount, source)
    },
    [adminApproveModal, adminRemote, adminApproveMutation, getAdminApproveError]
  )

  const handleInstructorApprovedCompleteClose = useCallback(() => {
    setInstructorApprovedComplete(null)
  }, [])

  const handleAdminApprovedCompleteClose = useCallback(() => {
    setAdminApprovedComplete(null)
  }, [])

  const handlePermissionReject = useCallback(
    (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      if (ctx.permissionRole === 'instructor') {
        if (!guardAdminAction({ roleCode, action: 'approve' })) return
        const name = detailUser?.name?.trim() || '회원'
        setAdminApproveModal(null)
        setAdminRejectModal(null)
        setInstructorApproveModal(null)
        setInstructorRejectModal({
          variant: 'single',
          userId: ctx.userId,
          requestId: resolvePermissionDetailRequestId(
            'instructor',
            ctx.userId,
            detailUser,
            instructorListRef
          ),
          displayName: name,
          source: 'detail',
        })
        return
      }
      if (ctx.permissionRole === 'admin') {
        if (
          !guardAdminAction({
            roleCode,
            action: 'approve',
            screen: 'admin-permission-approval',
          })
        ) {
          return
        }
        const name = detailUser?.name?.trim() || '회원'
        setInstructorApproveModal(null)
        setInstructorRejectModal(null)
        setAdminApproveModal(null)
        setAdminRejectModal({
          variant: 'single',
          userId: ctx.userId,
          requestId: resolvePermissionDetailRequestId(
            'admin',
            ctx.userId,
            detailUser,
            adminListRef
          ),
          displayName: name,
          source: 'detail',
        })
        return
      }
      const nowIso = new Date().toISOString()
      updateMockUserById(ctx.userId, {
        permissionApprovalStatus: 'REJECTED',
        permissionApprovalHandledAt: nowIso,
        permissionNotificationResentAt: undefined,
      })
      handleCloseDetail()
    },
    [detailUser, handleCloseDetail, roleCode]
  )

  const handlePermissionResetToPending = useCallback(
    (ctx: {
      userId: string
      permissionRole: UserDetailPermissionRole
      fromStatus: 'APPROVED' | 'REJECTED'
    }) => {
      const name = detailUser?.name?.trim() || '회원'
      setPermissionStatusResetConfirm({
        userId: ctx.userId,
        displayName: name,
        permissionRole: ctx.permissionRole,
        fromStatus: ctx.fromStatus,
      })
    },
    [detailUser]
  )

  const handleConfirmPermissionResetToPending = useCallback(
    async (payload: { cancellationReason: string; notifyTiming: 'immediate' | 'manual' }) => {
      if (!permissionStatusResetConfirm) return
      const { userId, permissionRole, fromStatus } = permissionStatusResetConfirm
      const reason =
        payload.cancellationReason.trim() ||
        (fromStatus === 'APPROVED' ? 'CMS 강사 권한 승인 취소' : 'CMS 강사 권한 재검토')

      if (permissionRole === 'instructor' && instructorRemote) {
        if (fromStatus === 'APPROVED') {
          const memberId = resolveInstructorMemberIdForRevoke(
            userId,
            detailUser,
            detailTargetRow,
            instructorListRef
          )
          if (memberId == null) {
            handleError(new Error('승인 취소할 회원 memberId를 찾지 못했습니다.'))
            return
          }
          try {
            const requestId =
              detailUser?.instructorRoleRequestId ??
              detailTargetRow?.requestId ??
              instructorListRef.current?.getRequestIdForUser(userId)
            await revokeMutation.mutateAsync({
              memberId,
              reason,
              requestId: requestId ?? undefined,
            })
            const revokedSnapshot = applyInstructorPermissionRevokedToUser({
              id: userId,
              memberId,
              email: detailUser?.email ?? '-',
              name: detailUser?.name ?? '-',
              role: 'INSTRUCTOR',
              isActive: true,
              createdAt: detailUser?.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            markInstructorPermissionRevoked(revokedSnapshot)
            setRevokedInstructorSessionKeys(prev => {
              const next = new Set(prev)
              next.add(userId)
              next.add(String(memberId))
              return next
            })
          } catch (error) {
            handleError(error, { defaultMessage: getRevokeError(error) })
            return
          }
        } else {
          const requestId =
            detailUser?.instructorRoleRequestId ??
            instructorListRef.current?.getRequestIdForUser(userId)
          if (requestId == null) {
            handleError(new Error('재검토할 권한 신청 ID를 찾지 못했습니다.'))
            return
          }
          try {
            await resetPendingMutation.mutateAsync({ requestId, reason })
          } catch (error) {
            handleError(error, { defaultMessage: getResetPendingError(error) })
            return
          }
        }
      } else if (permissionRole === 'admin' && adminRemote) {
        const adminAccountId =
          detailUser?.adminAccountId ?? adminListRef.current?.getRequestIdForUser(userId)
        if (adminAccountId == null) {
          handleError(new Error('승인 취소할 관리자 신청 ID를 찾지 못했습니다.'))
          return
        }
        try {
          await adminResetPendingMutation.mutateAsync({ adminAccountId, reason })
        } catch (error) {
          handleError(error, { defaultMessage: getAdminResetPendingError(error) })
          return
        }
      } else if (permissionRole === 'instructor') {
        if (fromStatus === 'APPROVED') {
          const baseUser =
            detailUser ??
            (detailTargetRow
              ? mapPermissionApplicationRowToDetailUser(detailTargetRow, 'instructor')
              : null)
          if (!baseUser) {
            handleError(new Error('승인 취소할 회원 정보를 찾지 못했습니다.'))
            return
          }
          const revoked = applyInstructorPermissionRevokedToUser(baseUser)
          updateMockUserById(userId, {
            ...revoked,
            permissionApprovalStatus: 'APPROVED',
          })
          markInstructorPermissionRevoked(revoked)
          setRevokedInstructorSessionKeys(prev => {
            const next = new Set(prev)
            next.add(userId)
            if (revoked.memberId != null) next.add(String(revoked.memberId))
            return next
          })
        } else {
          updateMockUserById(userId, {
            permissionApprovalStatus: 'PENDING',
            permissionApprovalHandledAt: undefined,
            permissionNotificationResentAt: undefined,
          })
          instructorListRef.current?.applyInstructorPermissionPending(userId)
        }
      } else {
        updateMockUserById(userId, {
          permissionApprovalStatus: 'PENDING',
          permissionApprovalHandledAt: undefined,
          permissionNotificationResentAt: undefined,
        })
        adminListRef.current?.applyInstructorPermissionPending(userId)
      }

      setPermissionStatusResetConfirm(null)
    },
    [
      adminRemote,
      adminResetPendingMutation,
      detailTargetRow,
      detailUser,
      getAdminResetPendingError,
      getResetPendingError,
      getRevokeError,
      instructorRemote,
      permissionStatusResetConfirm,
      resetPendingMutation,
      revokeMutation,
    ]
  )

  const handleCancelPermissionResetToPending = useCallback(() => {
    setPermissionStatusResetConfirm(null)
  }, [])

  const handleInstructorRejectModalConfirm = useCallback(
    async (payload: InstructorPermissionRejectPayload) => {
      if (!instructorRejectModal) return

      const finishSingle = (userId: string) => {
        if (!instructorRemote) {
          instructorListRef.current?.applyInstructorPermissionRejected(userId)
        }
        instructorListRef.current?.clearRowSelection()
        setInstructorRejectModal(null)
      }

      const finishBulk = (userIds: string[]) => {
        if (!instructorRemote) {
          userIds.forEach(uid => {
            instructorListRef.current?.applyInstructorPermissionRejected(uid)
          })
        }
        instructorListRef.current?.clearRowSelection()
        setInstructorRejectModal(null)
      }

      if (instructorRemote) {
        try {
          if (instructorRejectModal.variant === 'single') {
            const { requestId, userId } = instructorRejectModal
            if (requestId == null) {
              throw new Error('반려 요청 ID를 찾을 수 없습니다.')
            }
            await rejectMutation.mutateAsync({ requestIds: [requestId], payload })
            finishSingle(userId)
            return
          }
          const { requestIds, userIds } = instructorRejectModal
          if (!requestIds?.length) {
            throw new Error('반려 요청 ID를 찾을 수 없습니다.')
          }
          await rejectMutation.mutateAsync({ requestIds, payload })
          finishBulk(userIds)
        } catch (error) {
          handleError(error, { defaultMessage: getRejectError(error) })
        }
        return
      }

      if (instructorRejectModal.variant === 'single') {
        const { userId } = instructorRejectModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'REJECTED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
        finishSingle(userId)
        return
      }
      const { userIds } = instructorRejectModal
      const nowIso = new Date().toISOString()
      userIds.forEach(uid => {
        updateMockUserById(uid, {
          permissionApprovalStatus: 'REJECTED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
      })
      finishBulk(userIds)
    },
    [instructorRejectModal, instructorRemote, rejectMutation, getRejectError]
  )

  const handleAdminRejectModalConfirm = useCallback(
    async (payload: InstructorPermissionRejectPayload) => {
      if (!adminRejectModal) return

      const finishSingle = (userId: string) => {
        if (!adminRemote) {
          adminListRef.current?.applyInstructorPermissionRejected(userId)
        }
        adminListRef.current?.clearRowSelection()
        setAdminRejectModal(null)
      }

      const finishBulk = (userIds: string[]) => {
        if (!adminRemote) {
          userIds.forEach(uid => {
            adminListRef.current?.applyInstructorPermissionRejected(uid)
          })
        }
        adminListRef.current?.clearRowSelection()
        setAdminRejectModal(null)
      }

      if (adminRemote) {
        try {
          if (adminRejectModal.variant === 'single') {
            const { requestId, userId } = adminRejectModal
            if (requestId == null) {
              throw new Error('반려 요청 ID를 찾을 수 없습니다.')
            }
            await adminRejectMutation.mutateAsync({
              adminIds: [requestId],
              payload,
            })
            finishSingle(userId)
            return
          }
          const { requestIds, userIds } = adminRejectModal
          if (!requestIds?.length) {
            throw new Error('반려 요청 ID를 찾을 수 없습니다.')
          }
          await adminRejectMutation.mutateAsync({ adminIds: requestIds, payload })
          finishBulk(userIds)
        } catch (error) {
          handleError(error, { defaultMessage: getAdminRejectError(error) })
        }
        return
      }

      if (adminRejectModal.variant === 'single') {
        const { userId } = adminRejectModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'REJECTED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
        finishSingle(userId)
        return
      }
      const { userIds } = adminRejectModal
      const nowIso = new Date().toISOString()
      userIds.forEach(uid => {
        updateMockUserById(uid, {
          permissionApprovalStatus: 'REJECTED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
      })
      finishBulk(userIds)
    },
    [adminRejectModal, adminRemote, adminRejectMutation, getAdminRejectError]
  )

  const handlePermissionResendNotification = useCallback(
    async (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      if (ctx.permissionRole === 'instructor' && instructorRemote) {
        const requestId =
          detailUser?.instructorRoleRequestId ??
          instructorListRef.current?.getRequestIdForUser(ctx.userId)
        if (requestId == null) {
          handleError(new Error('알림 재발송할 권한 신청 ID를 찾지 못했습니다.'), {
            context: 'permissionRequestList.resendNotification.missingRequestId',
          })
          return
        }
        try {
          await resendNotificationMutation.mutateAsync(requestId)
        } catch (error) {
          handleError(error, { defaultMessage: getResendNotificationError(error) })
        }
        return
      }

      if (ctx.permissionRole === 'admin' && adminRemote) {
        const adminAccountId =
          detailUser?.adminAccountId ?? adminListRef.current?.getRequestIdForUser(ctx.userId)
        if (adminAccountId == null) {
          handleError(new Error('알림 재발송할 관리자 신청 ID를 찾지 못했습니다.'), {
            context: 'permissionRequestList.resendNotification.missingAdminId',
          })
          return
        }
        try {
          await adminResendNotificationMutation.mutateAsync(adminAccountId)
        } catch (error) {
          handleError(error, { defaultMessage: getAdminResendNotificationError(error) })
        }
        return
      }

      updateMockUserById(ctx.userId, {
        permissionNotificationResentAt: new Date().toISOString(),
      })
    },
    [
      adminRemote,
      adminResendNotificationMutation,
      detailUser?.adminAccountId,
      detailUser?.instructorRoleRequestId,
      getAdminResendNotificationError,
      getResendNotificationError,
      instructorRemote,
      resendNotificationMutation,
    ]
  )

  const detailPermissionRole = permissionRole ?? undefined

  return (
    <div>
      <CmsTextTabs
        className="permission-request-list-page__tabs"
        activeKey={activeListTab}
        onChange={setActiveListTab}
        ariaLabel="권한 승인 회원 유형"
        items={[
          { key: 'instructor', label: '강사' },
          { key: 'admin', label: '관리자' },
        ]}
      />

      {activeListTab === 'instructor' ? (
        <MembersPermissionList
          ref={instructorListRef}
          memberType="instructor"
          detailUserId={permissionRole === 'instructor' ? detailUserId : null}
          onResolveDetailRow={permissionRole === 'instructor' ? handleResolveDetailRow : undefined}
          onOpenUserDetail={handleOpenUserDetail}
          onInstructorApproveRequest={payload => {
            setAdminApproveModal(null)
            setAdminRejectModal(null)
            setInstructorRejectModal(null)
            setInstructorApproveModal(
              payload.mode === 'single'
                ? {
                    variant: 'single',
                    userId: payload.userId,
                    requestId: payload.requestId,
                    displayName: payload.displayName,
                    source: 'list',
                  }
                : {
                    variant: 'bulk',
                    userIds: payload.userIds,
                    requestIds: payload.requestIds,
                    memberCount: payload.memberCount,
                    source: 'list',
                  }
            )
          }}
          onInstructorRejectRequest={payload => {
            const nextReject: InstructorRejectModalState =
              payload.mode === 'single'
                ? {
                    variant: 'single',
                    userId: payload.userId,
                    requestId: payload.requestId,
                    displayName: payload.displayName,
                    source: 'list',
                  }
                : {
                    variant: 'bulk',
                    userIds: payload.userIds,
                    requestIds: payload.requestIds,
                    memberCount: payload.memberCount,
                    source: 'list',
                  }
            setAdminApproveModal(null)
            setAdminRejectModal(null)
            setInstructorApproveModal(null)
            setInstructorRejectModal(nextReject)
          }}
        />
      ) : (
        <MembersPermissionList
          ref={adminListRef}
          memberType="admin"
          detailUserId={permissionRole === 'admin' ? detailUserId : null}
          onResolveDetailRow={permissionRole === 'admin' ? handleResolveDetailRow : undefined}
          onOpenUserDetail={handleOpenUserDetail}
          onAdminApproveRequest={payload => {
            setInstructorApproveModal(null)
            setInstructorRejectModal(null)
            setAdminRejectModal(null)
            setAdminApproveModal(
              payload.mode === 'single'
                ? {
                    variant: 'single',
                    userId: payload.userId,
                    requestId: payload.requestId,
                    displayName: payload.displayName,
                    source: 'list',
                  }
                : {
                    variant: 'bulk',
                    userIds: payload.userIds,
                    requestIds: payload.requestIds,
                    memberCount: payload.memberCount,
                    source: 'list',
                  }
            )
          }}
          onAdminRejectRequest={payload => {
            const nextReject: AdminRejectModalState =
              payload.mode === 'single'
                ? {
                    variant: 'single',
                    userId: payload.userId,
                    requestId: payload.requestId,
                    displayName: payload.displayName,
                    source: 'list',
                  }
                : {
                    variant: 'bulk',
                    userIds: payload.userIds,
                    requestIds: payload.requestIds,
                    memberCount: payload.memberCount,
                    source: 'list',
                  }
            setInstructorApproveModal(null)
            setInstructorRejectModal(null)
            setAdminApproveModal(null)
            setAdminRejectModal(nextReject)
          }}
        />
      )}

      {/* 상세 GET 대기 중에도 같은 모달 인스턴스가 스피너를 보여준다 (포털 교체 시 오픈 애니메이션 2회 재생) */}
      <UserDetailFullPageModal
        open={detailOpen && permissionRole != null}
        user={detailUser}
        onClose={handleCloseDetail}
        basicInfoEntrySource={basicInfoEntrySource}
        mode="permission"
        permissionRole={detailPermissionRole}
        onPermissionApprove={handlePermissionApprove}
        onPermissionReject={handlePermissionReject}
        onPermissionResetToPending={handlePermissionResetToPending}
        onPermissionResendNotification={handlePermissionResendNotification}
      />

      {instructorApproveModal ? (
        <InstructorPermissionApproveModal
          permissionKind="instructor"
          open
          zIndex={INSTRUCTOR_PERMISSION_APPROVE_MODAL_Z}
          onCancel={() => setInstructorApproveModal(null)}
          onConfirm={handleInstructorApproveModalConfirm}
          {...(instructorApproveModal.variant === 'single'
            ? {
                variant: 'single' as const,
                userDisplayName: instructorApproveModal.displayName,
              }
            : {
                variant: 'bulk' as const,
                memberCount: instructorApproveModal.memberCount,
              })}
        />
      ) : null}

      {adminApproveModal ? (
        <InstructorPermissionApproveModal
          permissionKind="admin"
          open
          zIndex={INSTRUCTOR_PERMISSION_APPROVE_MODAL_Z}
          onCancel={() => setAdminApproveModal(null)}
          onConfirm={handleAdminApproveModalConfirm}
          {...(adminApproveModal.variant === 'single'
            ? {
                variant: 'single' as const,
                userDisplayName: adminApproveModal.displayName,
              }
            : {
                variant: 'bulk' as const,
                memberCount: adminApproveModal.memberCount,
              })}
        />
      ) : null}

      {instructorRejectModal ? (
        <InstructorPermissionRejectModal
          key={
            instructorRejectModal.variant === 'single'
              ? `rej-${instructorRejectModal.userId}`
              : `rej-bulk-${instructorRejectModal.userIds.join(',')}`
          }
          permissionKind="instructor"
          open
          zIndex={INSTRUCTOR_PERMISSION_REJECT_MODAL_Z}
          onCancel={() => setInstructorRejectModal(null)}
          onConfirm={handleInstructorRejectModalConfirm}
          {...(instructorRejectModal.variant === 'single'
            ? {
                variant: 'single' as const,
                userDisplayName: instructorRejectModal.displayName,
              }
            : {
                variant: 'bulk' as const,
                memberCount: instructorRejectModal.memberCount,
              })}
        />
      ) : null}

      {adminRejectModal ? (
        <InstructorPermissionRejectModal
          key={
            adminRejectModal.variant === 'single'
              ? `admin-rej-${adminRejectModal.userId}`
              : `admin-rej-bulk-${adminRejectModal.userIds.join(',')}`
          }
          permissionKind="admin"
          open
          zIndex={INSTRUCTOR_PERMISSION_REJECT_MODAL_Z}
          onCancel={() => setAdminRejectModal(null)}
          onConfirm={handleAdminRejectModalConfirm}
          {...(adminRejectModal.variant === 'single'
            ? {
                variant: 'single' as const,
                userDisplayName: adminRejectModal.displayName,
              }
            : {
                variant: 'bulk' as const,
                memberCount: adminRejectModal.memberCount,
              })}
        />
      ) : null}

      {instructorApprovedComplete ? (
        <InstructorPermissionApprovedCompleteModal
          permissionKind="instructor"
          open
          zIndex={INSTRUCTOR_PERMISSION_APPROVED_COMPLETE_MODAL_Z}
          onClose={handleInstructorApprovedCompleteClose}
          {...(instructorApprovedComplete.variant === 'single'
            ? {
                variant: 'single' as const,
                userDisplayName: instructorApprovedComplete.displayName,
              }
            : {
                variant: 'bulk' as const,
                memberCount: instructorApprovedComplete.memberCount,
              })}
        />
      ) : null}

      {adminApprovedComplete ? (
        <InstructorPermissionApprovedCompleteModal
          permissionKind="admin"
          open
          zIndex={INSTRUCTOR_PERMISSION_APPROVED_COMPLETE_MODAL_Z}
          onClose={handleAdminApprovedCompleteClose}
          approvedPermissionVariant={adminApprovedComplete.approvedPermissionVariant}
          {...(adminApprovedComplete.variant === 'single'
            ? {
                variant: 'single' as const,
                userDisplayName: adminApprovedComplete.displayName,
              }
            : {
                variant: 'bulk' as const,
                memberCount: adminApprovedComplete.memberCount,
              })}
        />
      ) : null}

      {permissionStatusResetConfirm ? (
        <InstructorPermissionStatusResetConfirmModal
          open
          zIndex={PERMISSION_STATUS_RESET_CONFIRM_MODAL_Z}
          userDisplayName={permissionStatusResetConfirm.displayName}
          permissionRole={permissionStatusResetConfirm.permissionRole}
          fromStatus={permissionStatusResetConfirm.fromStatus}
          onCancel={handleCancelPermissionResetToPending}
          onConfirm={handleConfirmPermissionResetToPending}
        />
      ) : null}
    </div>
  )
}
