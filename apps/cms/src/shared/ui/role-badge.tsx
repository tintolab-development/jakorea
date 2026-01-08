/**
 * 권한 표시 컴포넌트
 * Phase 4.1.2: 권한 체계 정의
 */

import { Badge, Tag } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  BookOutlined,
} from '@ant-design/icons'
import type { UserRole } from '@/types/user'

interface RoleBadgeProps {
  role: UserRole
  showIcon?: boolean
  size?: 'default' | 'small' | 'large'
  variant?: 'badge' | 'tag'
}

// 권한별 설정
const roleConfig: Record<
  UserRole,
  {
    label: string
    color: string
    icon: React.ReactNode
  }
> = {
  ADMIN: {
    label: '관리자',
    color: 'red',
    icon: <SafetyOutlined />,
  },
  INSTRUCTOR: {
    label: '강사',
    color: 'blue',
    icon: <TeamOutlined />,
  },
  VOLUNTEER: {
    label: '봉사자',
    color: 'green',
    icon: <UserOutlined />,
  },
  STUDENT: {
    label: '수강자',
    color: 'orange',
    icon: <BookOutlined />,
  },
}

/**
 * 권한 배지 컴포넌트
 * 사용자의 권한을 시각적으로 표시
 */
export function RoleBadge({
  role,
  showIcon = true,
  size = 'default',
  variant = 'tag',
}: RoleBadgeProps) {
  const config = roleConfig[role]

  if (variant === 'badge') {
    return (
      <Badge
        status={config.color as any}
        text={config.label}
        style={{ fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px' }}
      />
    )
  }

  // 관리자 권한의 경우 특별한 스타일 적용
  const isAdmin = role === 'ADMIN'
  const tagStyle: React.CSSProperties = {
    fontSize: size === 'small' ? '11px' : size === 'large' ? '16px' : '13px',
    padding: size === 'small' ? '2px 8px' : size === 'large' ? '6px 12px' : '3px 9px',
    borderRadius: '4px',
    border: isAdmin ? '1px solid #ff4d4f' : undefined,
    backgroundColor: isAdmin ? '#fff1f0' : undefined,
    color: isAdmin ? '#ff4d4f' : undefined,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'small' ? '2px' : '4px',
    lineHeight: size === 'small' ? '1.2' : '1.5',
  }

  return (
    <Tag
      color={isAdmin ? undefined : config.color}
      icon={showIcon ? config.icon : undefined}
      style={tagStyle}
    >
      {config.label}
    </Tag>
  )
}

/**
 * 권한 아이콘만 표시하는 컴포넌트
 */
export function RoleIcon({ role, size = 16 }: { role: UserRole; size?: number }) {
  const config = roleConfig[role]
  return <span style={{ fontSize: `${size}px` }}>{config.icon}</span>
}

/**
 * 권한 레이블만 반환하는 함수
 */
export function getRoleLabel(role: UserRole): string {
  return roleConfig[role].label
}

/**
 * 권한 색상만 반환하는 함수
 */
export function getRoleColor(role: UserRole): string {
  return roleConfig[role].color
}

