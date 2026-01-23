/**
 * 사용자 상세 Drawer
 * Phase 5.1.2: 사용자 관리 페이지
 */

import { Descriptions, Tag } from 'antd'
import type { User } from '@/types/user'
import { RoleBadge, getProgramRoleLabel, getRoleLabel } from '@/shared/ui'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'
import { formatDate } from '@/shared/utils'
import { useUserStore, selectSelectedUser } from '@/features/user/model/user-store'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'

interface UserDetailDrawerProps {
  open: boolean
  user?: Omit<User, 'password'> | null // optional로 변경하여 store의 selectedUser 우선 사용
  onClose: () => void
  onEdit?: (user: Omit<User, 'password'>) => void
}

export function UserDetailDrawer({ open, user, onClose, onEdit }: UserDetailDrawerProps) {
  // 스토어에서 선택된 사용자 가져오기 (selector 사용)
  const storeSelectedUser = useUserStore(state => selectSelectedUser(state))

  // prop의 user를 우선 사용 (즉시 표시), 없으면 store의 selectedUser 사용
  const displayUser = user || storeSelectedUser || null

  if (!displayUser) {
    return null
  }

  // 액션 버튼 구성
  const actions = onEdit
    ? [
        {
          key: 'edit',
          label: '권한 변경',
          onClick: () => onEdit(displayUser),
        },
      ]
    : []

  return (
    <BaseDetailDrawer
      open={open}
      onClose={onClose}
      title="사용자 상세 정보"
      width={660}
      actions={actions}
      hideActions={!onEdit}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="이름">{displayUser.name}</Descriptions.Item>
        <Descriptions.Item label="이메일">{displayUser.email}</Descriptions.Item>
        <Descriptions.Item label="권한">
          <RoleBadge
            role={displayUser.role}
            adminLevel={displayUser.adminLevel}
            size="small"
            variant="tag"
          />
        </Descriptions.Item>
        {displayUser.role === 'ADMIN' && displayUser.adminLevel && (
          <Descriptions.Item label="관리자 구분">
            {getRoleLabel('ADMIN', displayUser.adminLevel)}
          </Descriptions.Item>
        )}
        {displayUser.role === 'ADMIN' && displayUser.programRoles && (
          <Descriptions.Item label="프로그램 범위">
            {Object.values(displayUser.programRoles)[0]
              ? getProgramRoleLabel(Object.values(displayUser.programRoles)[0])
              : '-'}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="상태">
          <Tag color={displayUser.isActive ? 'green' : 'default'}>
            {displayUser.isActive ? '활성' : '비활성'}
          </Tag>
        </Descriptions.Item>
        {(displayUser.role === 'INSTRUCTOR' ||
          displayUser.role === 'INDIVIDUAL' ||
          displayUser.role === 'SCHOOL') && (
          <>
            <Descriptions.Item label="면접 상태">
              {displayUser.interviewStatus ? (
                <InterviewStatusBadge status={displayUser.interviewStatus} />
              ) : (
                <Tag>-</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="참여이력">
              {displayUser.participationHistory ?? 0}건
            </Descriptions.Item>
            {displayUser.interviewScheduledAt && (
              <Descriptions.Item label="면접 일정">
                {formatDate(new Date(displayUser.interviewScheduledAt))}
              </Descriptions.Item>
            )}
            {displayUser.interviewCompletedAt && (
              <Descriptions.Item label="면접 완료일">
                {formatDate(new Date(displayUser.interviewCompletedAt))}
              </Descriptions.Item>
            )}
          </>
        )}
        {displayUser.lastLoginAt && (
          <Descriptions.Item label="마지막 로그인">
            {formatDate(new Date(displayUser.lastLoginAt))}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="생성일">
          {formatDate(new Date(displayUser.createdAt))}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {formatDate(new Date(displayUser.updatedAt))}
        </Descriptions.Item>
      </Descriptions>
    </BaseDetailDrawer>
  )
}
