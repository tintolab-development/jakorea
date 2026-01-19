/**
 * 사용자 상세 Drawer
 * Phase 5.1.2: 사용자 관리 페이지
 */

import { Drawer, Descriptions, Tag, Space, Button } from 'antd'
import type { User } from '@/types/user'
import { RoleBadge } from '@/shared/ui'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'
import { formatDate } from '@/shared/utils'

interface UserDetailDrawerProps {
  open: boolean
  user: Omit<User, 'password'> | null
  onClose: () => void
  onEdit?: (user: Omit<User, 'password'>) => void
}

export function UserDetailDrawer({
  open,
  user,
  onClose,
  onEdit,
}: UserDetailDrawerProps) {
  if (!user) {
    return null
  }

  return (
    <Drawer
      title="사용자 상세 정보"
      placement="right"
      onClose={onClose}
      open={open}
      width={660}
      extra={
        onEdit && (
          <Space>
            <Button onClick={() => onEdit(user)}>권한 변경</Button>
          </Space>
        )
      }
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="이름">{user.name}</Descriptions.Item>
        <Descriptions.Item label="이메일">{user.email}</Descriptions.Item>
        <Descriptions.Item label="권한">
          <RoleBadge role={user.role} size="small" variant="tag" />
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={user.isActive ? 'green' : 'default'}>
            {user.isActive ? '활성' : '비활성'}
          </Tag>
        </Descriptions.Item>
        {(user.role === 'INSTRUCTOR' || user.role === 'STUDENT') && (
          <>
            <Descriptions.Item label="면접 상태">
              {user.interviewStatus ? (
                <InterviewStatusBadge status={user.interviewStatus} />
              ) : (
                <Tag>-</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="참여이력">
              {user.participationHistory ?? 0}건
            </Descriptions.Item>
            {user.interviewScheduledAt && (
              <Descriptions.Item label="면접 일정">
                {formatDate(new Date(user.interviewScheduledAt))}
              </Descriptions.Item>
            )}
            {user.interviewCompletedAt && (
              <Descriptions.Item label="면접 완료일">
                {formatDate(new Date(user.interviewCompletedAt))}
              </Descriptions.Item>
            )}
          </>
        )}
        {user.lastLoginAt && (
          <Descriptions.Item label="마지막 로그인">
            {formatDate(new Date(user.lastLoginAt))}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="생성일">
          {formatDate(new Date(user.createdAt))}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {formatDate(new Date(user.updatedAt))}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  )
}

