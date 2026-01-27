/**
 * 권한 표시 배지 컴포넌트
 * Phase 4.1.2: 권한 체계 정의
 */

import { Tag } from 'antd'
import { UserOutlined, BookOutlined, CrownOutlined } from '@ant-design/icons'
import type { AdminLevel, UserRole } from '@/types/user'

interface RoleBadgeProps {
  role: UserRole
  adminLevel?: AdminLevel
  showIcon?: boolean
}

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
    label: '학생',
    color: 'orange',
    icon: <UserOutlined />,
  },
  SCHOOL: {
    label: '학교',
    color: 'purple',
    icon: <BookOutlined />,
  },
}

const adminLevelLabels: Record<AdminLevel, string> = {
  MASTER: '마스터 관리자',
  ADMIN: '중간 관리자',
  GENERAL: '일반 관리자',
}

export function RoleBadge({ role, adminLevel, showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role]
  const label = role === 'ADMIN' && adminLevel ? adminLevelLabels[adminLevel] : config.label

  return (
    <Tag color={config.color} icon={showIcon ? config.icon : undefined} style={{ margin: 0 }}>
      {label}
    </Tag>
  )
}

