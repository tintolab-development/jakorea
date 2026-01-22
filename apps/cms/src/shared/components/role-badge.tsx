/**
 * 권한 표시 배지 컴포넌트
 * Phase 4.1.2: 권한 체계 정의
 */

import { Tag } from 'antd'
import { UserOutlined, BookOutlined, CrownOutlined, HeartOutlined } from '@ant-design/icons'
import type { AdminRole, UserRole } from '@/types/user'

interface RoleBadgeProps {
  role: UserRole
  adminRole?: AdminRole
  showIcon?: boolean
}

// Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
const roleConfig: Record<
  UserRole,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ADMIN: {
    label: '관리자',
    color: 'red',
    icon: <CrownOutlined />,
  },
  INSTRUCTOR: {
    label: '강사',
    color: 'blue',
    icon: <UserOutlined />,
  },
  INDIVIDUAL: {
    label: '개인(참여자)',
    color: 'orange',
    icon: <UserOutlined />,
  },
  SCHOOL: {
    label: '학교',
    color: 'purple',
    icon: <BookOutlined />,
  },
  // 하위 호환성
  STUDENT: {
    label: '수강자 (구)',
    color: 'default',
    icon: <BookOutlined />,
  },
  VOLUNTEER: {
    label: '봉사자 (구)',
    color: 'green',
    icon: <HeartOutlined />,
  },
}

const adminRoleLabels: Record<AdminRole, string> = {
  MASTER: '마스터 관리자',
  ADMIN: '관리자',
  GENERAL: '일반',
}

export function RoleBadge({ role, adminRole, showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role]
  const label = role === 'ADMIN' && adminRole ? adminRoleLabels[adminRole] : config.label

  return (
    <Tag color={config.color} icon={showIcon ? config.icon : undefined} style={{ margin: 0 }}>
      {label}
    </Tag>
  )
}

