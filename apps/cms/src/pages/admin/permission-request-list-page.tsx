/**
 * 권한 승인 — 강사·관리자 탭, 회원 권한 신청 목록
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  MembersPermissionList,
  type MembersPermissionListHandle,
} from '@/features/user/permission-management/members-permission-list'
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
import { useUserStore } from '@/features/user/shared/model/user-store'
import { userRoleToBasicInfoEntrySource } from '@/shared/config/member-list-kinds'
import type { UserDetailPermissionRole } from '@/pages/users/user-detail-fullpage-modal'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import { updateMockUserById } from '@/data/mock/users'
import {
  isAdminApprovalRequestsRemoteEnabled,
  isInstructorRoleRequestsRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'
import { useInstructorRoleRequestMutations } from '@/features/user/api/hooks/use-instructor-role-request-mutations'
import { useAdminApprovalRequestMutations } from '@/features/user/api/hooks/use-admin-approval-request-mutations'
import { handleError } from '@/shared/utils/error-handler'
import { resendInstructorRoleNotificationRemote } from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
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
  | { variant: 'bulk'; userIds: string[]; requestIds?: number[]; memberCount: number; source: 'list' }

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

export function PermissionRequestListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const fetchUserById = useUserStore(s => s.fetchUserById)
  const instructorListRef = useRef<MembersPermissionListHandle>(null)
  const adminListRef = useRef<MembersPermissionListHandle>(null)
  const instructorRemote = isInstructorRoleRequestsRemoteEnabled()
  const adminRemote = isAdminApprovalRequestsRemoteEnabled()
  const { approveMutation, rejectMutation, getApproveError, getRejectError } =
    useInstructorRoleRequestMutations()
  const {
    approveMutation: adminApproveMutation,
    rejectMutation: adminRejectMutation,
    getApproveError: getAdminApproveError,
    getRejectError: getAdminRejectError,
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
  const detailUser = useUserStore(state =>
    detailUserId ? (state.usersById[detailUserId] ?? null) : null
  )

  useEffect(() => {
    if (!detailUserId || !urlPermissionRole) return
    void fetchUserById(detailUserId)
  }, [detailUserId, urlPermissionRole, fetchUserById])

  const basicInfoEntrySource = useMemo(
    () => (detailUser ? userRoleToBasicInfoEntrySource(detailUser.role) : undefined),
    [detailUser]
  )

  const handleOpenUserDetail = useCallback(
    async (userId: string, role: UserDetailPermissionRole) => {
      try {
        await fetchUserById(userId)
        const u = useUserStore.getState().usersById[userId]
        if (u) {
          setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.set(PR_DETAIL_USER, userId)
            next.set(PR_DETAIL_ROLE, role)
            return next
          }, { replace: false })
        }
      } catch {
        // 회원 조회 실패 시 상세 모달 미오픈
      }
    },
    [fetchUserById, setSearchParams]
  )

  const handleCloseDetail = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete(PR_DETAIL_USER)
      next.delete(PR_DETAIL_ROLE)
      return next
    }, { replace: true })
  }, [setSearchParams])

  const syncDetailUserIfOpened = useCallback(
    (userId: string) => {
      if (!detailOpen || !detailUserId || detailUserId !== userId) return
      void fetchUserById(userId)
    },
    [detailOpen, detailUserId, fetchUserById]
  )

  const handlePermissionApprove = useCallback(
    (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      if (ctx.permissionRole === 'instructor') {
        const name = detailUser?.name?.trim() || '회원'
        setAdminApproveModal(null)
        setAdminRejectModal(null)
        setInstructorRejectModal(null)
        setInstructorApproveModal({
          variant: 'single',
          userId: ctx.userId,
          displayName: name,
          source: 'detail',
        })
        return
      }
      if (ctx.permissionRole === 'admin') {
        const name = detailUser?.name?.trim() || '회원'
        setInstructorApproveModal(null)
        setInstructorRejectModal(null)
        setAdminRejectModal(null)
        setAdminApproveModal({
          variant: 'single',
          userId: ctx.userId,
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
    [detailUser, handleCloseDetail]
  )

  const handleInstructorApproveModalConfirm = useCallback(
    async (payload: InstructorPermissionApprovePayload) => {
      if (!instructorApproveModal) return

      const finishSingle = (userId: string, displayName: string, source: 'list' | 'detail') => {
        syncDetailUserIfOpened(userId)
        instructorListRef.current?.applyInstructorPermissionApproved(userId)
        instructorListRef.current?.clearRowSelection()
        setInstructorApproveModal(null)
        setInstructorApprovedComplete({ variant: 'single', displayName, source })
      }

      const finishBulk = (userIds: string[], memberCount: number, source: 'list') => {
        userIds.forEach(uid => {
          instructorListRef.current?.applyInstructorPermissionApproved(uid)
        })
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
    [
      instructorApproveModal,
      instructorRemote,
      approveMutation,
      getApproveError,
      syncDetailUserIfOpened,
    ]
  )

  const handleAdminApproveModalConfirm = useCallback(
    async (payload: InstructorPermissionApprovePayload) => {
      if (!adminApproveModal) return
      const approvedPermissionVariant = (
        payload.feeGrade === 'partner' || payload.feeGrade === 'viewer' ? payload.feeGrade : 'manager'
      ) as AdminPermissionTagVariant

      const finishSingle = (
        userId: string,
        displayName: string,
        source: 'list' | 'detail'
      ) => {
        syncDetailUserIfOpened(userId)
        adminListRef.current?.applyInstructorPermissionApproved(userId)
        adminListRef.current?.clearRowSelection()
        setAdminApproveModal(null)
        setAdminApprovedComplete({
          variant: 'single',
          displayName,
          source,
          approvedPermissionVariant,
        })
      }

      const finishBulk = (
        userIds: string[],
        memberCount: number,
        source: 'list'
      ) => {
        userIds.forEach(uid => {
          adminListRef.current?.applyInstructorPermissionApproved(uid)
        })
        adminListRef.current?.clearRowSelection()
        setAdminApproveModal(null)
        setAdminApprovedComplete({ variant: 'bulk', memberCount, source, approvedPermissionVariant })
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
    [
      adminApproveModal,
      adminRemote,
      adminApproveMutation,
      getAdminApproveError,
      syncDetailUserIfOpened,
    ]
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
        const name = detailUser?.name?.trim() || '회원'
        setAdminApproveModal(null)
        setAdminRejectModal(null)
        setInstructorApproveModal(null)
        setInstructorRejectModal({
          variant: 'single',
          userId: ctx.userId,
          displayName: name,
          source: 'detail',
        })
        return
      }
      if (ctx.permissionRole === 'admin') {
        const name = detailUser?.name?.trim() || '회원'
        setInstructorApproveModal(null)
        setInstructorRejectModal(null)
        setAdminApproveModal(null)
        setAdminRejectModal({
          variant: 'single',
          userId: ctx.userId,
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
    [detailUser, handleCloseDetail]
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
    (_payload: { cancellationReason: string; notifyTiming: 'immediate' | 'manual' }) => {
    if (!permissionStatusResetConfirm) return
    const { userId, permissionRole } = permissionStatusResetConfirm
    updateMockUserById(userId, {
      permissionApprovalStatus: 'PENDING',
      permissionApprovalHandledAt: undefined,
      permissionNotificationResentAt: undefined,
    })
    syncDetailUserIfOpened(userId)
    if (permissionRole === 'instructor') {
      instructorListRef.current?.applyInstructorPermissionPending(userId)
    } else {
      adminListRef.current?.applyInstructorPermissionPending(userId)
    }
    setPermissionStatusResetConfirm(null)
    },
    [permissionStatusResetConfirm, syncDetailUserIfOpened]
  )

  const handleCancelPermissionResetToPending = useCallback(() => {
    setPermissionStatusResetConfirm(null)
  }, [])

  const handleInstructorRejectModalConfirm = useCallback(
    async (payload: InstructorPermissionRejectPayload) => {
      if (!instructorRejectModal) return

      const finishSingle = (userId: string) => {
        syncDetailUserIfOpened(userId)
        instructorListRef.current?.applyInstructorPermissionRejected(userId)
        instructorListRef.current?.clearRowSelection()
        setInstructorRejectModal(null)
      }

      const finishBulk = (userIds: string[]) => {
        userIds.forEach(uid => {
          instructorListRef.current?.applyInstructorPermissionRejected(uid)
        })
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
    [instructorRejectModal, instructorRemote, rejectMutation, getRejectError, syncDetailUserIfOpened]
  )

  const handleAdminRejectModalConfirm = useCallback(
    async (payload: InstructorPermissionRejectPayload) => {
      if (!adminRejectModal) return

      const finishSingle = (userId: string) => {
        syncDetailUserIfOpened(userId)
        adminListRef.current?.applyInstructorPermissionRejected(userId)
        adminListRef.current?.clearRowSelection()
        setAdminRejectModal(null)
      }

      const finishBulk = (userIds: string[]) => {
        userIds.forEach(uid => {
          adminListRef.current?.applyInstructorPermissionRejected(uid)
        })
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
    [adminRejectModal, adminRemote, adminRejectMutation, getAdminRejectError, syncDetailUserIfOpened]
  )

  const handlePermissionResendNotification = useCallback(
    async (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      if (ctx.permissionRole === 'instructor' && isInstructorRoleRequestsRemoteEnabled()) {
        const requestId = instructorListRef.current?.getRequestIdForUser(ctx.userId)
        if (requestId == null) {
          handleError(new Error('알림 재발송할 권한 신청 ID를 찾지 못했습니다.'), {
            context: 'permissionRequestList.resendNotification.missingRequestId',
          })
          return
        }
        try {
          await resendInstructorRoleNotificationRemote(requestId)
          updateMockUserById(ctx.userId, {
            permissionNotificationResentAt: new Date().toISOString(),
          })
        } catch (error) {
          handleError(error, {
            defaultMessage: getMemberApiErrorMessage(error, '알림 재발송에 실패했습니다.'),
          })
        }
        return
      }

      // 관리자 승인 알림 재발송 API는 Orval members subset에 없음 — 로컬 시각만 갱신
      updateMockUserById(ctx.userId, {
        permissionNotificationResentAt: new Date().toISOString(),
      })
      if (ctx.permissionRole === 'admin') {
        handleError(new Error('관리자 권한 알림 재발송 API는 아직 제공되지 않습니다.'), {
          context: 'permissionRequestList.resendNotification.adminApiMissing',
        })
      }
    },
    []
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

      <UserDetailFullPageModal
        open={detailOpen && detailUser != null && permissionRole != null}
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
