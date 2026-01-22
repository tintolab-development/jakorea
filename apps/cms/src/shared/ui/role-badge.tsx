/**
 * 권한 표시 컴포넌트
 * Phase 4.1.2: 권한 체계 정의
 * Phase 0.1.1: 역할 체계 재정의
 */

import { Badge, Tag } from 'antd'
import {
  TeamOutlined,
  SafetyOutlined,
  BookOutlined,
  HeartOutlined,
  UserOutlined,
  BankOutlined,
} from '@ant-design/icons'
import type { AdminProgramRole, AdminLevel, AdminRole, ProgramRole, UserRole } from '@/types/user'
import './role-badge.css'

interface RoleBadgeProps {
  role: UserRole
  adminLevel?: AdminLevel
  adminRole?: AdminRole // 하위 호환성
  programRole?: ProgramRole
  adminProgramRole?: AdminProgramRole // 하위 호환성
  showIcon?: boolean
  size?: 'default' | 'small' | 'large'
  variant?: 'badge' | 'tag'
}

// 권한별 설정
// Phase 0.1.1: INDIVIDUAL, SCHOOL 추가, STUDENT, VOLUNTEER는 하위 호환성
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
  INDIVIDUAL: {
    label: '개인(참여자)',
    color: 'orange',
    icon: <UserOutlined />,
  },
  SCHOOL: {
    label: '학교',
    color: 'purple',
    icon: <BankOutlined />,
  },
  // 하위 호환성
  STUDENT: {
    label: '수강자 (구)',
    color: 'orange',
    icon: <BookOutlined />,
  },
  VOLUNTEER: {
    label: '봉사자 (구)',
    color: 'green',
    icon: <HeartOutlined />,
  },
}

const adminLevelLabels: Record<AdminLevel, string> = {
  MASTER: '마스터 관리자',
  ADMIN: '관리자',
  GENERAL: '일반',
}

const programRoleLabels: Record<ProgramRole, string> = {
  OWNER: '담당자',
  PARTNER: '파트너',
  ASSISTANT: '보조',
}

// 하위 호환성 (getAdminProgramRoleLabel에서 사용)
const adminProgramRoleLabels: Record<AdminProgramRole, string> = programRoleLabels

/**
 * 권한 배지 컴포넌트
 * 사용자의 권한을 시각적으로 표시
 */
export function RoleBadge({
  role,
  adminLevel,
  adminRole, // 하위 호환성
  programRole: _programRole, // 향후 사용 예정
  adminProgramRole: _adminProgramRole, // 하위 호환성, 향후 사용 예정
  showIcon = true,
  size = 'default',
  variant = 'tag',
}: RoleBadgeProps) {
  const config = roleConfig[role]
  // Phase 0.1.1: adminLevel 우선 사용, 없으면 adminRole (하위 호환성)
  const effectiveAdminLevel = adminLevel || adminRole
  const label =
    role === 'ADMIN' && effectiveAdminLevel
      ? adminLevelLabels[effectiveAdminLevel]
      : config.label

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
 * Phase 0.1.1: adminLevel 지원 추가
 */
export function getRoleLabel(
  role: UserRole,
  adminLevel?: AdminLevel,
  adminRole?: AdminRole // 하위 호환성
): string {
  if (role === 'ADMIN') {
    const effectiveAdminLevel = adminLevel || adminRole
    if (effectiveAdminLevel) {
      return adminLevelLabels[effectiveAdminLevel]
    }
  }
  return roleConfig[role]?.label || role
}

/**
 * 권한 색상만 반환하는 함수
 */
export function getRoleColor(role: UserRole): string {
  return roleConfig[role]?.color || 'default'
}

/**
 * 관리자 권한 레벨 라벨 반환
 * Phase 0.1.1: AdminLevel 지원
 */
export function getAdminLevelLabel(level: AdminLevel): string {
  return adminLevelLabels[level] || level
}

/**
 * 프로그램 역할 라벨 반환
 * Phase 0.1.1: ProgramRole 지원
 */
export function getProgramRoleLabel(role: ProgramRole): string {
  return programRoleLabels[role] || role
}

// 하위 호환성 함수
/** @deprecated Use getProgramRoleLabel instead */
export function getAdminProgramRoleLabel(role: AdminProgramRole): string {
  // adminProgramRoleLabels를 사용하여 하위 호환성 유지
  return adminProgramRoleLabels[role] || getProgramRoleLabel(role as ProgramRole)
}

