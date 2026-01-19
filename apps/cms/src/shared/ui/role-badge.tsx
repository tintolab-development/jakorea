/**
 * 권한 표시 컴포넌트
 * Phase 4.1.2: 권한 체계 정의
 */

import { Badge, Tag } from 'antd'
import {
  TeamOutlined,
  SafetyOutlined,
  BookOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import type { AdminProgramRole, AdminRole, UserRole } from '@/types/user'
import './role-badge.css'

interface RoleBadgeProps {
  role: UserRole
  adminRole?: AdminRole
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
  STUDENT: {
    label: '수강자',
    color: 'orange',
    icon: <BookOutlined />,
  },
  VOLUNTEER: {
    label: '봉사자',
    color: 'green',
    icon: <HeartOutlined />,
  },
}

const adminRoleLabels: Record<AdminRole, string> = {
  MASTER: '마스터 관리자',
  ADMIN: '관리자',
  GENERAL: '일반',
}

const adminProgramRoleLabels: Record<AdminProgramRole, string> = {
  OWNER: '담당자',
  PARTNER: '파트너',
  ASSISTANT: '보조',
}

/**
 * 권한 배지 컴포넌트
 * 사용자의 권한을 시각적으로 표시
 */
export function RoleBadge({
  role,
  adminRole,
  showIcon = true,
  size = 'default',
  variant = 'tag',
}: RoleBadgeProps) {
  const config = roleConfig[role]
  const label = role === 'ADMIN' && adminRole ? adminRoleLabels[adminRole] : config.label

  if (variant === 'badge') {
    return (
      <Badge
        status={config.color as any}
        text={label}
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
      {label}
    </Tag>
  )
}

/**
 * 권한 아이콘만 표시하는 컴포넌트
 */
export function RoleIcon({ role, size = 'default' }: { role: UserRole; size?: 'small' | 'default' | 'large' }) {
  const config = roleConfig[role]
  return <span className={`role-icon role-icon--${size}`}>{config.icon}</span>
}

/**
 * 권한 레이블만 반환하는 함수
 */
export function getRoleLabel(role: UserRole, adminRole?: AdminRole): string {
  if (role === 'ADMIN' && adminRole) {
    return adminRoleLabels[adminRole]
  }
  return roleConfig[role].label
}

/**
 * 권한 색상만 반환하는 함수
 */
export function getRoleColor(role: UserRole): string {
  return roleConfig[role].color
}

export function getAdminProgramRoleLabel(role: AdminProgramRole): string {
  return adminProgramRoleLabels[role]
}

