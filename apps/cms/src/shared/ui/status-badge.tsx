/**
 * 상태 배지 컴포넌트
 * 상태별 라벨, 색상, 아이콘을 통합 관리
 */

import { Tag, Badge } from 'antd'

export interface StatusConfig {
  label: string
  color: string
  icon?: React.ComponentType
}

export interface StatusBadgeProps {
  /** 상태 값 */
  status: string
  /** 상태 설정 객체 (label, color, icon 포함) */
  statusConfig: Record<string, StatusConfig>
  /** Badge 표시 여부 (false면 Tag만 표시) */
  showBadge?: boolean
  /** 아이콘 표시 여부 */
  showIcon?: boolean
  /** 크기 */
  size?: 'small' | 'default' | 'large'
  /** variant: tag 또는 badge */
  variant?: 'tag' | 'badge'
}

/**
 * 상태 배지 컴포넌트
 * 
 * @example
 * ```tsx
 * const statusConfig = {
 *   active: { label: '활성', color: 'green', icon: CheckCircleOutlined },
 *   inactive: { label: '비활성', color: 'default' },
 * }
 * 
 * <StatusBadge status="active" statusConfig={statusConfig} />
 * ```
 */
export function StatusBadge({
  status,
  statusConfig,
  showBadge = false,
  showIcon = true,
  size = 'default',
  variant = 'tag',
}: StatusBadgeProps) {
  const config = statusConfig[status]
  
  if (!config) {
    return <Tag>{status}</Tag>
  }

  const { label, color, icon: Icon } = config

  if (variant === 'badge') {
    return (
      <Badge
        status={color as any}
        text={label}
        style={{ fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px' }}
      />
    )
  }

  const fontSize = size === 'small' ? '12px' : size === 'large' ? '16px' : '14px'
  const padding = size === 'small' ? '2px 8px' : size === 'large' ? '6px 12px' : '3px 9px'

  return (
    <Tag
      color={color}
      icon={showIcon && Icon ? <Icon /> : undefined}
      style={{
        fontSize,
        padding,
        margin: 0,
      }}
    >
      {showBadge && <Badge status={color as any} style={{ marginRight: 4 }} />}
      {label}
    </Tag>
  )
}
