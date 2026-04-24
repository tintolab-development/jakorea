/**
 * 권한 승인 — 강사·관리자 탭, 회원 권한 신청 목록
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { Tabs } from 'antd'
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
import './permission-request-page.css'

const INSTRUCTOR_PERMISSION_APPROVE_MODAL_Z = 1150
/** 풀페이지 회원 상세(권한 모드) 위에도 반려 확인이 보이도록 여유 있게 */
const INSTRUCTOR_PERMISSION_REJECT_MODAL_Z = 2100
const INSTRUCTOR_PERMISSION_APPROVED_COMPLETE_MODAL_Z = 1160
const PERMISSION_STATUS_RESET_CONFIRM_MODAL_Z = 1160

type InstructorApproveModalState =
  | {
      variant: 'single'
      userId: string
      displayName: string
      source: 'list' | 'detail'
    }
  | {
      variant: 'bulk'
      userIds: string[]
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
      displayName: string
      source: 'list' | 'detail'
    }
  | { variant: 'bulk'; userIds: string[]; memberCount: number; source: 'list' }

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

export function PermissionRequestListPage() {
  const fetchUserById = useUserStore(s => s.fetchUserById)
  const instructorListRef = useRef<MembersPermissionListHandle>(null)
  const adminListRef = useRef<MembersPermissionListHandle>(null)
  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [permissionRole, setPermissionRole] = useState<UserDetailPermissionRole | null>(null)
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
  const detailUser = useUserStore(state =>
    detailUserId ? (state.usersById[detailUserId] ?? null) : null
  )

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
          setPermissionRole(role)
          setDetailUserId(userId)
          setDetailOpen(true)
        }
      } catch {
        // 회원 조회 실패 시 상세 모달 미오픈
      }
    },
    [fetchUserById]
  )

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailUserId(null)
    setPermissionRole(null)
  }, [])

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
    (_payload: InstructorPermissionApprovePayload) => {
      if (!instructorApproveModal) return
      if (instructorApproveModal.variant === 'single') {
        const { userId, source, displayName } = instructorApproveModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'APPROVED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
        syncDetailUserIfOpened(userId)
        instructorListRef.current?.applyInstructorPermissionApproved(userId)
        instructorListRef.current?.clearRowSelection()
        setInstructorApproveModal(null)
        setInstructorApprovedComplete({ variant: 'single', displayName, source })
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
        instructorListRef.current?.applyInstructorPermissionApproved(uid)
      })
      instructorListRef.current?.clearRowSelection()
      setInstructorApproveModal(null)
      setInstructorApprovedComplete({ variant: 'bulk', memberCount, source })
    },
    [instructorApproveModal, syncDetailUserIfOpened]
  )

  const handleAdminApproveModalConfirm = useCallback(
    (payload: InstructorPermissionApprovePayload) => {
      if (!adminApproveModal) return
      const approvedPermissionVariant = (
        payload.feeGrade === 'partner' || payload.feeGrade === 'viewer' ? payload.feeGrade : 'manager'
      ) as AdminPermissionTagVariant
      if (adminApproveModal.variant === 'single') {
        const { userId, source, displayName } = adminApproveModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'APPROVED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
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
        adminListRef.current?.applyInstructorPermissionApproved(uid)
      })
      adminListRef.current?.clearRowSelection()
      setAdminApproveModal(null)
      setAdminApprovedComplete({ variant: 'bulk', memberCount, source, approvedPermissionVariant })
    },
    [adminApproveModal, syncDetailUserIfOpened]
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
    (_payload: InstructorPermissionRejectPayload) => {
      if (!instructorRejectModal) return
      if (instructorRejectModal.variant === 'single') {
        const { userId } = instructorRejectModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'REJECTED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
        syncDetailUserIfOpened(userId)
        instructorListRef.current?.applyInstructorPermissionRejected(userId)
        instructorListRef.current?.clearRowSelection()
        setInstructorRejectModal(null)
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
        instructorListRef.current?.applyInstructorPermissionRejected(uid)
      })
      instructorListRef.current?.clearRowSelection()
      setInstructorRejectModal(null)
    },
    [instructorRejectModal, syncDetailUserIfOpened]
  )

  const handleAdminRejectModalConfirm = useCallback(
    (_payload: InstructorPermissionRejectPayload) => {
      if (!adminRejectModal) return
      if (adminRejectModal.variant === 'single') {
        const { userId } = adminRejectModal
        const nowIso = new Date().toISOString()
        updateMockUserById(userId, {
          permissionApprovalStatus: 'REJECTED',
          permissionApprovalHandledAt: nowIso,
          permissionNotificationResentAt: undefined,
        })
        syncDetailUserIfOpened(userId)
        adminListRef.current?.applyInstructorPermissionRejected(userId)
        adminListRef.current?.clearRowSelection()
        setAdminRejectModal(null)
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
        adminListRef.current?.applyInstructorPermissionRejected(uid)
      })
      adminListRef.current?.clearRowSelection()
      setAdminRejectModal(null)
    },
    [adminRejectModal, syncDetailUserIfOpened]
  )

  const handlePermissionResendNotification = useCallback(
    (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      updateMockUserById(ctx.userId, {
        permissionNotificationResentAt: new Date().toISOString(),
      })
    },
    []
  )

  const detailPermissionRole = permissionRole ?? undefined

  return (
    <div>
      <Tabs
        defaultActiveKey="instructor"
        className="permission-request-list-page__tabs"
        items={[
          {
            key: 'instructor',
            label: '강사',
            children: (
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
                          displayName: payload.displayName,
                          source: 'list',
                        }
                      : {
                          variant: 'bulk',
                          userIds: payload.userIds,
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
                          displayName: payload.displayName,
                          source: 'list',
                        }
                      : {
                          variant: 'bulk',
                          userIds: payload.userIds,
                          memberCount: payload.memberCount,
                          source: 'list',
                        }
                  setAdminApproveModal(null)
                  setAdminRejectModal(null)
                  setInstructorApproveModal(null)
                  setInstructorRejectModal(nextReject)
                }}
              />
            ),
          },
          {
            key: 'admin',
            label: '관리자',
            children: (
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
                          displayName: payload.displayName,
                          source: 'list',
                        }
                      : {
                          variant: 'bulk',
                          userIds: payload.userIds,
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
                          displayName: payload.displayName,
                          source: 'list',
                        }
                      : {
                          variant: 'bulk',
                          userIds: payload.userIds,
                          memberCount: payload.memberCount,
                          source: 'list',
                        }
                  setInstructorApproveModal(null)
                  setInstructorRejectModal(null)
                  setAdminApproveModal(null)
                  setAdminRejectModal(nextReject)
                }}
              />
            ),
          },
        ]}
      />

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
