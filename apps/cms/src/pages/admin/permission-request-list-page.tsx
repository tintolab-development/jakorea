/**
 * 권한 승인 — 강사·관리자 탭, 회원 권한 신청 목록
 */

import { useCallback, useMemo, useState } from 'react'
import { Tabs, message } from 'antd'
import { MembersPermissionList } from '@/features/user/permission-management/members-permission-list'
import { UserDetailFullPageModal } from '@/pages/users/user-detail-fullpage-modal'
import { useUserStore } from '@/features/user/shared/model/user-store'
import { userRoleToBasicInfoEntrySource } from '@/shared/config/member-list-kinds'
import type { UserDetailPermissionRole } from '@/pages/users/user-detail-fullpage-modal'
import { updateMockUserById } from '@/data/mock/users'
import './permission-request-page.css'

export function PermissionRequestListPage() {
  const fetchUserById = useUserStore(s => s.fetchUserById)
  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [permissionRole, setPermissionRole] = useState<UserDetailPermissionRole | null>(null)

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
        } else {
          message.error('회원 정보를 찾을 수 없습니다.')
        }
      } catch {
        message.error('회원 정보를 불러오지 못했습니다.')
      }
    },
    [fetchUserById]
  )

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailUserId(null)
    setPermissionRole(null)
  }, [])

  const handlePermissionApprove = useCallback(
    (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      updateMockUserById(ctx.userId, { permissionApprovalStatus: 'APPROVED' })
      message.success(
        ctx.permissionRole === 'instructor'
          ? '강사 권한 신청을 승인했습니다.'
          : '관리자 권한 신청을 승인했습니다.'
      )
      handleCloseDetail()
    },
    [handleCloseDetail]
  )

  const handlePermissionReject = useCallback(
    (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      updateMockUserById(ctx.userId, { permissionApprovalStatus: 'REJECTED' })
      message.success(
        ctx.permissionRole === 'instructor'
          ? '강사 권한 신청을 반려했습니다.'
          : '관리자 권한 신청을 반려했습니다.'
      )
      handleCloseDetail()
    },
    [handleCloseDetail]
  )

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
                memberType="instructor"
                onOpenUserDetail={handleOpenUserDetail}
              />
            ),
          },
          {
            key: 'admin',
            label: '관리자',
            children: (
              <MembersPermissionList memberType="admin" onOpenUserDetail={handleOpenUserDetail} />
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
        permissionRole={permissionRole ?? undefined}
        onPermissionApprove={handlePermissionApprove}
        onPermissionReject={handlePermissionReject}
      />
    </div>
  )
}
