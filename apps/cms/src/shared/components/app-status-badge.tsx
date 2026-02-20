/**
 * 공통 배지 컴포넌트 (교재 현황 배지 스타일 기준)
 * 모든 도메인 배지는 이 베이스를 사용하고, className 모디파이어로 색상 구분
 */

import { Tag } from 'antd'
import './app-status-badge.css'

export interface AppStatusBadgeProps {
  /** 배지 텍스트 */
  label: string
  /** 모디파이어 클래스 (예: textbook-status-badge--preparing, app-status-badge--lifecycle--recruiting_students) */
  className?: string
}

/**
 * 교재 현황 배지와 동일한 레이아웃의 공통 배지.
 * 색상은 className으로 전달된 모디파이어에서 적용.
 */
export function AppStatusBadge({ label, className }: AppStatusBadgeProps) {
  return (
    <Tag className={`app-status-badge ${className ?? ''}`.trim()} style={{ margin: 0 }}>
      {label}
    </Tag>
  )
}
