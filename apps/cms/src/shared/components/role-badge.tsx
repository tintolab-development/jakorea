/**
 * 권한 표시 배지 컴포넌트
 * Phase 4.1.2: 권한 체계 정의
 */

import { Tag } from 'antd'
import { UserOutlined, BookOutlined, CrownOutlined, HeartOutlined } from '@ant-design/icons'
import type { UserRole } from '@/types/user'

interface RoleBadgeProps {
  role: UserRole
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
  STUDENT: {
    label: '수강자',
    color: 'default',
    icon: <BookOutlined />,
  },
  VOLUNTEER: {
    label: '봉사자',
    color: 'green',
    icon: <HeartOutlined />,
  },
}

export function RoleBadge({ role, showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role]

  return (
    <Tag color={config.color} icon={showIcon ? config.icon : undefined} style={{ margin: 0 }}>
      {config.label}
    </Tag>
  )
}

